import { eq, and, inArray } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { tagCategories, tags, entityTags, tenants } from '../../db/schema.js'
import { newId } from '../../lib/ids.js'
import { logMutation } from '../activity-log/index.js'
import { indexDocument } from '../search/index.js'

const TAXONOMY = [
  {
    slug: 'ngo_theme',
    name: 'NGO Themes',
    tags: [
      { slug: 'education', label: 'Education' },
      { slug: 'healthcare', label: 'Healthcare' },
      { slug: 'environment', label: 'Environment' },
      { slug: 'women-empowerment', label: 'Women empowerment' },
      { slug: 'rural-development', label: 'Rural development' },
      { slug: 'livelihood', label: 'Livelihood' },
      { slug: 'child-welfare', label: 'Child welfare' },
      { slug: 'disaster-relief', label: 'Disaster relief' },
    ],
  },
  {
    slug: 'sdg',
    name: 'SDG Tags',
    tags: [
      { slug: 'sdg-1', label: 'SDG 1', metadata: { sdg: 1 } },
      { slug: 'sdg-3', label: 'SDG 3', metadata: { sdg: 3 } },
      { slug: 'sdg-4', label: 'SDG 4', metadata: { sdg: 4 } },
      { slug: 'sdg-5', label: 'SDG 5', metadata: { sdg: 5 } },
      { slug: 'sdg-6', label: 'SDG 6', metadata: { sdg: 6 } },
      { slug: 'sdg-8', label: 'SDG 8', metadata: { sdg: 8 } },
      { slug: 'sdg-10', label: 'SDG 10', metadata: { sdg: 10 } },
      { slug: 'sdg-13', label: 'SDG 13', metadata: { sdg: 13 } },
      { slug: 'sdg-15', label: 'SDG 15', metadata: { sdg: 15 } },
    ],
  },
  {
    slug: 'geography',
    name: 'Geography',
    tags: [
      { slug: 'maharashtra', label: 'Maharashtra', metadata: { type: 'state' } },
      { slug: 'karnataka', label: 'Karnataka', metadata: { type: 'state' } },
      { slug: 'tamil-nadu', label: 'Tamil Nadu', metadata: { type: 'state' } },
      { slug: 'rajasthan', label: 'Rajasthan', metadata: { type: 'state' } },
      { slug: 'delhi-ncr', label: 'Delhi NCR', metadata: { type: 'state' } },
      { slug: 'bihar', label: 'Bihar', metadata: { type: 'state' } },
      { slug: 'gujarat', label: 'Gujarat', metadata: { type: 'state' } },
      { slug: 'kerala', label: 'Kerala', metadata: { type: 'state' } },
      { slug: 'odisha', label: 'Odisha', metadata: { type: 'state' } },
      { slug: 'pan-india', label: 'Pan-India', metadata: { type: 'state' } },
      { slug: 'rural', label: 'Rural', metadata: { type: 'settlement' } },
      { slug: 'urban', label: 'Urban', metadata: { type: 'settlement' } },
    ],
  },
  {
    slug: 'impact',
    name: 'Impact Tags',
    tags: [
      { slug: 'climate', label: 'Climate' },
      { slug: 'livelihood', label: 'Livelihood' },
      { slug: 'child-welfare', label: 'Child welfare' },
      { slug: 'water-sanitation', label: 'Water & Sanitation' },
    ],
  },
]

const ENTITY_TAG_SEEDS = {
  'green-earth-foundation': ['climate', 'sdg-13', 'maharashtra', 'rural'],
  'pratham-education-foundation': ['education', 'sdg-4', 'pan-india', 'urban'],
  'sankara-eye-foundation': ['healthcare', 'sdg-3', 'tamil-nadu', 'rural'],
  'goonj': ['rural-development', 'sdg-1', 'delhi-ncr', 'rural'],
  'giveindia-foundation': ['education', 'sdg-10', 'maharashtra', 'urban'],
  'nanhi-kali': ['education', 'sdg-5', 'pan-india', 'rural'],
}

export async function seedTags() {
  for (const cat of TAXONOMY) {
    const existing = await db.select().from(tagCategories).where(eq(tagCategories.slug, cat.slug)).get()
    const catId = existing?.id || newId()
    if (!existing) {
      await db.insert(tagCategories).values({
        id: catId,
        slug: cat.slug,
        name: cat.name,
        description: null,
      }).run()
    }

    for (const t of cat.tags) {
      const tagRow = await db.select().from(tags)
        .where(and(eq(tags.categoryId, catId), eq(tags.slug, t.slug)))
        .get()
      if (!tagRow) {
        await db.insert(tags).values({
          id: newId(),
          categoryId: catId,
          slug: t.slug,
          label: t.label,
          metadata: t.metadata ? JSON.stringify(t.metadata) : null,
        }).run()
      }
    }
  }

  for (const [slug, tagSlugs] of Object.entries(ENTITY_TAG_SEEDS)) {
    const tenant = await db.select().from(tenants).where(eq(tenants.slug, slug)).get()
    if (!tenant) continue
    const tagRows = await db.select().from(tags).where(inArray(tags.slug, tagSlugs)).all()
    setEntityTags({
      entityType: 'ngo',
      entityId: tenant.id,
      tenantId: tenant.id,
      tagIds: tagRows.map((t) => t.id),
      skipActivity: true,
    })
  }
}

export async function listCategories() {
  const cats = await db.select().from(tagCategories).all()
  return cats.map(async (c) => ({
    ...c,
    tags: await db.select().from(tags).where(eq(tags.categoryId, c.id)).all().map(parseTag),
  }))
}

export async function listTagsByCategory(categorySlug) {
  const cat = await db.select().from(tagCategories).where(eq(tagCategories.slug, categorySlug)).get()
  if (!cat) return []
  return await db.select().from(tags).where(eq(tags.categoryId, cat.id)).all().map(parseTag)
}

function parseTag(t) {
  return { ...t, metadata: t.metadata ? JSON.parse(t.metadata) : null }
}

export async function getEntityTags(entityType, entityId) {
  const rows = await db.select({
    id: tags.id,
    slug: tags.slug,
    label: tags.label,
    categoryId: tags.categoryId,
    metadata: tags.metadata,
  })
    .from(entityTags)
    .innerJoin(tags, eq(entityTags.tagId, tags.id))
    .where(and(eq(entityTags.entityType, entityType), eq(entityTags.entityId, entityId)))
    .all()
  return rows.map(parseTag)
}

export async function setEntityTags({ req, entityType, entityId, tenantId, tagIds, skipActivity = false }) {
  const previous = getEntityTags(entityType, entityId)
  await db.delete(entityTags)
    .where(and(eq(entityTags.entityType, entityType), eq(entityTags.entityId, entityId)))
    .run()

  const now = new Date()
  for (const tagId of tagIds) {
    await db.insert(entityTags).values({
      id: newId(),
      entityType,
      entityId,
      tagId,
      tenantId,
      createdAt: now,
    }).run()
  }

  const updated = getEntityTags(entityType, entityId)
  if (!skipActivity && req) {
    logMutation({
      req,
      action: 'tag.assign',
      entityType,
      entityId,
      before: { tags: previous.map((t) => t.slug) },
      after: { tags: updated.map((t) => t.slug) },
    }).catch(() => {})
  }

  if (entityType === 'ngo') {
    const tenant = await db.select().from(tenants).where(eq(tenants.id, entityId)).get()
    if (tenant) {
      indexDocument({
        tenantId,
        entityType: 'ngo',
        entityId: tenant.slug,
        title: tenant.name,
        keywords: updated.map((t) => t.slug),
      })
    }
  }

  return updated
}

export async function findEntitiesByTags(entityType, tagSlugs) {
  if (!tagSlugs?.length) return []
  const tagRows = await db.select().from(tags).where(inArray(tags.slug, tagSlugs)).all()
  if (!tagRows.length) return []

  const tagIds = tagRows.map((t) => t.id)
  const assignments = await db.select().from(entityTags)
    .where(and(eq(entityTags.entityType, entityType), inArray(entityTags.tagId, tagIds)))
    .all()

  const counts = {}
  for (const a of assignments) {
    counts[a.entityId] = (counts[a.entityId] || 0) + 1
  }

  return Object.entries(counts)
    .filter(([, count]) => count >= tagSlugs.length)
    .map(([entityId]) => entityId)
}

/** Each group is OR'd internally; groups are AND'd together. */
export async function findEntitiesByTagGroups(entityType, tagGroups) {
  const groups = tagGroups.filter((g) => g?.length)
  if (!groups.length) return null

  let result = null
  for (const group of groups) {
    const tagRows = await db.select().from(tags).where(inArray(tags.slug, group)).all()
    if (!tagRows.length) return []

    const tagIds = tagRows.map((t) => t.id)
    const assignments = await db.select().from(entityTags)
      .where(and(eq(entityTags.entityType, entityType), inArray(entityTags.tagId, tagIds)))
      .all()

    const entityIds = new Set()
    const counts = {}
    for (const a of assignments) {
      counts[a.entityId] = (counts[a.entityId] || 0) + 1
    }
    for (const [entityId, count] of Object.entries(counts)) {
      if (count >= 1) entityIds.add(entityId)
    }

    if (result === null) {
      result = entityIds
    } else {
      result = new Set([...result].filter((id) => entityIds.has(id)))
    }
  }

  return result ? [...result] : []
}

export function getDiscoveryFilterOptions() {
  const states = listTagsByCategory('geography')
    .filter((t) => t.metadata?.type === 'state')
    .map((t) => ({ value: t.label, slug: t.slug, label: t.label }))

  const sdgs = listTagsByCategory('sdg').map((t) => ({
    value: String(t.metadata?.sdg ?? t.slug.replace('sdg-', '')),
    slug: t.slug,
    label: t.label,
  }))

  const themes = listTagsByCategory('ngo_theme').map((t) => ({
    value: t.slug,
    slug: t.slug,
    label: t.label,
  }))

  const impactAreas = listTagsByCategory('impact').map((t) => ({
    value: t.slug,
    slug: t.slug,
    label: t.label,
  }))

  return {
    states: [{ value: 'All', label: 'All states' }, ...states.map((s) => ({ value: s.value, label: s.label }))],
    sdgs: [{ value: 'all', label: 'All SDGs' }, ...sdgs.map((s) => ({ value: s.value, label: s.label }))],
    themes: [{ value: 'All', label: 'All themes' }, ...themes.map((t) => ({ value: t.slug, label: t.label }))],
    impactAreas: [{ value: 'all', label: 'All impact areas' }, ...impactAreas.map((i) => ({ value: i.slug, label: i.label }))],
    budgetRanges: ['All', 'Under 10L', '10L-25L', '25L-50L', '50L-1Cr', '1Cr+'].map((b) => ({ value: b, label: b === 'All' ? 'All budgets' : b })),
    verifiedOptions: [
      { value: 'all', label: 'All NGOs' },
      { value: 'true', label: 'Verified only' },
    ],
  }
}

const STATE_LABEL_TO_SLUG = {
  Maharashtra: 'maharashtra',
  Karnataka: 'karnataka',
  'Tamil Nadu': 'tamil-nadu',
  Rajasthan: 'rajasthan',
  'Delhi NCR': 'delhi-ncr',
  Bihar: 'bihar',
  Gujarat: 'gujarat',
  Kerala: 'kerala',
  Odisha: 'odisha',
  'Pan-India': 'pan-india',
}

export function resolveStateGeographySlug(state) {
  if (!state || state === 'All') return null
  if (STATE_LABEL_TO_SLUG[state]) return STATE_LABEL_TO_SLUG[state]
  const normalized = state.toLowerCase().replace(/\s+/g, '-')
  const geo = listTagsByCategory('geography').find((t) => t.slug === normalized || t.label.toLowerCase() === state.toLowerCase())
  return geo?.slug ?? null
}

export function resolveThemeSlug(theme) {
  if (!theme || theme === 'All') return null
  const row = listTagsByCategory('ngo_theme').find(
    (t) => t.slug === theme || t.label.toLowerCase() === theme.toLowerCase(),
  )
  return row?.slug ?? theme.toLowerCase().replace(/\s+/g, '-')
}

export function resolveImpactSlug(impact) {
  if (!impact || impact === 'all') return null
  const row = listTagsByCategory('impact').find(
    (t) => t.slug === impact || t.label.toLowerCase() === impact.toLowerCase(),
  )
  return row?.slug ?? impact
}
