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
      { slug: 'women-empowerment', label: 'Women empowerment' },
      { slug: 'rural-development', label: 'Rural development' },
    ],
  },
  {
    slug: 'sdg',
    name: 'SDG Tags',
    tags: [
      { slug: 'sdg-1', label: 'SDG 1', metadata: { sdg: 1 } },
      { slug: 'sdg-4', label: 'SDG 4', metadata: { sdg: 4 } },
      { slug: 'sdg-5', label: 'SDG 5', metadata: { sdg: 5 } },
      { slug: 'sdg-13', label: 'SDG 13', metadata: { sdg: 13 } },
    ],
  },
  {
    slug: 'geography',
    name: 'Geography',
    tags: [
      { slug: 'maharashtra', label: 'Maharashtra', metadata: { type: 'state' } },
      { slug: 'karnataka', label: 'Karnataka', metadata: { type: 'state' } },
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
    ],
  },
]

const ENTITY_TAG_SEEDS = {
  'green-earth-foundation': ['climate', 'sdg-13', 'maharashtra', 'rural'],
  'edu-rise-india': ['education', 'sdg-4', 'karnataka', 'urban'],
}

export function seedTags() {
  for (const cat of TAXONOMY) {
    const existing = db.select().from(tagCategories).where(eq(tagCategories.slug, cat.slug)).get()
    const catId = existing?.id || newId()
    if (!existing) {
      db.insert(tagCategories).values({
        id: catId,
        slug: cat.slug,
        name: cat.name,
        description: null,
      }).run()
    }

    for (const t of cat.tags) {
      const tagRow = db.select().from(tags)
        .where(and(eq(tags.categoryId, catId), eq(tags.slug, t.slug)))
        .get()
      if (!tagRow) {
        db.insert(tags).values({
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
    const tenant = db.select().from(tenants).where(eq(tenants.slug, slug)).get()
    if (!tenant) continue
    const tagRows = db.select().from(tags).where(inArray(tags.slug, tagSlugs)).all()
    setEntityTags({
      entityType: 'ngo',
      entityId: tenant.id,
      tenantId: tenant.id,
      tagIds: tagRows.map((t) => t.id),
      skipActivity: true,
    })
  }
}

export function listCategories() {
  const cats = db.select().from(tagCategories).all()
  return cats.map((c) => ({
    ...c,
    tags: db.select().from(tags).where(eq(tags.categoryId, c.id)).all().map(parseTag),
  }))
}

export function listTagsByCategory(categorySlug) {
  const cat = db.select().from(tagCategories).where(eq(tagCategories.slug, categorySlug)).get()
  if (!cat) return []
  return db.select().from(tags).where(eq(tags.categoryId, cat.id)).all().map(parseTag)
}

function parseTag(t) {
  return { ...t, metadata: t.metadata ? JSON.parse(t.metadata) : null }
}

export function getEntityTags(entityType, entityId) {
  const rows = db.select({
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

export function setEntityTags({ req, entityType, entityId, tenantId, tagIds, skipActivity = false }) {
  const previous = getEntityTags(entityType, entityId)
  db.delete(entityTags)
    .where(and(eq(entityTags.entityType, entityType), eq(entityTags.entityId, entityId)))
    .run()

  const now = new Date()
  for (const tagId of tagIds) {
    db.insert(entityTags).values({
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
    const tenant = db.select().from(tenants).where(eq(tenants.id, entityId)).get()
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

export function findEntitiesByTags(entityType, tagSlugs) {
  const tagRows = db.select().from(tags).where(inArray(tags.slug, tagSlugs)).all()
  if (!tagRows.length) return []

  const tagIds = tagRows.map((t) => t.id)
  const assignments = db.select().from(entityTags)
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
