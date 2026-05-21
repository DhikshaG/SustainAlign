import { eq, and, gte, lte, desc } from 'drizzle-orm'
import { db } from '../../db/index.js'
import {
  csrProjects,
  projectKpis,
  projectBeneficiaryLogs,
  projectUpdates,
  projectUpdateFiles,
  ngoImpactStories,
  tenants,
  files,
  users,
} from '../../db/schema.js'
import { aggregateForTenant } from '../impact/index.js'
import { getDistrictImpact, getSdgProgress } from '../impact/analytics.js'
import { getComplianceSummary } from '../compliance/index.js'
import { listProjects } from '../projects/index.js'

function parsePeriodDate(str) {
  return new Date(`${str}T00:00:00`)
}

function inPeriod(dateVal, start, end) {
  const d = dateVal instanceof Date ? dateVal : new Date(dateVal)
  return d >= start && d <= end
}

function loadProjectUpdates(projectId, periodStart, periodEnd) {
  const start = parsePeriodDate(periodStart)
  const end = parsePeriodDate(periodEnd)
  end.setHours(23, 59, 59, 999)

  const rows = db.select({
    id: projectUpdates.id,
    body: projectUpdates.body,
    createdAt: projectUpdates.createdAt,
    authorName: users.fullName,
  })
    .from(projectUpdates)
    .innerJoin(users, eq(users.id, projectUpdates.authorUserId))
    .where(eq(projectUpdates.projectId, projectId))
    .orderBy(desc(projectUpdates.createdAt))
    .all()

  return rows
    .filter((u) => inPeriod(u.createdAt, start, end))
    .map((u) => {
      const links = db.select().from(projectUpdateFiles)
        .where(eq(projectUpdateFiles.updateId, u.id))
        .all()
      const images = links.map((l) => {
        const f = db.select().from(files).where(eq(files.id, l.fileId)).get()
        return f ? { id: f.id, name: f.originalName, mime: f.mime } : null
      }).filter(Boolean)
      return {
        id: u.id,
        body: u.body,
        author: u.authorName || 'User',
        date: u.createdAt.toISOString().slice(0, 10),
        images,
      }
    })
}

function loadProjectKpis(projectId, periodStart, periodEnd) {
  const start = parsePeriodDate(periodStart)
  const end = parsePeriodDate(periodEnd)
  end.setHours(23, 59, 59, 999)

  const rows = db.select().from(projectKpis)
    .where(eq(projectKpis.projectId, projectId))
    .orderBy(desc(projectKpis.recordedAt))
    .all()

  const inRange = rows.filter((k) => inPeriod(k.recordedAt, start, end))
  if (inRange.length) {
    return inRange.map((k) => ({
      id: k.id,
      metricKey: k.metricKey,
      label: k.label,
      value: k.value,
      unit: k.unit,
      recordedAt: k.recordedAt,
    }))
  }
  const latestByKey = new Map()
  for (const k of rows) {
    if (!latestByKey.has(k.metricKey)) latestByKey.set(k.metricKey, k)
  }
  return [...latestByKey.values()].map((k) => ({
    id: k.id,
    metricKey: k.metricKey,
    label: k.label,
    value: k.value,
    unit: k.unit,
    recordedAt: k.recordedAt,
  }))
}

function loadBeneficiaryLogs(projectId, periodStart, periodEnd) {
  const start = parsePeriodDate(periodStart)
  const end = parsePeriodDate(periodEnd)
  end.setHours(23, 59, 59, 999)

  return db.select().from(projectBeneficiaryLogs)
    .where(and(
      eq(projectBeneficiaryLogs.projectId, projectId),
      gte(projectBeneficiaryLogs.recordedAt, start),
      lte(projectBeneficiaryLogs.recordedAt, end),
    ))
    .orderBy(desc(projectBeneficiaryLogs.recordedAt))
    .all()
    .map((l) => ({
      id: l.id,
      direct: l.directCount,
      indirect: l.indirectCount,
      note: l.note,
      recordedAt: l.recordedAt,
    }))
}

function loadNgoImpactStories(ngoTenantIds) {
  if (!ngoTenantIds.length) return []
  const unique = [...new Set(ngoTenantIds)]
  const stories = []
  for (const tid of unique) {
    const ngo = db.select().from(tenants).where(eq(tenants.id, tid)).get()
    const rows = db.select().from(ngoImpactStories)
      .where(eq(ngoImpactStories.tenantId, tid))
      .all()
    for (const s of rows) {
      stories.push({
        id: s.id,
        title: s.title,
        excerpt: s.excerpt,
        ngoName: ngo?.name || 'NGO',
        publishedAt: s.publishedAt,
      })
    }
  }
  return stories
}

export function buildReportContext(corporateTenantId, { periodStart, periodEnd }) {
  const tenant = db.select().from(tenants).where(eq(tenants.id, corporateTenantId)).get()
  const aggregate = aggregateForTenant(corporateTenantId)
  const compliance = getComplianceSummary(corporateTenantId)
  const projectList = listProjects({ corporateTenantId, audience: 'corporate' })
  const sdgProgress = getSdgProgress(corporateTenantId)
  const districtAnalytics = getDistrictImpact(corporateTenantId)

  const ngoTenantIds = projectList.projects.map((p) => {
    const row = db.select().from(csrProjects).where(eq(csrProjects.id, p.id)).get()
    return row?.ngoTenantId
  }).filter(Boolean)

  const projects = projectList.projects.map((p) => {
    const updates = loadProjectUpdates(p.id, periodStart, periodEnd)
    const kpis = loadProjectKpis(p.id, periodStart, periodEnd)
    const beneficiaryLogs = loadBeneficiaryLogs(p.id, periodStart, periodEnd)
    return {
      id: p.id,
      name: p.name,
      ngoName: p.ngoName,
      theme: p.theme,
      progress: p.progress,
      budgetInr: p.budgetInr,
      spentInr: p.spentInr,
      location: p.location,
      status: p.status,
      updates,
      kpis,
      beneficiaryLogs,
    }
  })

  const impactStories = loadNgoImpactStories(ngoTenantIds)
  const allUpdates = projects.flatMap((p) =>
    p.updates.map((u) => ({ ...u, projectName: p.name })),
  )

  return {
    tenantId: corporateTenantId,
    tenantName: tenant?.name || 'Corporate',
    periodStart,
    periodEnd,
    aggregate,
    compliance,
    sdgProgress,
    districtAnalytics,
    projects,
    impactStories,
    allUpdates,
    budget: aggregate.dashboard.budget,
  }
}
