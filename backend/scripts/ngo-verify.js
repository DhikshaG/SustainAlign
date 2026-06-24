#!/usr/bin/env node
/**
 * Verify Step 1 NGO seed data — run after `npm run db:seed`.
 * Exit 0 when all checks pass; exit 1 otherwise.
 */
import { eq } from 'drizzle-orm'
import { db } from '../src/db/index.js'
import { tenants, ngoProfiles, ngoTeamMembers, ngoPastProjects } from '../src/db/schema.js'
import { NGO_SEED_SLUGS } from '../src/data/ngo-seed.js'
import { listProfiles, getProfileBySlug } from '../src/services/ngo/index.js'

const errors = []
const warnings = []

function check(label, ok, detail) {
  if (ok) console.log(`  ✓ ${label}`)
  else {
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
    errors.push(label)
  }
}

console.log('\n=== NGO seed verification ===\n')

const ngoTenants = db.select().from(tenants).where(eq(tenants.type, 'ngo')).all()
check(`At least ${NGO_SEED_SLUGS.length} NGO tenants`, ngoTenants.length >= NGO_SEED_SLUGS.length, `found ${ngoTenants.length}`)

for (const slug of NGO_SEED_SLUGS) {
  const tenant = ngoTenants.find((t) => t.slug === slug)
  if (!tenant) {
    check(`Tenant exists: ${slug}`, false)
    continue
  }
  const profile = db.select().from(ngoProfiles).where(eq(ngoProfiles.tenantId, tenant.id)).get()
  check(`Profile row: ${slug}`, !!profile)
  if (profile) {
    check(`Description: ${slug}`, !!profile.description?.trim())
    check(`Region: ${slug}`, !!profile.region)
  }
}

const verified = listProfiles({ verifiedOnly: true, audience: 'public' })
check('Public verified list non-empty', verified.ngos.length >= 8, `found ${verified.ngos.length}`)

const corporate = listProfiles({ audience: 'corporate' })
check('Corporate discovery list', corporate.ngos.length >= NGO_SEED_SLUGS.length, `found ${corporate.ngos.length}`)

const sample = getProfileBySlug('green-earth-foundation', { audience: 'corporate' })
check('Green Earth full DTO', !!sample?.name && !!sample?.team?.length)
if (sample && !sample.pastProjects?.length) warnings.push('green-earth-foundation has no past projects')

const pending = db.select().from(ngoProfiles).where(eq(ngoProfiles.verificationStatus, 'pending')).all()
check('Pending verification queue (2 unverified)', pending.length >= 2, `found ${pending.length}`)

const teamCount = db.select().from(ngoTeamMembers).all().length
const projectCount = db.select().from(ngoPastProjects).all().length
check('Team members seeded', teamCount >= 10, `found ${teamCount}`)
check('Past projects seeded', projectCount >= 10, `found ${projectCount}`)

console.log('')
if (warnings.length) {
  console.log('Warnings:')
  for (const w of warnings) console.log(`  - ${w}`)
  console.log('')
}

if (errors.length) {
  console.log(`FAILED: ${errors.length} check(s)\n`)
  process.exit(1)
}

console.log('All NGO seed checks passed.\n')
