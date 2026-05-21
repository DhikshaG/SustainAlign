import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { csrProjects, projectMilestones } from '../../db/schema.js'
import { SCHEDULE_VII_OPTIONS } from '../../schemas/projects.js'

const NET_WORTH_THRESHOLD = 50_000_000_000 // ₹500 Cr
const TURNOVER_THRESHOLD = 100_000_000_000 // ₹1000 Cr

export function formatInrShort(amount) {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)} Cr`
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(2)} L`
  return `₹${amount.toLocaleString('en-IN')}`
}

export function computeSection135(profile) {
  const netWorthMet = profile.netWorthInr >= NET_WORTH_THRESHOLD
  const turnoverMet = profile.turnoverInr >= TURNOVER_THRESHOLD
  const netProfitMet = profile.netProfitInr >= profile.obligationThresholdInr
  const eligible = netWorthMet || turnoverMet || netProfitMet

  const averageNetProfit = profile.netProfitInr
  const csrObligation = eligible ? Math.round(averageNetProfit * 0.02) : 0

  return {
    eligible,
    csrObligation,
    obligationRate: 2,
    averageNetProfit,
    netWorth: profile.netWorthInr,
    turnover: profile.turnoverInr,
    netProfit: profile.netProfitInr,
    fy: profile.fyLabel,
    criteria: { netWorthMet, turnoverMet, netProfitMet },
    obligationBreakdown: {
      formula: eligible
        ? `2% × ${formatInrShort(averageNetProfit)} average net profit`
        : 'Not applicable — Section 135 thresholds not met',
      averageNetProfit,
      ratePct: 2,
      result: csrObligation,
    },
  }
}

export function computeSpendBreakdown(tenantId) {
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
    const valid = SCHEDULE_VII_OPTIONS.some((s) =>
      scheduleVii?.toLowerCase().includes(s.toLowerCase().slice(0, 10)))
    return { category, amount, scheduleVII: scheduleVii, valid }
  })

  return { totalSpent, adminSpent, breakdown }
}

export function validateScheduleVii(tenantId, profile, spend) {
  const projects = db.select().from(csrProjects)
    .where(eq(csrProjects.corporateTenantId, tenantId))
    .all()
    .filter((p) => p.status === 'active' || p.status === 'pending_approval')

  const unmapped = projects.filter((p) =>
    !SCHEDULE_VII_OPTIONS.some((s) => p.scheduleVii === s))

  const adminPct = spend.totalSpent > 0 ? (spend.adminSpent / spend.totalSpent) * 100 : 0
  const adminOk = adminPct <= profile.adminCapPct

  const localStates = new Set([profile.registeredState || 'Maharashtra'])
  const localSpend = projects
    .filter((p) => localStates.has(p.state || p.location?.split(',').pop()?.trim()))
    .reduce((s, p) => s + (p.spentInr || 0), 0)
  const localPct = spend.totalSpent > 0 ? (localSpend / spend.totalSpent) * 100 : 0

  const largePending = projects.filter((p) => (p.budgetInr || 0) >= 10_000_000 && p.progress < 50)

  const { csrObligation } = computeSection135(profile)
  const unspent = Math.max(csrObligation - spend.totalSpent, 0) + profile.carryForwardInr

  return [
    {
      item: 'All projects mapped to Schedule VII',
      status: unmapped.length ? 'warn' : 'pass',
      note: unmapped.length
        ? `${unmapped.length} project(s) need Schedule VII review: ${unmapped.map((p) => p.name).join(', ')}`
        : 'All active projects have valid Schedule VII categories',
    },
    {
      item: 'Admin expenses within cap',
      status: adminOk ? 'pass' : 'fail',
      note: adminOk
        ? `Admin spend ${adminPct.toFixed(1)}% (cap ${profile.adminCapPct}%)`
        : `Admin at ${adminPct.toFixed(1)}% exceeds ${profile.adminCapPct}% cap`,
    },
    {
      item: 'Geographic preference (local area)',
      status: localPct >= profile.localAreaTargetPct ? 'pass' : 'warn',
      note: `${Math.round(localPct)}% in local area vs ${profile.localAreaTargetPct}% target`,
    },
    {
      item: 'Implementing agency due diligence',
      status: projects.every((p) => p.ngoTenantId) ? 'pass' : 'warn',
      note: projects.length ? 'Verified NGO partners assigned' : 'No active projects',
    },
    {
      item: 'Impact assessment for large projects',
      status: largePending.length ? 'warn' : 'pass',
      note: largePending.length
        ? `${largePending.length} large project(s) pending impact assessment`
        : 'No pending impact assessments',
    },
    {
      item: 'Unspent CSR fund transfer plan',
      status: unspent > 5_000_000 ? 'fail' : 'pass',
      note: unspent > 5_000_000
        ? `${formatInrShort(unspent)} unspent requires transfer plan by Mar 31`
        : 'Unspent CSR within acceptable limits',
    },
  ]
}

export function getComplianceDueDates(fyLabel = 'FY 2025-26') {
  const match = fyLabel.match(/(\d{4})-(\d{2})/)
  const endYear = match ? (match[2].length === 2 ? 2000 + parseInt(match[2], 10) : parseInt(match[2], 10)) : 2026

  return [
    { id: 1, title: 'Q3 Utilization certificates', date: `${endYear - 1}-01-15`, status: 'upcoming' },
    { id: 2, title: 'Annual CSR Committee meeting', date: `${endYear - 1}-02-15`, status: 'upcoming' },
    { id: 3, title: 'CSR-2 Form filing with MCA', date: `${endYear}-03-31`, status: 'upcoming' },
    { id: 4, title: 'Transfer unspent CSR (if applicable)', date: `${endYear}-04-30`, status: 'upcoming' },
  ]
}

export function evaluateAlerts(tenantId, profile, spend) {
  const { csrObligation } = computeSection135(profile)
  const unspent = Math.max(csrObligation - spend.totalSpent, 0) + profile.carryForwardInr
  const alerts = []

  if (unspent > 5_000_000) {
    alerts.push({
      level: 'warning',
      ruleKey: 'unspent_csr',
      message: `Unspent CSR ${formatInrShort(unspent)} requires transfer plan by Mar 31`,
      dueDate: `${new Date().getFullYear()}-03-31`,
    })
  }

  const projects = db.select().from(csrProjects).where(eq(csrProjects.corporateTenantId, tenantId)).all()
  const today = new Date().toISOString().slice(0, 10)
  for (const p of projects) {
    const milestones = db.select().from(projectMilestones).where(eq(projectMilestones.projectId, p.id)).all()
    for (const m of milestones) {
      if (m.status !== 'completed' && m.dueDate && m.dueDate < today) {
        alerts.push({
          level: 'critical',
          ruleKey: `milestone_overdue_${m.id}`,
          message: `Milestone overdue: ${m.title} (${p.name})`,
          dueDate: m.dueDate,
          entityType: 'project',
          entityId: p.id,
        })
      }
    }
  }

  const dueDates = getComplianceDueDates(profile.fyLabel)
  alerts.push({
    level: 'info',
    ruleKey: 'csr2_filing',
    message: `CSR-2 filing due ${dueDates[2].date}`,
    dueDate: dueDates[2].date,
  })

  return alerts
}
