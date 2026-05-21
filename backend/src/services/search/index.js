import { eq, like, or } from 'drizzle-orm'
import { db, sqlite } from '../../db/index.js'
import { searchDocuments, tenants, csrProjects } from '../../db/schema.js'
import { reindexNgo, getProfileByTenantId } from '../ngo/index.js'
import { reindexProject } from '../projects/index.js'

const SDG_LABELS = {
  1: 'SDG 1 No Poverty',
  3: 'SDG 3 Good Health',
  4: 'SDG 4 Quality Education',
  6: 'SDG 6 Clean Water',
  8: 'SDG 8 Decent Work',
  10: 'SDG 10 Reduced Inequalities',
  13: 'SDG 13 Climate Action',
  15: 'SDG 15 Life on Land',
}

function syncFts(doc) {
  sqlite.prepare('DELETE FROM search_documents_fts WHERE doc_id = ?').run(doc.id)
  sqlite.prepare(`
    INSERT INTO search_documents_fts (doc_id, tenant_id, entity_type, entity_id, title, body, keywords)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    doc.id,
    doc.tenantId,
    doc.entityType,
    doc.entityId,
    doc.title,
    doc.body || '',
    doc.keywords || '',
  )
}

export function indexDocument({ tenantId = null, entityType, entityId, title, body = '', keywords = [] }) {
  const id = `${entityType}:${entityId}`
  const now = new Date()
  const keywordsStr = Array.isArray(keywords) ? keywords.join(' ') : keywords

  const row = {
    id,
    tenantId,
    entityType,
    entityId,
    title,
    body,
    keywords: keywordsStr,
    createdAt: now,
  }

  const existing = db.select().from(searchDocuments).where(eq(searchDocuments.id, id)).get()
  if (existing) {
    db.update(searchDocuments).set(row).where(eq(searchDocuments.id, id)).run()
  } else {
    db.insert(searchDocuments).values(row).run()
  }
  syncFts(row)
  return row
}

export function removeFromIndex(entityType, entityId) {
  const id = `${entityType}:${entityId}`
  db.delete(searchDocuments).where(eq(searchDocuments.id, id)).run()
  sqlite.prepare('DELETE FROM search_documents_fts WHERE doc_id = ?').run(id)
}

export function reindexAll(tenantId = null) {
  db.delete(searchDocuments).run()
  sqlite.prepare('DELETE FROM search_documents_fts').run()

  const dbTenants = db.select().from(tenants).where(eq(tenants.type, 'ngo')).all()
  const regions = new Set()
  const sdgsIndexed = new Set()

  for (const t of dbTenants) {
    reindexNgo(t.id)
    const dto = getProfileByTenantId(t.id, 'corporate')
    if (dto?.region && !regions.has(dto.region)) {
      regions.add(dto.region)
      indexDocument({
        tenantId: null,
        entityType: 'location',
        entityId: dto.region.toLowerCase().replace(/\s+/g, '-'),
        title: dto.region,
        body: `NGOs and projects in ${dto.region}`,
        keywords: [dto.region, 'location'],
      })
    }
    for (const sdg of dto?.sdgs || []) {
      if (sdgsIndexed.has(sdg)) continue
      sdgsIndexed.add(sdg)
      indexDocument({
        tenantId: null,
        entityType: 'sdg',
        entityId: String(sdg),
        title: SDG_LABELS[sdg] || `SDG ${sdg}`,
        body: `Sustainable Development Goal ${sdg}`,
        keywords: [`sdg-${sdg}`, SDG_LABELS[sdg] || ''],
      })
    }
  }

  const dbProjects = db.select().from(csrProjects).all()
  for (const p of dbProjects) {
    reindexProject(p.id)
  }

  indexDocument({
    tenantId,
    entityType: 'report',
    entityId: 'q4-utilization',
    title: 'Q4 Utilization Report',
    body: 'Quarterly fund utilization and beneficiary summary',
    keywords: ['report', 'utilization', 'compliance'],
  })

  indexDocument({
    tenantId,
    entityType: 'report',
    entityId: 'section-135',
    title: 'Section 135 Annual CSR Report',
    body: 'MCA compliance CSR spend disclosure',
    keywords: ['report', 'section-135', 'compliance'],
  })
}

function filterResults(results, { types, tenantId, limit }) {
  let filtered = results
  if (types?.length) filtered = filtered.filter((r) => types.includes(r.entityType))
  if (tenantId) filtered = filtered.filter((r) => !r.tenantId || r.tenantId === tenantId)
  return filtered.slice(0, limit).map(formatResult)
}

function likeSearch(term, { types, tenantId, limit }) {
  const pattern = `%${term}%`
  const rows = db.select().from(searchDocuments)
    .where(or(
      like(searchDocuments.title, pattern),
      like(searchDocuments.body, pattern),
      like(searchDocuments.keywords, pattern),
    ))
    .limit(limit * 3)
    .all()
  return filterResults(rows, { types, tenantId, limit })
}

export function search({ q, types = [], tenantId = null, limit = 20 }) {
  if (!q?.trim()) return []

  const term = q.trim().replace(/[^\w\s-]/g, ' ')
  const ftsQuery = term.split(/\s+/).filter(Boolean).map((w) => `"${w}"*`).join(' OR ')

  try {
    const rows = sqlite.prepare(`
      SELECT doc_id, tenant_id, entity_type, entity_id, title, body, keywords,
             bm25(search_documents_fts) AS rank
      FROM search_documents_fts
      WHERE search_documents_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    `).all(ftsQuery, limit * 3)

    const mapped = rows.map((r) => ({
      id: r.doc_id,
      tenantId: r.tenant_id,
      entityType: r.entity_type,
      entityId: r.entity_id,
      title: r.title,
      body: r.body,
      keywords: r.keywords,
    }))
    return filterResults(mapped, { types, tenantId, limit })
  } catch {
    return likeSearch(term, { types, tenantId, limit })
  }
}

function formatResult(r) {
  return {
    id: r.id,
    type: r.entityType,
    entityId: r.entityId,
    title: r.title,
    snippet: (r.body || '').slice(0, 120),
    keywords: r.keywords,
    href: hrefFor(r.entityType, r.entityId),
  }
}

function hrefFor(type, id) {
  switch (type) {
    case 'ngo': return `/dashboard/discovery/${id}`
    case 'project': return `/dashboard/projects/${id}`
    case 'report': return '/dashboard/reporting'
    case 'location': return `/dashboard/discovery?location=${encodeURIComponent(id)}`
    case 'sdg': return `/dashboard/discovery?sdg=${id}`
    default: return '/dashboard'
  }
}
