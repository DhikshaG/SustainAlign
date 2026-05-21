import { eq, desc, inArray, asc, and } from 'drizzle-orm'
import { db } from '../../db/index.js'
import {
  csrProjects,
  projectKpis,
  projectBeneficiaryLogs,
  projectGeoUpdates,
  projectUpdateFiles,
  projectUpdates,
  projectMilestones,
  files,
} from '../../db/schema.js'

const THEME_TO_SDG = {
  Healthcare: { sdg: 3, label: 'Good Health' },
  Education: { sdg: 4, label: 'Quality Education' },
  Environment: { sdg: 13, label: 'Climate Action' },
  Livelihood: { sdg: 8, label: 'Decent Work' },
  'Rural Development': { sdg: 1, label: 'No Poverty' },
  'Clean Water': { sdg: 6, label: 'Clean Water' },
  'Women Empowerment': { sdg: 5, label: 'Gender Equality' },
}

const MONTH_LABELS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan']

function getCorporateProjects(corporateTenantId) {
  return db.select().from(csrProjects)
    .where(eq(csrProjects.corporateTenantId, corporateTenantId))
    .all()
}

function getNgoProjects(ngoTenantId) {
  return db.select().from(csrProjects)
    .where(eq(csrProjects.ngoTenantId, ngoTenantId))
    .all()
}

function latestBeneficiariesForProject(projectId) {
  const log = db.select().from(projectBeneficiaryLogs)
    .where(eq(projectBeneficiaryLogs.projectId, projectId))
    .orderBy(desc(projectBeneficiaryLogs.recordedAt))
    .limit(1)
    .get()
  if (!log) return { direct: 0, indirect: 0 }
  return { direct: log.directCount, indirect: log.indirectCount }
}

export function getLatestKpiValue(projectIds, metricKey) {
  let total = 0
  for (const pid of projectIds) {
    const kpi = db.select().from(projectKpis)
      .where(eq(projectKpis.projectId, pid))
      .orderBy(desc(projectKpis.recordedAt))
      .all()
      .find((k) => k.metricKey === metricKey)
    if (kpi) {
      const n = parseFloat(kpi.value)
      if (!Number.isNaN(n)) total += n
    }
  }
  return total
}

export function getBeneficiaryTimeSeries(corporateTenantId) {
  const projects = getCorporateProjects(corporateTenantId)
  const projectIds = projects.map((p) => p.id)
  if (!projectIds.length) {
    return MONTH_LABELS.map((month) => ({ month, beneficiaries: 0, cumulative: 0 }))
  }

  const logs = db.select().from(projectBeneficiaryLogs)
    .where(inArray(projectBeneficiaryLogs.projectId, projectIds))
    .orderBy(asc(projectBeneficiaryLogs.recordedAt))
    .all()

  const buckets = new Map(MONTH_LABELS.map((m) => [m, 0]))
  for (const log of logs) {
    const d = log.recordedAt instanceof Date ? log.recordedAt : new Date(log.recordedAt)
    const monthIdx = (d.getMonth() + 9) % 12
    const label = MONTH_LABELS[monthIdx]
    buckets.set(label, (buckets.get(label) || 0) + log.directCount + log.indirectCount)
  }

  let cumulative = 0
  return MONTH_LABELS.map((month) => {
    cumulative += buckets.get(month) || 0
    return { month, beneficiaries: buckets.get(month) || 0, cumulative }
  })
}

export function buildSpendProgress(projects, beneficiarySeries) {
  const totalSpent = projects.reduce((s, p) => s + (p.spentInr || 0), 0)
  const totalBudget = projects.reduce((s, p) => s + p.budgetInr, 0)
  const hasBeneficiaryData = beneficiarySeries.some((b) => b.beneficiaries > 0)

  if (hasBeneficiaryData) {
    return beneficiarySeries.map((b, i) => ({
      month: b.month,
      spent: b.cumulative,
      obligation: Math.round(totalSpent * ((i + 1) / 12)),
      beneficiaries: b.beneficiaries,
    }))
  }

  return MONTH_LABELS.map((month, i) => ({
    month,
    spent: Math.round(totalSpent * ((i + 1) / 12)),
    obligation: Math.round((totalBudget / 12) * (i + 1)),
    beneficiaries: 0,
  }))
}

export function buildBudgetUtilization(projects, beneficiarySeries) {
  const totalBudget = projects.reduce((s, p) => s + p.budgetInr, 0)
  const totalSpent = projects.reduce((s, p) => s + (p.spentInr || 0), 0)
  const hasBeneficiaryData = beneficiarySeries.some((b) => b.beneficiaries > 0)

  if (hasBeneficiaryData) {
    const maxCumulative = Math.max(...beneficiarySeries.map((b) => b.cumulative), 1)
    return beneficiarySeries.map((b) => ({
      month: b.month,
      budget: Math.round(totalBudget * ((b.cumulative / maxCumulative) * 12) / 12),
      utilized: Math.round(totalSpent * (b.cumulative / maxCumulative)),
    }))
  }

  return MONTH_LABELS.map((month, i) => ({
    month,
    budget: Math.round(totalBudget * ((i + 1) / 12)),
    utilized: Math.round(totalSpent * ((i + 1) / 12)),
  }))
}

export function getDistrictImpact(corporateTenantId) {
  const projects = getCorporateProjects(corporateTenantId)
  const districtMap = new Map()

  for (const p of projects) {
    const geo = db.select().from(projectGeoUpdates)
      .where(eq(projectGeoUpdates.projectId, p.id))
      .orderBy(desc(projectGeoUpdates.effectiveDate))
      .limit(1)
      .get()

    const district = geo?.district || p.location?.split(',')[0]?.trim() || p.state || 'Unknown'
    const ben = latestBeneficiariesForProject(p.id)
    const cur = districtMap.get(district) || {
      district,
      state: geo?.state || p.state || 'Unknown',
      beneficiaries: 0,
      spend: 0,
      projects: 0,
    }
    cur.beneficiaries += ben.direct + ben.indirect
    cur.spend += p.spentInr || 0
    cur.projects += 1
    districtMap.set(district, cur)
  }

  return [...districtMap.values()].sort((a, b) => b.beneficiaries - a.beneficiaries)
}

export function getSdgProgress(corporateTenantId) {
  const projects = getCorporateProjects(corporateTenantId)
  const sdgMap = new Map()

  for (const p of projects) {
    const theme = p.theme || 'Other'
    const sdgInfo = THEME_TO_SDG[theme]
    if (!sdgInfo) continue
    const key = sdgInfo.sdg
    const ben = latestBeneficiariesForProject(p.id)
    const cur = sdgMap.get(key) || {
      sdg: key,
      label: sdgInfo.label,
      projects: 0,
      spend: 0,
      beneficiaries: 0,
    }
    cur.projects += 1
    cur.spend += p.spentInr || 0
    cur.beneficiaries += ben.direct + ben.indirect
    sdgMap.set(key, cur)
  }

  return [...sdgMap.values()].sort((a, b) => a.sdg - b.sdg)
}

export function getMediaFeed(corporateTenantId, limit = 12) {
  const projects = getCorporateProjects(corporateTenantId)
  const items = []

  for (const p of projects) {
    const updates = db.select().from(projectUpdates)
      .where(eq(projectUpdates.projectId, p.id))
      .orderBy(desc(projectUpdates.createdAt))
      .limit(5)
      .all()

    for (const u of updates) {
      const links = db.select().from(projectUpdateFiles)
        .where(eq(projectUpdateFiles.updateId, u.id))
        .all()
      for (const link of links) {
        const f = db.select().from(files).where(eq(files.id, link.fileId)).get()
        if (f) {
          items.push({
            id: f.id,
            name: f.originalName,
            mime: f.mime,
            sizeBytes: f.sizeBytes,
            downloadUrl: `/api/files/${f.id}/download`,
            projectId: p.id,
            projectName: p.name,
            updateId: u.id,
            createdAt: u.createdAt,
            type: 'update',
          })
        }
      }
    }

    const evidence = db.select().from(files)
      .where(and(eq(files.entityType, 'project'), eq(files.entityId, p.id)))
      .all()

    for (const f of evidence) {
      items.push({
        id: f.id,
        name: f.originalName,
        mime: f.mime,
        sizeBytes: f.sizeBytes,
        downloadUrl: `/api/files/${f.id}/download`,
        projectId: p.id,
        projectName: p.name,
        createdAt: f.createdAt,
        type: 'evidence',
      })
    }
  }

  return items
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit)
}

export function getNgoDashboardSummary(ngoTenantId) {
  const projects = getNgoProjects(ngoTenantId)
  const active = projects.filter((p) => p.status === 'active')
  let totalBeneficiaries = 0
  for (const p of projects) {
    const ben = latestBeneficiariesForProject(p.id)
    totalBeneficiaries += ben.direct + ben.indirect
  }

  let pendingMilestones = 0
  let recentUpdates = 0
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000

  for (const p of projects) {
    const milestones = db.select().from(projectMilestones)
      .where(eq(projectMilestones.projectId, p.id))
      .all()
    pendingMilestones += milestones.filter((m) => m.status !== 'completed').length

    const updates = db.select().from(projectUpdates)
      .where(eq(projectUpdates.projectId, p.id))
      .all()
    recentUpdates += updates.filter((u) => {
      const t = u.createdAt instanceof Date ? u.createdAt.getTime() : new Date(u.createdAt).getTime()
      return t >= thirtyDaysAgo
    }).length
  }

  const mediaFeed = []
  for (const p of active.slice(0, 3)) {
    const updates = db.select().from(projectUpdates)
      .where(eq(projectUpdates.projectId, p.id))
      .orderBy(desc(projectUpdates.createdAt))
      .limit(2)
      .all()
    for (const u of updates) {
      const links = db.select().from(projectUpdateFiles)
        .where(eq(projectUpdateFiles.updateId, u.id))
        .limit(1)
        .all()
      if (links.length) {
        const f = db.select().from(files).where(eq(files.id, links[0].fileId)).get()
        if (f) {
          mediaFeed.push({
            id: f.id,
            name: f.originalName,
            downloadUrl: `/api/files/${f.id}/download`,
            projectName: p.name,
          })
        }
      }
    }
  }

  return {
    activeProjects: active.length,
    totalProjects: projects.length,
    totalBeneficiaries,
    pendingMilestones,
    recentUpdates,
    projects: active.slice(0, 5).map((p) => ({
      id: p.id,
      name: p.name,
      progress: p.progress,
      status: p.status,
    })),
    mediaFeed: mediaFeed.slice(0, 5),
  }
}
