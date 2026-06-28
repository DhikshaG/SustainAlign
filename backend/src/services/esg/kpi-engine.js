import { eq, desc, inArray } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { csrProjects, projectKpis } from '../../db/schema.js'
import { KPI_CATALOG, mapKpi } from './taxonomy.js'

async function getCorporateProjectIds(tenantId) {
  return await db
    .select({ id: csrProjects.id })
    .from(csrProjects)
    .where(eq(csrProjects.corporateTenantId, tenantId))
    .all()
    .map((p) => p.id)
}

async function latestKpiForProject(projectId, metricKey) {
  return await db
    .select()
    .from(projectKpis)
    .where(eq(projectKpis.projectId, projectId))
    .orderBy(desc(projectKpis.recordedAt))
    .all()
    .find((k) => k.metricKey === metricKey)
}

export async function rollupKpisForTenant(tenantId) {
  const projectIds = getCorporateProjectIds(tenantId)
  const totals = new Map()

  for (const pid of projectIds) {
    const kpis = await db
      .select()
      .from(projectKpis)
      .where(eq(projectKpis.projectId, pid))
      .orderBy(desc(projectKpis.recordedAt))
      .all()

    const seen = new Set()
    for (const kpi of kpis) {
      if (seen.has(kpi.metricKey)) continue
      seen.add(kpi.metricKey)
      const n = parseFloat(kpi.value)
      if (Number.isNaN(n)) continue
      const cur = totals.get(kpi.metricKey) || { value: 0, label: kpi.label, unit: kpi.unit }
      cur.value += n
      totals.set(kpi.metricKey, cur)
    }
  }

  return [...totals.entries()].map(([key, data]) => ({
    key,
    label: data.label || mapKpi(key).label,
    value: data.value,
    unit: data.unit || mapKpi(key).unit,
    ...mapKpi(key),
  }))
}

export function rollupByPillar(tenantId) {
  const kpis = rollupKpisForTenant(tenantId)
  const pillars = {
    environmental: { kpis: [], totalValue: 0 },
    social: { kpis: [], totalValue: 0 },
    governance: { kpis: [], totalValue: 0 },
  }

  for (const kpi of kpis) {
    const pillar = kpi.pillar || 'social'
    if (!pillars[pillar]) continue
    pillars[pillar].kpis.push(kpi)
    pillars[pillar].totalValue += kpi.value
  }

  return pillars
}

export function getSustainabilityKpis(tenantId) {
  return rollupKpisForTenant(tenantId).map((k) => ({
    key: k.key,
    label: k.label,
    value: k.value,
    unit: k.unit,
    pillar: k.pillar,
    sdg: k.sdg ?? null,
    brsr: k.brsrPrinciple ?? null,
  }))
}

export function rollupCatalogKpis(tenantId) {
  const projectIds = getCorporateProjectIds(tenantId)
  const result = {}
  for (const key of Object.keys(KPI_CATALOG)) {
    let total = 0
    for (const pid of projectIds) {
      const kpi = latestKpiForProject(pid, key)
      if (kpi) {
        const n = parseFloat(kpi.value)
        if (!Number.isNaN(n)) total += n
      }
    }
    if (total > 0) result[key] = total
  }
  return result
}
