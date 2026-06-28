import { eq, and, isNull } from 'drizzle-orm'
import { db } from '../../db/index.js'
import {
  csrProjects,
  corporateCsrProfile,
  complianceAlerts,
  tenants,
} from '../../db/schema.js'
import { newId } from '../../lib/ids.js'
import { logMutation } from '../activity-log/index.js'
import {
  computeSection135,
  computeSpendBreakdown,
  validateScheduleVii,
  getComplianceDueDates,
  evaluateAlerts,
} from './rules.js'

function httpError(message, status) {
  const err = new Error(message)
  err.status = status
  return err
}

export async function getOrCreateProfile(tenantId, fyLabel = 'FY 2025-26') {
  let profile = await db.select().from(corporateCsrProfile)
    .where(and(eq(corporateCsrProfile.tenantId, tenantId), eq(corporateCsrProfile.fyLabel, fyLabel)))
    .get()
  if (!profile) {
    const now = new Date()
    const id = newId()
    await db.insert(corporateCsrProfile).values({
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
    profile = await db.select().from(corporateCsrProfile).where(eq(corporateCsrProfile.id, id)).get()
  }
  return profile
}

export async function updateProfile(tenantId, patch, fyLabel = 'FY 2025-26', req) {
  const profile = getOrCreateProfile(tenantId, fyLabel)
  const before = {
    netProfitInr: profile.netProfitInr,
    turnoverInr: profile.turnoverInr,
    netWorthInr: profile.netWorthInr,
    fyLabel: profile.fyLabel,
  }
  const updates = { updatedAt: new Date() }
  if (patch.netProfitInr !== undefined) updates.netProfitInr = patch.netProfitInr
  if (patch.turnoverInr !== undefined) updates.turnoverInr = patch.turnoverInr
  if (patch.netWorthInr !== undefined) updates.netWorthInr = patch.netWorthInr
  if (patch.fyLabel !== undefined) updates.fyLabel = patch.fyLabel
  if (patch.adminCapPct !== undefined) updates.adminCapPct = patch.adminCapPct
  if (patch.localAreaTargetPct !== undefined) updates.localAreaTargetPct = patch.localAreaTargetPct
  if (patch.carryForwardInr !== undefined) updates.carryForwardInr = patch.carryForwardInr
  await db.update(corporateCsrProfile).set(updates).where(eq(corporateCsrProfile.id, profile.id)).run()
  if (req) {
    logMutation({
      req,
      action: 'compliance.profile.update',
      entityType: 'compliance',
      entityId: profile.id,
      before,
      after: updates,
    }).catch(() => {})
  }
  return getOrCreateProfile(tenantId, patch.fyLabel || fyLabel)
}

export async function syncAlerts(tenantId, profile, spend) {
  const candidates = evaluateAlerts(tenantId, profile, spend)

  for (const a of candidates) {
    const exists = await db.select().from(complianceAlerts)
      .where(and(
        eq(complianceAlerts.tenantId, tenantId),
        eq(complianceAlerts.ruleKey, a.ruleKey),
        isNull(complianceAlerts.acknowledgedAt),
      ))
      .get()
    if (!exists) {
      await db.insert(complianceAlerts).values({
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

export function syncComplianceForTenant(tenantId, fyLabel = 'FY 2025-26') {
  const profile = getOrCreateProfile(tenantId, fyLabel)
  const spend = computeSpendBreakdown(tenantId)
  syncAlerts(tenantId, profile, spend)
  return { tenantId, synced: true }
}

export async function getComplianceSummary(tenantId, fyLabel = 'FY 2025-26') {
  const profile = getOrCreateProfile(tenantId, fyLabel)
  const section135 = computeSection135(profile)
  const spendData = computeSpendBreakdown(tenantId)
  const totalObligation = section135.csrObligation
  const unspent = Math.max(totalObligation - spendData.totalSpent, 0) + profile.carryForwardInr

  syncAlerts(tenantId, profile, spendData)

  const alerts = await db.select().from(complianceAlerts)
    .where(and(eq(complianceAlerts.tenantId, tenantId), isNull(complianceAlerts.acknowledgedAt)))
    .all()
    .map((a) => ({
      id: a.id,
      level: a.level,
      message: a.message,
      date: a.dueDate || a.createdAt.toISOString().slice(0, 10),
      entityType: a.entityType,
      entityId: a.entityId,
    }))

  const scheduleVIIValidation = validateScheduleVii(tenantId, profile, spendData)
  const passCount = scheduleVIIValidation.filter((v) => v.status === 'pass').length
  const auditScore = Math.round((passCount / scheduleVIIValidation.length) * 100)

  const tenant = await db.select().from(tenants).where(eq(tenants.id, tenantId)).get()
  const projects = await db.select().from(csrProjects).where(eq(csrProjects.corporateTenantId, tenantId)).all()
  const dueDates = getComplianceDueDates(profile.fyLabel)

  return {
    section135: {
      eligible: section135.eligible,
      netWorth: section135.netWorth,
      turnover: section135.turnover,
      netProfit: section135.netProfit,
      csrObligation: section135.csrObligation,
      obligationRate: section135.obligationRate,
      averageNetProfit: section135.averageNetProfit,
      criteria: section135.criteria,
      obligationBreakdown: section135.obligationBreakdown,
      fy: section135.fy,
    },
    spend: {
      totalObligation,
      spent: spendData.totalSpent,
      administrative: spendData.adminSpent,
      unspent,
      carryForward: profile.carryForwardInr,
      breakdown: spendData.breakdown,
    },
    dueDates,
    scheduleVIIValidation,
    auditReadiness: {
      score: auditScore,
      checklist: [
        { item: 'CSR policy updated', done: true },
        { item: 'Board resolution on CSR', done: true },
        { item: 'Utilization certificates collected', done: spendData.totalSpent > 0 },
        { item: 'Impact assessments filed', done: !scheduleVIIValidation.some((v) => v.item.includes('Impact') && v.status !== 'pass') },
        { item: 'MCA CSR-2 draft ready', done: true },
      ],
    },
    alerts,
    mcaReportPreview: {
      companyName: tenant?.name || 'Company',
      cin: 'L12345MH2010PLC123456',
      fy: profile.fyLabel.replace('FY ', ''),
      totalCSR: spendData.totalSpent,
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

export async function exportMcaCsr2(tenantId, fyLabel = 'FY 2025-26') {
  const summary = getComplianceSummary(tenantId, fyLabel)
  const tenant = await db.select().from(tenants).where(eq(tenants.id, tenantId)).get()
  const projects = await db.select().from(csrProjects)
    .where(eq(csrProjects.corporateTenantId, tenantId))
    .all()
    .filter((p) => p.status !== 'archived' && p.status !== 'rejected')

  return {
    form: 'MCA CSR-2',
    company: {
      name: tenant?.name || 'Company',
      cin: summary.mcaReportPreview.cin,
    },
    financialYear: summary.section135.fy,
    section135: {
      eligible: summary.section135.eligible,
      criteria: summary.section135.criteria,
      averageNetProfit: summary.section135.averageNetProfit,
      csrObligation: summary.section135.csrObligation,
      obligationFormula: summary.section135.obligationBreakdown.formula,
    },
    spending: {
      totalSpent: summary.spend.spent,
      administrative: summary.spend.administrative,
      unspent: summary.spend.unspent,
      carryForward: summary.spend.carryForward,
    },
    scheduleViiBreakdown: summary.spend.breakdown,
    validation: summary.scheduleVIIValidation,
    projects: projects.map(async (p) => {
      const ngo = await db.select().from(tenants).where(eq(tenants.id, p.ngoTenantId)).get()
      return {
        name: p.name,
        ngo: ngo?.name,
        scheduleVii: p.scheduleVii,
        theme: p.theme,
        location: p.location || p.state,
        budgetInr: p.budgetInr,
        spentInr: p.spentInr,
        status: p.status,
        startDate: p.startDate,
        endDate: p.endDate,
      }
    }),
    generatedAt: new Date().toISOString(),
  }
}

export async function getFundAllocation(tenantId) {
  const profile = getOrCreateProfile(tenantId)
  const { csrObligation } = computeSection135(profile)
  const projects = await db.select().from(csrProjects)
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
    projects: projects.map(async (p) => {
      const ngo = await db.select().from(tenants).where(eq(tenants.id, p.ngoTenantId)).get()
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

export async function acknowledgeAlert(alertId, tenantId, req) {
  const alert = await db.select().from(complianceAlerts).where(eq(complianceAlerts.id, alertId)).get()
  if (!alert || alert.tenantId !== tenantId) throw httpError('Alert not found', 404)
  await db.update(complianceAlerts)
    .set({ acknowledgedAt: new Date() })
    .where(eq(complianceAlerts.id, alertId))
    .run()
  if (req) {
    logMutation({
      req,
      action: 'compliance.alert.acknowledge',
      entityType: 'compliance_alert',
      entityId: alertId,
      before: { acknowledgedAt: null },
      after: { acknowledgedAt: new Date().toISOString() },
    }).catch(() => {})
  }
  return { acknowledged: true, id: alertId }
}

export function seedComplianceProfile(tenantId) {
  return getOrCreateProfile(tenantId)
}
