import { eq } from 'drizzle-orm'
import { db } from './index.js'
import { users, tenants, memberships, ngoProfiles } from './schema.js'
import { hashPassword } from '../lib/password.js'
import { newId } from '../lib/ids.js'

const SEED_PASSWORD = 'Demo@12345'

const accounts = [
  {
    email: 'admin@acme.com',
    name: 'Acme Corp',
    type: 'corporate',
    role: 'super_admin',
    slug: 'acme-corp',
  },
  {
    email: 'admin@greenearth.org',
    name: 'Green Earth Foundation',
    type: 'ngo',
    role: 'ngo_admin',
    slug: 'green-earth-foundation',
    ngo: { registrationNumber: 'NGO-12345', sectors: ['Environment'], contactPerson: 'Priya Sharma' },
  },
  {
    email: 'platform@sustainalign.com',
    name: 'SustainAlign Platform',
    type: 'platform',
    role: 'platform_super_admin',
    slug: 'sustainalign-platform',
  },
]

export async function runSeed() {
  const passwordHash = await hashPassword(SEED_PASSWORD)
  const now = new Date()

  console.log('\n=== Seeding SustainAlign dev accounts ===\n')

  for (const acct of accounts) {
    const existing = db.select().from(users).where(eq(users.email, acct.email)).get()
    if (existing) {
      console.log(`  skip  ${acct.email} (exists)`)
      continue
    }

    const userId = newId()
    const tenantId = newId()

    db.insert(tenants).values({
      id: tenantId,
      type: acct.type,
      name: acct.name,
      slug: acct.slug,
      createdAt: now,
    }).run()

    db.insert(users).values({
      id: userId,
      email: acct.email,
      passwordHash,
      fullName: acct.name,
      tenantType: acct.type,
      mfaEnabled: false,
      createdAt: now,
      updatedAt: now,
    }).run()

    db.insert(memberships).values({
      id: newId(),
      userId,
      tenantId,
      role: acct.role,
      status: 'active',
      createdAt: now,
    }).run()

    if (acct.ngo) {
      db.insert(ngoProfiles).values({
        tenantId,
        registrationNumber: acct.ngo.registrationNumber,
        sectors: JSON.stringify(acct.ngo.sectors),
        verificationStatus: 'verified',
        contactPerson: acct.ngo.contactPerson,
        createdAt: now,
      }).run()
    }

    console.log(`  added ${acct.email} (${acct.role})`)
  }

  console.log(`\n  Password for all seeded accounts: ${SEED_PASSWORD}\n`)
}
