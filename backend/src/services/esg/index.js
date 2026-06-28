import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { csrProjects } from '../../db/schema.js'
import { getComplianceSummary, getFundAllocation } from '../compliance/index.js'
import { getSdgProgress } from '../impact/analytics.js'
import { BRSR_PRINCIPLES, mapProject, mapThemeToPillar, THEME_TO_SDG } from './taxonomy.js'
import { getSustainabilityKpis, rollupByPillar } from './kpi-engine.js'

async function getProjects(tenantId) {
  return await db
    .select()
    .from(csrProjects)
    .where(eq(csrProjects.corporateTenantId, tenantId))
    .all()
    .filter((p) => p.status !== 'archived' && p.status !== 'rejected')
}

function getComplianceSubset(tenantId) {
  try {
    const c = getComplianceSummary(tenantId)
    const passCount = (c.scheduleVIIValidation || []).filter((v) => v.status === 'pass').length
    const totalChecks = c.scheduleVIIValidation?.length || 1
    return {
      auditReadiness: c.auditReadiness?.score ?? c.complianceScore ?? 0,
      scheduleViiValid: passCount === totalChecks,
      scheduleViiPassRate: Math.round((passCount / totalChecks) * 100),
      alertsOpen: (c.alerts || []).length,
      deadlines: (c.deadlines || c.dueDates || []).slice(0, 4).map((d, i) => ({
        id: d.id ?? i + 1,
        title: d.title || d.message?.slice(0, 60) || 'Compliance deadline',
        date: d.date,
        urgent: d.urgent ?? d.level === 'critical',
      })),
      unspent: c.spend?.unspent ?? 0,
      obligation: c.section135?.csrObligation ?? 0,
    }
  } catch {
    return {
      auditReadiness: 0,
      scheduleViiValid: false,
      scheduleViiPassRate: 0,
      alertsOpen: 0,
      deadlines: [],
      unspent: 0,
      obligation: 0,
    }
  }
}

export function buildEsgContext(tenantId) {
  const projects = getProjects(tenantId)
  const kpiRollup = rollupByPillar(tenantId)
  const sustainabilityKpis = getSustainabilityKpis(tenantId)
  const compliance = getComplianceSubset(tenantId)
  const sdgProgress = getSdgProgress(tenantId)
  let funds = { obligation: 0, totalSpent: 0, unallocated: 0, categories: [] }
  try {
    funds = getFundAllocation(tenantId)
  } catch {
    // partial data ok
  }

  return {
    tenantId,
    projects,
    kpiRollup,
    sustainabilityKpis,
    compliance,
    sdgProgress,
    funds,
  }
}

function computePillarScore({ spendShare, projectShare, kpiBoost, extra = 0 }) {
  const raw = spendShare * 40 + projectShare * 30 + kpiBoost * 20 + extra * 10
  return Math.min(100, Math.round(raw))
}

export function computePillarScores(context) {
  const { projects, kpiRollup, compliance, sustainabilityKpis } = context
  const totalSpend = projects.reduce((s, p) => s + (p.spentInr || 0), 0) || 1

  const pillarSpend = { environmental: 0, social: 0, governance: 0 }
  const pillarProjects = { environmental: 0, social: 0, governance: 0 }

  for (const p of projects) {
    const pillar = mapThemeToPillar(p.theme || 'Other')
    pillarSpend[pillar] += p.spentInr || 0
    pillarProjects[pillar] += 1
  }

  const envKpis = kpiRollup.environmental?.kpis || []
  const socialKpis = kpiRollup.social?.kpis || []

  const environmental = {
    score: computePillarScore({
      spendShare: pillarSpend.environmental / totalSpend,
      projectShare: pillarProjects.environmental / (projects.length || 1),
      kpiBoost: envKpis.length ? Math.min(envKpis.length / 2, 1) : 0,
    }),
    spend: pillarSpend.environmental,
    projectCount: pillarProjects.environmental,
    kpis: envKpis,
    highlights: envKpis.slice(0, 3).map((k) => `${k.label}: ${k.value}${k.unit ? ` ${k.unit}` : ''}`),
  }

  const social = {
    score: computePillarScore({
      spendShare: pillarSpend.social / totalSpend,
      projectShare: pillarProjects.social / (projects.length || 1),
      kpiBoost: socialKpis.length ? Math.min(socialKpis.length / 3, 1) : 0,
    }),
    spend: pillarSpend.social,
    projectCount: pillarProjects.social,
    kpis: socialKpis,
    highlights: socialKpis.slice(0, 3).map((k) => `${k.label}: ${k.value}${k.unit ? ` ${k.unit}` : ''}`),
  }

  const govExtra =
    (compliance.auditReadiness / 100) * 0.5 +
    (compliance.scheduleViiPassRate / 100) * 0.3 +
    (compliance.alertsOpen === 0 ? 0.2 : 0)

  const governance = {
    score: computePillarScore({
      spendShare: 0,
      projectShare: 0,
      kpiBoost: 0,
      extra: govExtra,
    }),
    spend: 0,
    projectCount: 0,
    kpis: [],
    highlights: [
      `Audit readiness: ${compliance.auditReadiness}%`,
      `Schedule VII validation: ${compliance.scheduleViiPassRate}%`,
      compliance.alertsOpen ? `${compliance.alertsOpen} open alert(s)` : 'No open compliance alerts',
    ],
    auditReadiness: compliance.auditReadiness,
    scheduleViiValid: compliance.scheduleViiValid,
    scheduleViiPassRate: compliance.scheduleViiPassRate,
    alertsOpen: compliance.alertsOpen,
    deadlines: compliance.deadlines,
  }

  return { environmental, social, governance }
}

export function buildSdgAlignment(context) {
  return (context.sdgProgress || []).map((s) => ({
    sdg: s.sdg,
    label: s.label || THEME_TO_SDG[Object.keys(THEME_TO_SDG).find((t) => THEME_TO_SDG[t].sdg === s.sdg)]?.label,
    projects: s.projects,
    spend: s.spend,
    beneficiaries: s.beneficiaries,
  }))
}

export function buildBrsrCoverage(context) {
  const { projects, sustainabilityKpis, compliance } = context
  const principleProjects = new Map(BRSR_PRINCIPLES.map((p) => [p.id, new Set()]))
  const principleIndicators = new Map(BRSR_PRINCIPLES.map((p) => [p.id, []]))

  for (const p of projects) {
    const mapped = mapProject(p)
    for (const pid of mapped.brsrPrinciples) {
      principleProjects.get(pid)?.add(p.id)
      principleIndicators.get(pid)?.push({
        type: 'project',
        label: p.name,
        value: p.spentInr || 0,
        unit: 'INR',
      })
    }
  }

  for (const kpi of sustainabilityKpis) {
    if (!kpi.brsr) continue
    principleProjects.get(kpi.brsr)?.add(`kpi:${kpi.key}`)
    principleIndicators.get(kpi.brsr)?.push({
      type: 'kpi',
      label: kpi.label,
      value: kpi.value,
      unit: kpi.unit,
    })
  }

  // P1 governance indicators from compliance
  if (compliance.auditReadiness > 0) {
    principleProjects.get(1)?.add('compliance:audit')
    principleIndicators.get(1)?.push({
      type: 'compliance',
      label: 'Audit readiness score',
      value: compliance.auditReadiness,
      unit: '%',
    })
  }
  if (compliance.scheduleViiPassRate > 0) {
    principleProjects.get(1)?.add('compliance:scheduleVii')
    principleIndicators.get(1)?.push({
      type: 'compliance',
      label: 'Schedule VII validation rate',
      value: compliance.scheduleViiPassRate,
      unit: '%',
    })
  }

  const activeCount = projects.length || 1

  return BRSR_PRINCIPLES.map((principle) => {
    const linked = principleProjects.get(principle.id) || new Set()
    const indicators = principleIndicators.get(principle.id) || []
    const coverage = linked.size > 0 ? Math.min(100, Math.round((linked.size / activeCount) * 100)) : 0
    return {
      principle: principle.id,
      title: principle.title,
      description: principle.description,
      coverage,
      status: coverage > 0 ? 'partial' : 'no_data',
      indicators,
      projectIds: [...linked].filter((id) => !String(id).startsWith('kpi:') && !String(id).startsWith('compliance:')),
    }
  })
}

export function buildProjectMappings(context) {
  return context.projects.map((p) => {
    const mapped = mapProject(p)
    return {
      id: p.id,
      name: p.name,
      theme: mapped.theme,
      pillar: mapped.pillar,
      sdg: mapped.sdg,
      sdgLabel: mapped.sdgLabel,
      brsrPrinciples: mapped.brsrPrinciples,
      scheduleVII: mapped.scheduleVII,
      spent: p.spentInr || 0,
    }
  })
}

export function getUnifiedEsgDashboard(tenantId, _options = {}) {
  const context = buildEsgContext(tenantId)
  const pillars = computePillarScores(context)
  const sdgAlignment = buildSdgAlignment(context)
  const brsr = buildBrsrCoverage(context)
  const projectMappings = buildProjectMappings(context)
  const sustainabilityKpis = context.sustainabilityKpis

  const csrSummary = {
    obligation: context.funds.obligation ?? context.compliance.obligation,
    spent: context.funds.totalSpent ?? 0,
    unallocated: context.funds.unallocated ?? context.compliance.unspent,
    themes: (context.funds.categories || []).map((c) => ({
      theme: c.theme,
      allocated: c.allocated,
      spent: c.spent,
    })),
  }

  return {
    pillars,
    sdgAlignment,
    brsr,
    sustainabilityKpis,
    csrSummary,
    projectMappings,
    updatedAt: new Date().toISOString(),
  }
}
