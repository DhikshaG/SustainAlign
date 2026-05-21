#!/usr/bin/env node
/**
 * Verify Step 2 NGO Discovery V1 — run after migrate + seed.
 */
import { eq } from 'drizzle-orm'
import { db } from '../src/db/index.js'
import { corporateNgoSaves, corporateNgoInquiries, users, memberships } from '../src/db/schema.js'
import { listProfiles } from '../src/services/ngo/index.js'
import { getDiscoveryFilterOptions } from '../src/services/tags/index.js'
import {
  saveNgo,
  unsaveNgo,
  createNgoInquiry,
  listSavedNgos,
} from '../src/services/discovery/index.js'

const errors = []

const adminUser = db.select().from(users).where(eq(users.email, 'admin@acme.com')).get()
const adminMembership = adminUser
  ? db.select().from(memberships).where(eq(memberships.userId, adminUser.id)).get()
  : null
const TEST_USER = adminUser?.id
const TEST_CORP = adminMembership?.tenantId

function check(label, ok, detail) {
  if (ok) console.log(`  ✓ ${label}`)
  else {
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
    errors.push(label)
  }
}

console.log('\n=== Discovery V1 verification ===\n')

const filters = getDiscoveryFilterOptions()
check('Filter options: states', filters.states?.length > 1)
check('Filter options: sdgs', filters.sdgs?.length > 1)
check('Filter options: themes', filters.themes?.length > 1)
check('Filter options: impactAreas', filters.impactAreas?.length > 1)
check('Filter options: budgetRanges', filters.budgetRanges?.length > 1)

const all = listProfiles({ audience: 'corporate' })
check('List all NGOs', all.ngos.length >= 10, `found ${all.ngos.length}`)
check('Response includes total/limit/offset', all.total != null && all.limit != null && all.offset != null)

const verified = listProfiles({ verified: 'true', audience: 'corporate' })
check('Verified filter', verified.ngos.every((n) => n.verified), `${verified.ngos.length} verified`)

const maharashtra = listProfiles({ state: 'Maharashtra', audience: 'corporate' })
check('State filter (Maharashtra)', maharashtra.ngos.length >= 1, `found ${maharashtra.ngos.length}`)

const education = listProfiles({ theme: 'education', audience: 'corporate' })
check('Theme filter (education)', education.ngos.length >= 1, `found ${education.ngos.length}`)

const climate = listProfiles({ impact: 'climate', audience: 'corporate' })
check('Impact filter (climate)', climate.ngos.length >= 1, `found ${climate.ngos.length}`)

const sdg4 = listProfiles({ sdg: '4', audience: 'corporate' })
check('SDG filter (4)', sdg4.ngos.length >= 1, `found ${sdg4.ngos.length}`)

const budget = listProfiles({ budgetRange: '50L-1Cr', audience: 'corporate' })
check('Budget filter', budget.ngos.length >= 1, `found ${budget.ngos.length}`)

const search = listProfiles({ q: 'Green Earth', audience: 'corporate' })
check('Text search', search.ngos.some((n) => n.slug === 'green-earth-foundation'))

const green = all.ngos.find((n) => n.slug === 'green-earth-foundation')
check('No AI fields required in DTO', green && typeof green.name === 'string')

if (!TEST_USER || !TEST_CORP) {
  check('Seeded corporate user (admin@acme.com)', false, 'run db:seed first')
} else {
  try {
    saveNgo(TEST_USER, 'green-earth-foundation', null)
    const saved = listSavedNgos(TEST_USER)
    check('Save NGO', saved.slugs.includes('green-earth-foundation'))
    unsaveNgo(TEST_USER, 'green-earth-foundation', null)
    const after = listSavedNgos(TEST_USER)
    check('Unsave NGO', !after.slugs.includes('green-earth-foundation'))
  } catch (err) {
    check('Save/unsave round-trip', false, err.message)
  }

  try {
    db.delete(corporateNgoInquiries).where(eq(corporateNgoInquiries.userId, TEST_USER)).run()
    const result = createNgoInquiry({
      userId: TEST_USER,
      corporateTenantId: TEST_CORP,
      slug: 'green-earth-foundation',
      subject: 'Verification test inquiry',
      message: 'This is an automated discovery verify script message.',
    }, null)
    check('Contact inquiry created', !!result.inquiryId)
    const row = db.select().from(corporateNgoInquiries).where(eq(corporateNgoInquiries.id, result.inquiryId)).get()
    check('Inquiry persisted', row?.status === 'pending')
    db.delete(corporateNgoInquiries).where(eq(corporateNgoInquiries.id, result.inquiryId)).run()
  } catch (err) {
    check('Contact inquiry', false, err.message)
  }

  db.delete(corporateNgoSaves).where(eq(corporateNgoSaves.userId, TEST_USER)).run()
}

console.log('')
if (errors.length) {
  console.log(`FAILED: ${errors.length} check(s)\n`)
  process.exit(1)
}
console.log('All discovery V1 checks passed.\n')
