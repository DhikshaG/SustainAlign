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

function httpError(message, status) {
  const err = new Error(message)
  err.status = status
  return err
}

function assertProjectAccess(projectId, { corporateTenantId, ngoTenantId }) {
  const row = db.select().from(csrProjects).where(eq(csrProjects.id, projectId)).get()
  if (!row) throw httpError('Project not found', 404)
  if (corporateTenantId && row.corporateTenantId !== corporateTenantId) {
    throw httpError('Project not found', 404)
  }
  if (ngoTenantId && row.ngoTenantId !== ngoTenantId) {
    throw httpError('Project not found', 404)
  }
  return row
}

const THEME_TO_SDG = {
  Healthcare: { sdg: 3, label: 'Good Health' },
  Education: { sdg: 4, label: 'Quality Education' },
  Environment: { sdg: 13, label: 'Climate Action' },
  Livelihood: { sdg: 8, label: 'Decent Work' },
  'Rural Development': { sdg: 1, label: 'No Poverty' },
  'Clean Water': { sdg: 6, label: 'Clean Water' },
  'Women Empowerment': { sdg: 5, label: 'Gender Equality' },
}

export function getLatestBeneficiaries(projectId) {
  const log = db.select().from(projectBeneficiaryLogs)
    .where(eq(projectBeneficiaryLogs.projectId, projectId))
    .orderBy(desc(projectBeneficiaryLogs.recordedAt))
    .limit(1)
    .get()
  if (!log) return { direct: 0, indirect: 0, added: 0, history: [] }
  const history = db.select().from(projectBeneficiaryLogs)
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

export function listKpis(projectId) {
  return db.select().from(projectKpis)
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

export function listGeoUpdates(projectId) {
  return db.select().from(projectGeoUpdates)
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

export function getUpdateFiles(updateId) {
  const links = db.select().from(projectUpdateFiles)
    .where(eq(projectUpdateFiles.updateId, updateId))
    .all()
  return links.map((l) => {
    const f = db.select().from(files).where(eq(files.id, l.fileId)).get()
    return f ? {
      id: f.id,
      name: f.originalName,
      mime: f.mime,
      sizeBytes: f.sizeBytes,
    } : null
  }).filter(Boolean)
}

export function addKpi(projectId, data, { corporateTenantId, ngoTenantId, req } = {}) {
  assertProjectAccess(projectId, { corporateTenantId, ngoTenantId })
  const id = newId()
  const now = new Date()
  db.insert(projectKpis).values({
    id,
    projectId,
    metricKey: data.metricKey,
    label: data.label,
    value: String(data.value),
    unit: data.unit || null,
    recordedAt: now,
  }).run()
  if (req) {
    logMutation({ req, action: 'impact.kpi.add', entityType: 'project', entityId: projectId, after: { kpiId: id } }).catch(() => {})
  }
  return listKpis(projectId).find((k) => k.id === id)
}

export function addBeneficiaryLog(projectId, data, { corporateTenantId, ngoTenantId, userId, req } = {}) {
  assertProjectAccess(projectId, { corporateTenantId, ngoTenantId })
  const id = newId()
  const now = new Date()
  db.insert(projectBeneficiaryLogs).values({
    id,
    projectId,
    directCount: data.directCount ?? 0,
    indirectCount: data.indirectCount ?? 0,
    note: data.note || null,
    recordedAt: now,
    recordedBy: userId || null,
  }).run()
  if (req) {
    logMutation({ req, action: 'impact.beneficiary.add', entityType: 'project', entityId: projectId, after: { logId: id } }).catch(() => {})
  }
  return getLatestBeneficiaries(projectId)
}

export function addGeoUpdate(projectId, data, { corporateTenantId, ngoTenantId, req } = {}) {
  assertProjectAccess(projectId, { corporateTenantId, ngoTenantId })
  const id = newId()
  db.insert(projectGeoUpdates).values({
    id,
    projectId,
    state: data.state,
    district: data.district || null,
    lat: data.lat ?? null,
    lng: data.lng ?? null,
    note: data.note || null,
    effectiveDate: data.effectiveDate || new Date().toISOString().slice(0, 10),
  }).run()
  if (data.state) {
    db.update(csrProjects)
      .set({ state: data.state, location: data.district ? `${data.district}, ${data.state}` : data.state, updatedAt: new Date() })
      .where(eq(csrProjects.id, projectId))
      .run()
  }
  if (req) {
    logMutation({ req, action: 'impact.geo.add', entityType: 'project', entityId: projectId, after: { geoId: id } }).catch(() => {})
  }
  return listGeoUpdates(projectId).find((g) => g.id === id)
}

export function attachFilesToUpdate(updateId, fileIds, { corporateTenantId, ngoTenantId } = {}) {
  const update = db.select().from(projectUpdates).where(eq(projectUpdates.id, updateId)).get()
  if (!update) throw httpError('Update not found', 404)
  assertProjectAccess(update.projectId, { corporateTenantId, ngoTenantId })
  for (const fileId of fileIds) {
    const existing = db.select().from(projectUpdateFiles)
      .where(and(eq(projectUpdateFiles.updateId, updateId), eq(projectUpdateFiles.fileId, fileId)))
      .get()
    if (!existing) {
      db.insert(projectUpdateFiles).values({ id: newId(), updateId, fileId }).run()
    }
  }
  return getUpdateFiles(updateId)
}

function computeNgoPerformance(projects) {
  const byNgo = new Map()
  for (const p of projects) {
    const ngo = db.select().from(tenants).where(eq(tenants.id, p.ngoTenantId)).get()
    const name = ngo?.name || 'Unknown NGO'
    if (!byNgo.has(p.ngoTenantId)) {
      byNgo.set(p.ngoTenantId, { ngo: name, scores: [], spend: 0 })
    }
    const entry = byNgo.get(p.ngoTenantId)
    entry.spend += p.spentInr || 0
    const milestones = db.select().from(projectMilestones).where(eq(projectMilestones.projectId, p.id)).all()
    let onTime = 100
    if (milestones.length) {
      const today = new Date().toISOString().slice(0, 10)
      const completed = milestones.filter((m) => m.status === 'completed')
      const onTimeCount = completed.filter((m) => !m.dueDate || m.dueDate >= today || m.completedAt).length
      onTime = Math.round((onTimeCount / milestones.length) * 100)
    }
    const impact = p.progress || 0
    const score = Math.round((onTime * 0.4) + (impact * 0.6))
    entry.scores.push({ onTime, impact, score })
  }
  return [...byNgo.values()].map((e) => {
    const avg = e.scores.reduce((s, x) => s + x.score, 0) / (e.scores.length || 1)
    const onTime = Math.round(e.scores.reduce((s, x) => s + x.onTime, 0) / (e.scores.length || 1))
    const impact = Math.round(e.scores.reduce((s, x) => s + x.impact, 0) / (e.scores.length || 1))
    return { ngo: e.ngo, score: Math.round(avg), onTime, impact, spend: e.spend }
  }).sort((a, b) => b.score - a.score)
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

function aggregateKpiValue(projectIds, metricKey) {
  let total = 0
  for (const pid of projectIds) {
    const kpis = listKpis(pid).filter((k) => k.metricKey === metricKey)
    for (const k of kpis) {
      const n = parseFloat(k.value)
      if (!Number.isNaN(n)) total += n
    }
  }
  return total
}

export function aggregateForTenant(corporateTenantId) {
  const projects = db.select().from(csrProjects)
    .where(eq(csrProjects.corporateTenantId, corporateTenantId))
    .all()
  const active = projects.filter((p) => p.status === 'active' || p.status === 'pending_approval')
  const activeOnly = projects.filter((p) => p.status === 'active')

  const ben = aggregateBeneficiaries(projects.map((p) => p.id))
  const co2 = aggregateKpiValue(projects.map((p) => p.id), 'co2_offset_tons')

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

  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan']
  const monthlyObligation = totalBudget / 12
  const spendProgress = months.map((month, i) => ({
    month,
    spent: Math.round(totalSpent * ((i + 1) / 12)),
    obligation: Math.round(monthlyObligation * (i + 1)),
  }))

  const budgetUtilization = months.map((month, i) => ({
    month,
    budget: Math.round(totalBudget * ((i + 1) / 12)),
    utilized: Math.round(totalSpent * ((i + 1) / 12)),
  }))

  const impactMetrics = []
  if (ben.total > 0) {
    impactMetrics.push({ sdg: 3, label: 'Total Beneficiaries', value: formatCompact(ben.total) })
  }
  if (co2 > 0) {
    impactMetrics.push({ sdg: 13, label: 'CO₂ Offset (tons)', value: formatCompact(co2) })
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
        list: activeOnly.slice(0, 5).map((p) => {
          const ngo = db.select().from(tenants).where(eq(tenants.id, p.ngoTenantId)).get()
          return { id: p.id, name: p.name, ngo: ngo?.name, progress: p.progress }
        }),
      },
      impactMetrics,
      ngoPerformance: computeNgoPerformance(activeOnly.length ? activeOnly : projects).slice(0, 5).map((n) => ({
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
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`
  return `₹${n}`
}

export function listBeneficiaryLogsForNgo(ngoTenantId) {
  const projects = db.select().from(csrProjects).where(eq(csrProjects.ngoTenantId, ngoTenantId)).all()
  const result = []
  for (const p of projects) {
    const logs = db.select().from(projectBeneficiaryLogs)
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
    categoryAnalytics: agg.categoryAnalytics,
    geoAnalytics: agg.geoAnalytics,
    budgetUtilization: agg.budgetUtilization,
    ngoPerformance: agg.ngoPerformance,
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
