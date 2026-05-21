import { eq, and, isNull } from 'drizzle-orm'
import { db } from '../../db/index.js'
import {
  csrProjects,
  corporateCsrProfile,
  complianceAlerts,
  projectMilestones,
  tenants,
} from '../../db/schema.js'
import { newId } from '../../lib/ids.js'
import { aggregateForTenant } from '../impact/index.js'

const SCHEDULE_VII_OPTIONS = [
  'Promoting education',
  'Promoting health care',
  'Ensuring environmental sustainability',
  'Employment enhancing vocation skills',
  'Rural development projects',
  'Administrative overheads',
  'Eradicating hunger, poverty and malnutrition',
  'Promoting gender equality and empowering women',
]

function httpError(message, status) {
  const err = new Error(message)
  err.status = status
  return err
}

export function getOrCreateProfile(tenantId, fyLabel = 'FY 2025-26') {
  let profile = db.select().from(corporateCsrProfile)
    .where(and(eq(corporateCsrProfile.tenantId, tenantId), eq(corporateCsrProfile.fyLabel, fyLabel)))
    .get()
  if (!profile) {
    const now = new Date()
    const id = newId()
    db.insert(corporateCsrProfile).values({
      id,
      tenantId,
      fyLabel,
      netProfitInr: 450000000,
      turnoverInr: 12000000000,
      netWorthInr: 8500000000,
      adminCapPct: 5,
      localAreaTargetPct: 70,
      carryForwardInr: 5200000,
      obligationThresholdInr: 50000000,
      createdAt: now,
      updatedAt: now,
    }).run()
    profile = db.select().from(corporateCsrProfile).where(eq(corporateCsrProfile.id, id)).get()
  }
  return profile
}

export function updateProfile(tenantId, patch, fyLabel = 'FY 2025-26') {
  const profile = getOrCreateProfile(tenantId, fyLabel)
  const updates = { updatedAt: new Date() }
  if (patch.netProfitInr !== undefined) updates.netProfitInr = patch.netProfitInr
  if (patch.turnoverInr !== undefined) updates.turnoverInr = patch.turnoverInr
  if (patch.netWorthInr !== undefined) updates.netWorthInr = patch.netWorthInr
  if (patch.fyLabel !== undefined) updates.fyLabel = patch.fyLabel
  if (patch.adminCapPct !== undefined) updates.adminCapPct = patch.adminCapPct
  if (patch.localAreaTargetPct !== undefined) updates.localAreaTargetPct = patch.localAreaTargetPct
  if (patch.carryForwardInr !== undefined) updates.carryForwardInr = patch.carryForwardInr
  db.update(corporateCsrProfile).set(updates).where(eq(corporateCsrProfile.id, profile.id)).run()
  return getOrCreateProfile(tenantId, patch.fyLabel || fyLabel)
}

function computeObligation(profile) {
  const eligible = profile.netProfitInr >= profile.obligationThresholdInr
  const csrObligation = eligible ? Math.round(profile.netProfitInr * 0.02) : 0
  return { eligible, csrObligation, obligationRate: 2 }
}

function computeSpendBreakdown(tenantId) {
  const projects = db.select().from(csrProjects).where(eq(csrProjects.corporateTenantId, tenantId)).all()
  const byCategory = new Map()
  let totalSpent = 0
  let adminSpent = 0

  for (const p of projects) {
    if (p.status === 'archived' || p.status === 'rejected') continue
    const cat = p.theme || 'Other'
    byCategory.set(cat, (byCategory.get(cat) || 0) + (p.spentInr || 0))
    totalSpent += p.spentInr || 0
    if (p.scheduleVii?.toLowerCase().includes('administrative')) {
      adminSpent += p.spentInr || 0
    }
  }

  const breakdown = [...byCategory.entries()].map(([category, amount]) => {
    const scheduleVii = projects.find((p) => p.theme === category)?.scheduleVii || category
    const valid = SCHEDULE_VII_OPTIONS.some((s) => scheduleVii.toLowerCase().includes(s.toLowerCase().slice(0, 8)))
    return { category, amount, scheduleVII: scheduleVii, valid }
  })

  return { totalSpent, adminSpent, breakdown }
}

function validateScheduleVii(tenantId, profile, spend) {
  const projects = db.select().from(csrProjects)
    .where(eq(csrProjects.corporateTenantId, tenantId))
    .all()
    .filter((p) => p.status === 'active' || p.status === 'pending_approval')

  const unmapped = projects.filter((p) => !SCHEDULE_VII_OPTIONS.some((s) =>
    p.scheduleVii?.toLowerCase().includes(s.toLowerCase().slice(0, 10))))

  const adminPct = spend.totalSpent > 0 ? (spend.adminSpent / spend.totalSpent) * 100 : 0
  const adminOk = adminPct <= profile.adminCapPct

  const localStates = new Set(['Maharashtra'])
  const localSpend = projects
    .filter((p) => localStates.has(p.state || p.location?.split(',').pop()?.trim()))
    .reduce((s, p) => s + (p.spentInr || 0), 0)
  const localPct = spend.totalSpent > 0 ? (localSpend / spend.totalSpent) * 100 : 0

  const { csrObligation } = computeObligation(profile)
  const unspent = Math.max(csrObligation - spend.totalSpent, 0) + profile.carryForwardInr

  return [
    { item: 'All projects mapped to Schedule VII', status: unmapped.length ? 'warn' : 'pass', note: unmapped.length ? `${unmapped.length} project(s) need review` : undefined },
    { item: 'Admin expenses within 5% cap', status: adminOk ? 'pass' : 'fail', note: adminOk ? undefined : `Admin at ${adminPct.toFixed(1)}%` },
    { item: 'Geographic preference (local area) met', status: localPct >= profile.localAreaTargetPct ? 'pass' : 'warn', note: `${Math.round(localPct)}% local vs ${profile.localAreaTargetPct}% target` },
    { item: 'Implementing agency due diligence', status: 'pass' },
    { item: 'Impact assessment for large projects', status: 'warn', note: '2 projects pending IA' },
    { item: 'Unspent CSR fund transfer plan', status: unspent > 5000000 ? 'fail' : 'pass', note: unspent > 5000000 ? `₹${(unspent / 10000000).toFixed(2)} Cr unallocated` : undefined },
  ]
}

function syncAlerts(tenantId, profile, spend, validation) {
  const { csrObligation } = computeObligation(profile)
  const unspent = Math.max(csrObligation - spend.totalSpent, 0) + profile.carryForwardInr

  const dynamicAlerts = []
  if (unspent > 5000000) {
    dynamicAlerts.push({
      level: 'warning',
      ruleKey: 'unspent_csr',
      message: `Unspent CSR ₹${(unspent / 10000000).toFixed(2)} Cr requires transfer plan by Mar 31`,
      dueDate: '2026-03-31',
    })
  }

  const projects = db.select().from(csrProjects).where(eq(csrProjects.corporateTenantId, tenantId)).all()
  const today = new Date().toISOString().slice(0, 10)
  for (const p of projects) {
    const milestones = db.select().from(projectMilestones).where(eq(projectMilestones.projectId, p.id)).all()
    for (const m of milestones) {
      if (m.status !== 'completed' && m.dueDate && m.dueDate < today) {
        dynamicAlerts.push({
          level: 'critical',
          ruleKey: 'milestone_overdue',
          message: `Milestone overdue: ${m.title} (${p.name})`,
          dueDate: m.dueDate,
          entityType: 'project',
          entityId: p.id,
        })
      }
    }
  }

  const staticAlerts = [
    { level: 'info', ruleKey: 'csr2_filing', message: 'CSR-2 filing window opens Feb 1', dueDate: '2026-02-01' },
  ]

  for (const a of [...dynamicAlerts, ...staticAlerts]) {
    const exists = db.select().from(complianceAlerts)
      .where(and(
        eq(complianceAlerts.tenantId, tenantId),
        eq(complianceAlerts.ruleKey, a.ruleKey),
        isNull(complianceAlerts.acknowledgedAt),
      ))
      .get()
    if (!exists) {
      db.insert(complianceAlerts).values({
        id: newId(),
        tenantId,
        level: a.level,
        ruleKey: a.ruleKey,
        message: a.message,
        dueDate: a.dueDate || null,
        entityType: a.entityType || null,
        entityId: a.entityId || null,
        createdAt: new Date(),
      }).run()
    }
  }
}

export function getComplianceSummary(tenantId, fyLabel = 'FY 2025-26') {
  const profile = getOrCreateProfile(tenantId, fyLabel)
  const { eligible, csrObligation, obligationRate } = computeObligation(profile)
  const spend = computeSpendBreakdown(tenantId)
  const totalObligation = csrObligation
  const unspent = Math.max(totalObligation - spend.totalSpent, 0) + profile.carryForwardInr

  syncAlerts(tenantId, profile, spend, [])
  const alerts = db.select().from(complianceAlerts)
    .where(and(eq(complianceAlerts.tenantId, tenantId), isNull(complianceAlerts.acknowledgedAt)))
    .all()
    .map((a, i) => ({
      id: a.id,
      level: a.level,
      message: a.message,
      date: a.dueDate || a.createdAt.toISOString().slice(0, 10),
    }))

  const scheduleVIIValidation = validateScheduleVii(tenantId, profile, spend)
  const passCount = scheduleVIIValidation.filter((v) => v.status === 'pass').length
  const auditScore = Math.round((passCount / scheduleVIIValidation.length) * 100)

  const tenant = db.select().from(tenants).where(eq(tenants.id, tenantId)).get()
  const projects = db.select().from(csrProjects).where(eq(csrProjects.corporateTenantId, tenantId)).all()

  return {
    section135: {
      eligible,
      netWorth: profile.netWorthInr,
      turnover: profile.turnoverInr,
      netProfit: profile.netProfitInr,
      csrObligation,
      obligationRate,
      fy: profile.fyLabel,
    },
    spend: {
      totalObligation,
      spent: spend.totalSpent,
      administrative: spend.adminSpent,
      unspent,
      carryForward: profile.carryForwardInr,
      breakdown: spend.breakdown,
    },
    dueDates: [
      { id: 1, title: 'CSR-2 Form filing with MCA', date: '2026-03-31', status: 'upcoming' },
      { id: 2, title: 'Annual CSR Committee meeting', date: '2026-02-15', status: 'upcoming' },
      { id: 3, title: 'Transfer unspent CSR (if applicable)', date: '2026-04-30', status: 'upcoming' },
      { id: 4, title: 'Q3 Utilization certificates', date: '2026-01-15', status: spend.totalSpent > 0 ? 'upcoming' : 'overdue' },
    ],
    scheduleVIIValidation,
    auditReadiness: {
      score: auditScore,
      checklist: [
        { item: 'CSR policy updated', done: true },
        { item: 'Board resolution on CSR', done: true },
        { item: 'Utilization certificates collected', done: spend.totalSpent > 0 },
        { item: 'Impact assessments filed', done: false },
        { item: 'MCA CSR-2 draft ready', done: true },
      ],
    },
    alerts,
    mcaReportPreview: {
      companyName: tenant?.name || 'Company',
      cin: 'L12345MH2010PLC123456',
      fy: profile.fyLabel.replace('FY ', ''),
      totalCSR: spend.totalSpent,
      unspent,
      projects: projects.filter((p) => p.status === 'active').length,
    },
    complianceScore: auditScore,
    deadlines: alerts.slice(0, 4).map((a, i) => ({
      id: i + 1,
      title: a.message.slice(0, 60),
      date: a.date,
      type: a.level === 'critical' ? 'document' : 'regulatory',
      urgent: a.level === 'critical',
    })),
  }
}

export function getFundAllocation(tenantId) {
  const profile = getOrCreateProfile(tenantId)
  const { csrObligation } = computeObligation(profile)
  const projects = db.select().from(csrProjects)
    .where(eq(csrProjects.corporateTenantId, tenantId))
    .all()
    .filter((p) => p.status !== 'archived' && p.status !== 'rejected')

  const allocated = projects.reduce((s, p) => s + p.budgetInr, 0)
  const spent = projects.reduce((s, p) => s + p.spentInr, 0)

  const byTheme = new Map()
  for (const p of projects) {
    const theme = p.theme || 'Other'
    const cur = byTheme.get(theme) || { theme, allocated: 0, spent: 0, projects: [] }
    cur.allocated += p.budgetInr
    cur.spent += p.spentInr
    cur.projects.push({ id: p.id, name: p.name, budget: p.budgetInr, spent: p.spentInr })
    byTheme.set(theme, cur)
  }

  return {
    obligation: csrObligation,
    totalBudget: allocated,
    totalSpent: spent,
    unallocated: Math.max(csrObligation - allocated, 0),
    categories: [...byTheme.values()],
    projects: projects.map((p) => {
      const ngo = db.select().from(tenants).where(eq(tenants.id, p.ngoTenantId)).get()
      return {
        id: p.id,
        name: p.name,
        ngo: ngo?.name,
        theme: p.theme,
        budget: p.budgetInr,
        spent: p.spentInr,
        status: p.status,
      }
    }),
  }
}

export function acknowledgeAlert(alertId, tenantId) {
  const alert = db.select().from(complianceAlerts).where(eq(complianceAlerts.id, alertId)).get()
  if (!alert || alert.tenantId !== tenantId) throw httpError('Alert not found', 404)
  db.update(complianceAlerts)
    .set({ acknowledgedAt: new Date() })
    .where(eq(complianceAlerts.id, alertId))
    .run()
  return { acknowledged: true, id: alertId }
}

export function seedComplianceProfile(tenantId) {
  return getOrCreateProfile(tenantId)
}
