import { eq, and, desc, asc } from 'drizzle-orm'
import { db } from '../../db/index.js'
import {
  csrProjects,
  projectKpis,
  projectBeneficiaryLogs,
  projectGeoUpdates,
  projectUpdateFiles,
  projectUpdates,
  projectMilestones,
  tenants,
  files,
  entityTags,
  tags,
  tagCategories,
} from '../../db/schema.js'
import { newId } from '../../lib/ids.js'
import { logMutation } from '../activity-log/index.js'
import {
  getLatestKpiValue,
  getBeneficiaryTimeSeries,
  buildSpendProgress,
  buildBudgetUtilization,
  getDistrictImpact,
  getSdgProgress,
  getMediaFeed,
} from './analytics.js'
import { THEME_TO_SDG } from '../esg/taxonomy.js'

function httpError(message, status) {
  const err = new Error(message)
  err.status = status
  return err
}

async function assertProjectAccess(projectId, { corporateTenantId, ngoTenantId }) {
  const row = await db.select().from(csrProjects).where(eq(csrProjects.id, projectId)).get()
  if (!row) throw httpError('Project not found', 404)
  if (corporateTenantId && row.corporateTenantId !== corporateTenantId) {
    throw httpError('Project not found', 404)
  }
  if (ngoTenantId && row.ngoTenantId !== ngoTenantId) {
    throw httpError('Project not found', 404)
  }
  return row
}

export async function getLatestBeneficiaries(projectId) {
  const log = await db
    .select()
    .from(projectBeneficiaryLogs)
    .where(eq(projectBeneficiaryLogs.projectId, projectId))
    .orderBy(desc(projectBeneficiaryLogs.recordedAt))
    .limit(1)
    .get()
  if (!log) return { direct: 0, indirect: 0, added: 0, history: [] }
  const history = await db
    .select()
    .from(projectBeneficiaryLogs)
    .where(eq(projectBeneficiaryLogs.projectId, projectId))
    .orderBy(desc(projectBeneficiaryLogs.recordedAt))
    .all()
    .map((h) => ({
      id: h.id,
      direct: h.directCount,
      indirect: h.indirectCount,
      note: h.note,
      recordedAt: h.recordedAt,
    }))
  return {
    direct: log.directCount,
    indirect: log.indirectCount,
    added: log.directCount + log.indirectCount,
    history,
  }
}

export async function listKpis(projectId) {
  return await db
    .select()
    .from(projectKpis)
    .where(eq(projectKpis.projectId, projectId))
    .orderBy(desc(projectKpis.recordedAt))
    .all()
    .map((k) => ({
      id: k.id,
      metricKey: k.metricKey,
      label: k.label,
      value: k.value,
      unit: k.unit,
      recordedAt: k.recordedAt,
    }))
}

export async function listGeoUpdates(projectId) {
  return await db
    .select()
    .from(projectGeoUpdates)
    .where(eq(projectGeoUpdates.projectId, projectId))
    .orderBy(desc(projectGeoUpdates.effectiveDate))
    .all()
    .map((g) => ({
      id: g.id,
      state: g.state,
      district: g.district,
      lat: g.lat,
      lng: g.lng,
      note: g.note,
      effectiveDate: g.effectiveDate,
    }))
}

export async function getUpdateFiles(updateId) {
  const links = await db.select().from(projectUpdateFiles).where(eq(projectUpdateFiles.updateId, updateId)).all()
  return links
    .map(async (l) => {
      const f = await db.select().from(files).where(eq(files.id, l.fileId)).get()
      return f
        ? {
            id: f.id,
            name: f.originalName,
            mime: f.mime,
            sizeBytes: f.sizeBytes,
            downloadUrl: `/api/files/${f.id}/download`,
          }
        : null
    })
    .filter(Boolean)
}

export async function addKpi(projectId, data, { corporateTenantId, ngoTenantId, req } = {}) {
  assertProjectAccess(projectId, { corporateTenantId, ngoTenantId })
  const id = newId()
  const now = new Date()
  await db
    .insert(projectKpis)
    .values({
      id,
      projectId,
      metricKey: data.metricKey,
      label: data.label,
      value: String(data.value),
      unit: data.unit || null,
      recordedAt: now,
    })
    .run()
  if (req) {
    logMutation({
      req,
      action: 'impact.kpi.add',
      entityType: 'project',
      entityId: projectId,
      after: { kpiId: id },
    }).catch(() => {})
  }
  return listKpis(projectId).find((k) => k.id === id)
}

export async function addBeneficiaryLog(projectId, data, { corporateTenantId, ngoTenantId, userId, req } = {}) {
  assertProjectAccess(projectId, { corporateTenantId, ngoTenantId })
  const id = newId()
  const now = new Date()
  await db
    .insert(projectBeneficiaryLogs)
    .values({
      id,
      projectId,
      directCount: data.directCount ?? 0,
      indirectCount: data.indirectCount ?? 0,
      note: data.note || null,
      recordedAt: now,
      recordedBy: userId || null,
    })
    .run()
  if (req) {
    logMutation({
      req,
      action: 'impact.beneficiary.add',
      entityType: 'project',
      entityId: projectId,
      after: { logId: id },
    }).catch(() => {})
  }
  return getLatestBeneficiaries(projectId)
}

export async function addGeoUpdate(projectId, data, { corporateTenantId, ngoTenantId, req } = {}) {
  assertProjectAccess(projectId, { corporateTenantId, ngoTenantId })
  const id = newId()
  await db
    .insert(projectGeoUpdates)
    .values({
      id,
      projectId,
      state: data.state,
      district: data.district || null,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
      note: data.note || null,
      effectiveDate: data.effectiveDate || new Date().toISOString().slice(0, 10),
    })
    .run()
  if (data.state) {
    await db
      .update(csrProjects)
      .set({
        state: data.state,
        location: data.district ? `${data.district}, ${data.state}` : data.state,
        updatedAt: new Date(),
      })
      .where(eq(csrProjects.id, projectId))
      .run()
  }
  if (req) {
    logMutation({
      req,
      action: 'impact.geo.add',
      entityType: 'project',
      entityId: projectId,
      after: { geoId: id },
    }).catch(() => {})
  }
  return listGeoUpdates(projectId).find((g) => g.id === id)
}

export async function attachFilesToUpdate(updateId, fileIds, { corporateTenantId, ngoTenantId } = {}) {
  const update = await db.select().from(projectUpdates).where(eq(projectUpdates.id, updateId)).get()
  if (!update) throw httpError('Update not found', 404)
  assertProjectAccess(update.projectId, { corporateTenantId, ngoTenantId })
  for (const fileId of fileIds) {
    const existing = await db
      .select()
      .from(projectUpdateFiles)
      .where(and(eq(projectUpdateFiles.updateId, updateId), eq(projectUpdateFiles.fileId, fileId)))
      .get()
    if (!existing) {
      await db.insert(projectUpdateFiles).values({ id: newId(), updateId, fileId }).run()
    }
  }
  return getUpdateFiles(updateId)
}

async function computeNgoPerformance(projects) {
  const byNgo = new Map()
  for (const p of projects) {
    const ngo = await db.select().from(tenants).where(eq(tenants.id, p.ngoTenantId)).get()
    const name = ngo?.name || 'Unknown NGO'
    if (!byNgo.has(p.ngoTenantId)) {
      byNgo.set(p.ngoTenantId, { ngo: name, scores: [], spend: 0 })
    }
    const entry = byNgo.get(p.ngoTenantId)
    entry.spend += p.spentInr || 0
    const milestones = await db.select().from(projectMilestones).where(eq(projectMilestones.projectId, p.id)).all()
    let onTime = 100
    if (milestones.length) {
      const today = new Date().toISOString().slice(0, 10)
      const completed = milestones.filter((m) => m.status === 'completed')
      const onTimeCount = completed.filter((m) => !m.dueDate || m.dueDate >= today || m.completedAt).length
      onTime = Math.round((onTimeCount / milestones.length) * 100)
    }
    const impact = p.progress || 0
    const score = Math.round(onTime * 0.4 + impact * 0.6)
    entry.scores.push({ onTime, impact, score })
  }
  return [...byNgo.values()]
    .map((e) => {
      const avg = e.scores.reduce((s, x) => s + x.score, 0) / (e.scores.length || 1)
      const onTime = Math.round(e.scores.reduce((s, x) => s + x.onTime, 0) / (e.scores.length || 1))
      const impact = Math.round(e.scores.reduce((s, x) => s + x.impact, 0) / (e.scores.length || 1))
      return { ngo: e.ngo, score: Math.round(avg), onTime, impact, spend: e.spend }
    })
    .sort((a, b) => b.score - a.score)
}

function aggregateBeneficiaries(projectIds) {
  let direct = 0
  let indirect = 0
  for (const pid of projectIds) {
    const latest = getLatestBeneficiaries(pid)
    direct += latest.direct
    indirect += latest.indirect
  }
  return { direct, indirect, total: direct + indirect }
}

export async function aggregateForTenant(corporateTenantId) {
  const projects = await db.select().from(csrProjects).where(eq(csrProjects.corporateTenantId, corporateTenantId)).all()
  const active = projects.filter((p) => p.status === 'active' || p.status === 'pending_approval')
  const activeOnly = projects.filter((p) => p.status === 'active')

  const projectIds = projects.map((p) => p.id)
  const ben = aggregateBeneficiaries(projectIds)
  const co2 = getLatestKpiValue(projectIds, 'co2_offset_tons')
  const beneficiarySeries = getBeneficiaryTimeSeries(corporateTenantId)

  const sdgMap = new Map()
  const categoryMap = new Map()
  const geoMap = new Map()

  for (const p of projects) {
    const theme = p.theme || 'Other'
    categoryMap.set(theme, (categoryMap.get(theme) || 0) + (p.spentInr || 0))
    const sdgInfo = THEME_TO_SDG[theme]
    if (sdgInfo) {
      const key = sdgInfo.sdg
      const cur = sdgMap.get(key) || { sdg: key, label: sdgInfo.label, projects: 0, spend: 0 }
      cur.projects += 1
      cur.spend += p.spentInr || 0
      sdgMap.set(key, cur)
    }
    const state = p.state || p.location?.split(',').pop()?.trim() || 'Unknown'
    const geo = geoMap.get(state) || { state, spend: 0, projects: 0 }
    geo.spend += p.spentInr || 0
    geo.projects += 1
    geoMap.set(state, geo)
  }

  const totalBudget = projects.reduce((s, p) => s + p.budgetInr, 0)
  const totalSpent = projects.reduce((s, p) => s + p.spentInr, 0)
  const totalAllocated = active.reduce((s, p) => s + p.budgetInr, 0)

  const spendProgress = buildSpendProgress(projects, beneficiarySeries)
  const budgetUtilization = buildBudgetUtilization(projects, beneficiarySeries)
  const districtAnalytics = getDistrictImpact(corporateTenantId)

  const impactMetrics = []
  if (ben.total > 0) {
    impactMetrics.push({ sdg: 3, label: 'Total Beneficiaries', value: formatCompact(ben.total) })
  }
  if (co2 > 0) {
    impactMetrics.push({ sdg: 13, label: 'COÃƒÂ¢Ã¢â‚¬Å¡Ã¢â‚¬Å¡ Offset (tons)', value: formatCompact(co2) })
  }
  for (const [theme, spend] of categoryMap) {
    if (theme === 'Education') impactMetrics.push({ sdg: 4, label: 'Education Spend', value: formatINR(spend) })
  }

  return {
    impactSummary: {
      totalBeneficiaries: ben.total,
      projectsActive: activeOnly.length,
      sdgsCovered: sdgMap.size,
      co2Offset: co2,
    },
    sdgMapping: [...sdgMap.values()].sort((a, b) => a.sdg - b.sdg),
    categoryAnalytics: [...categoryMap.entries()].map(([name, value]) => ({ name, value })),
    geoAnalytics: [...geoMap.values()].sort((a, b) => b.spend - a.spend),
    districtAnalytics,
    budgetUtilization,
    ngoPerformance: computeNgoPerformance(activeOnly.length ? activeOnly : projects),
    dashboard: {
      budget: {
        total: totalBudget,
        allocated: totalAllocated,
        spent: totalSpent,
        currency: 'INR',
      },
      spendProgress,
      activeProjects: {
        count: activeOnly.length,
        list: activeOnly.slice(0, 5).map(async (p) => {
          const ngo = await db.select().from(tenants).where(eq(tenants.id, p.ngoTenantId)).get()
          return { id: p.id, name: p.name, ngo: ngo?.name, progress: p.progress }
        }),
      },
      impactMetrics,
      ngoPerformance: computeNgoPerformance(activeOnly.length ? activeOnly : projects)
        .slice(0, 5)
        .map((n) => ({
          name: n.ngo,
          score: n.score,
          spend: n.spend,
        })),
    },
  }
}

function formatCompact(n) {
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

function formatINR(n) {
  if (n >= 10000000) return `ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¹${(n / 10000000).toFixed(1)} Cr`
  if (n >= 100000) return `ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¹${(n / 100000).toFixed(1)} L`
  return `ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¹${n}`
}

export async function listBeneficiaryLogsForNgo(ngoTenantId) {
  const projects = await db.select().from(csrProjects).where(eq(csrProjects.ngoTenantId, ngoTenantId)).all()
  const result = []
  for (const p of projects) {
    const logs = await db
      .select()
      .from(projectBeneficiaryLogs)
      .where(eq(projectBeneficiaryLogs.projectId, p.id))
      .orderBy(desc(projectBeneficiaryLogs.recordedAt))
      .all()
    for (const log of logs) {
      result.push({
        id: log.id,
        projectId: p.id,
        projectName: p.name,
        direct: log.directCount,
        indirect: log.indirectCount,
        note: log.note,
        recordedAt: log.recordedAt,
      })
    }
  }
  return result.sort((a, b) => b.recordedAt - a.recordedAt)
}

export function getReportingOverview(corporateTenantId) {
  const agg = aggregateForTenant(corporateTenantId)
  return {
    impactSummary: agg.impactSummary,
    sdgMapping: agg.sdgMapping,
    sdgProgress: getSdgProgress(corporateTenantId),
    categoryAnalytics: agg.categoryAnalytics,
    geoAnalytics: agg.geoAnalytics,
    districtAnalytics: agg.districtAnalytics,
    budgetUtilization: agg.budgetUtilization,
    ngoPerformance: agg.ngoPerformance,
  }
}

export function getImpactLiveSnapshot(corporateTenantId) {
  const agg = aggregateForTenant(corporateTenantId)
  return {
    summary: {
      impactSummary: agg.impactSummary,
      budget: agg.dashboard.budget,
      activeProjects: agg.dashboard.activeProjects,
    },
    timeSeries: getBeneficiaryTimeSeries(corporateTenantId),
    districtAnalytics: agg.districtAnalytics,
    sdgProgress: getSdgProgress(corporateTenantId),
    geoAnalytics: agg.geoAnalytics,
    categoryAnalytics: agg.categoryAnalytics,
    spendProgress: agg.dashboard.spendProgress,
    budgetUtilization: agg.budgetUtilization,
    mediaFeed: getMediaFeed(corporateTenantId),
    updatedAt: new Date().toISOString(),
  }
}

export function getDashboardSummary(corporateTenantId) {
  const agg = aggregateForTenant(corporateTenantId)
  return {
    ...agg.dashboard,
    complianceScore: 78,
    deadlines: [],
    aiRecommendations: [],
  }
}
