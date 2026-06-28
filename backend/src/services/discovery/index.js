import { eq, and } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { tenants, corporateNgoSaves, corporateNgoInquiries } from '../../db/schema.js'
import { newId } from '../../lib/ids.js'
import { getProfileByTenantId } from '../ngo/index.js'
import { logMutation } from '../activity-log/index.js'

async function resolveNgoTenant(slug) {
  const tenant = await db
    .select()
    .from(tenants)
    .where(and(eq(tenants.slug, slug), eq(tenants.type, 'ngo')))
    .get()
  if (!tenant) {
    const err = new Error('NGO not found')
    err.status = 404
    throw err
  }
  return tenant
}

export async function listSavedNgos(userId, audience = 'corporate') {
  const saves = await db.select().from(corporateNgoSaves).where(eq(corporateNgoSaves.userId, userId)).all()
  const ngos = saves.map((s) => getProfileByTenantId(s.ngoTenantId, audience)).filter(Boolean)
  return { ngos, slugs: ngos.map((n) => n.slug) }
}

export async function saveNgo(userId, slug, req) {
  const tenant = resolveNgoTenant(slug)
  const existing = await db
    .select()
    .from(corporateNgoSaves)
    .where(and(eq(corporateNgoSaves.userId, userId), eq(corporateNgoSaves.ngoTenantId, tenant.id)))
    .get()
  if (existing) return { saved: true, slug, alreadySaved: true }

  const id = newId()
  const now = new Date()
  await db
    .insert(corporateNgoSaves)
    .values({
      id,
      userId,
      ngoTenantId: tenant.id,
      createdAt: now,
    })
    .run()

  if (req) {
    logMutation({
      req,
      action: 'discovery.save_ngo',
      entityType: 'ngo',
      entityId: slug,
      after: { slug },
    }).catch(() => {})
  }

  return { saved: true, slug, alreadySaved: false }
}

export async function unsaveNgo(userId, slug, req) {
  const tenant = resolveNgoTenant(slug)
  await db
    .delete(corporateNgoSaves)
    .where(and(eq(corporateNgoSaves.userId, userId), eq(corporateNgoSaves.ngoTenantId, tenant.id)))
    .run()

  if (req) {
    logMutation({
      req,
      action: 'discovery.unsave_ngo',
      entityType: 'ngo',
      entityId: slug,
      after: { slug },
    }).catch(() => {})
  }

  return { saved: false, slug }
}

export async function createNgoInquiry({ userId, corporateTenantId, slug, subject, message }, req) {
  const tenant = resolveNgoTenant(slug)
  const id = newId()
  const now = new Date()

  await db
    .insert(corporateNgoInquiries)
    .values({
      id,
      userId,
      corporateTenantId,
      ngoTenantId: tenant.id,
      subject,
      message,
      status: 'pending',
      createdAt: now,
    })
    .run()

  if (req) {
    logMutation({
      req,
      action: 'discovery.contact_ngo',
      entityType: 'ngo',
      entityId: slug,
      after: { inquiryId: id, subject },
    }).catch(() => {})
  }

  return { inquiryId: id, slug, status: 'pending' }
}
