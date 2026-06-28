import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { tenants } from '../../db/schema.js'
import { newId } from '../../lib/ids.js'
import { upsertFullProfile } from './index.js'
import { NGO_SEED_RECORDS } from '../../data/ngo-seed.js'

export async function seedNgos() {
  const now = new Date()
  let created = 0
  let updated = 0

  for (const record of NGO_SEED_RECORDS) {
    let tenant = await db.select().from(tenants).where(eq(tenants.slug, record.slug)).get()

    if (!tenant) {
      const tenantId = newId()
      await db
        .insert(tenants)
        .values({
          id: tenantId,
          type: 'ngo',
          name: record.name,
          slug: record.slug,
          createdAt: now,
        })
        .run()
      tenant = { id: tenantId, slug: record.slug }
      created++
    } else {
      updated++
    }

    upsertFullProfile(tenant.id, record)
  }

  return { created, updated, total: NGO_SEED_RECORDS.length }
}
