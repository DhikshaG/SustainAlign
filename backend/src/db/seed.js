import { eq } from 'drizzle-orm'
import { db } from './index.js'
import { users, tenants, memberships, ngoProfiles, notifications } from './schema.js'
import { hashPassword } from '../lib/password.js'
import { newId } from '../lib/ids.js'
import { createNotification } from '../services/notifications/index.js'
import { reindexAll } from '../services/search/index.js'
import { seedTags } from '../services/tags/index.js'
import { seedWorkflowDefinitions } from '../services/workflow/index.js'
import { seedNgos } from '../services/ngo/seed.js'

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
    email: 'field_officer@greenearth.org',
    name: 'Ravi Kumar',
    type: 'ngo',
    role: 'field_officer',
    slug: 'green-earth-foundation',
    linkTenant: 'admin@greenearth.org',
  },
  {
    email: 'platform@sustainalign.com',
    name: 'SustainAlign Platform',
    type: 'platform',
    role: 'platform_super_admin',
    slug: 'sustainalign-platform',
  },
]

const NOTIFICATION_SEEDS = [
  { type: 'report.pending', title: 'Q4 utilization report due', body: 'Submit your quarterly utilization report by month end.', link: '/dashboard/reporting' },
  { type: 'compliance.deadline', title: 'Section 135 filing reminder', body: 'Annual CSR compliance filing is due in 14 days.', link: '/dashboard/compliance' },
  { type: 'milestone.delayed', title: 'Milestone behind schedule', body: 'Tree plantation milestone is 5 days overdue.', link: '/dashboard/projects' },
]

export async function runSeed() {
  const passwordHash = await hashPassword(SEED_PASSWORD)
  const now = new Date()
  const tenantByEmail = {}

  console.log('\n=== Seeding SustainAlign dev accounts ===\n')

  for (const acct of accounts) {
    const existing = db.select().from(users).where(eq(users.email, acct.email)).get()
    if (existing) {
      console.log(`  skip  ${acct.email} (exists)`)
      const membership = db.select().from(memberships).where(eq(memberships.userId, existing.id)).get()
      if (membership) tenantByEmail[acct.email] = membership.tenantId
      continue
    }

    let tenantId
    if (acct.linkTenant) {
      tenantId = tenantByEmail[acct.linkTenant]
      if (!tenantId) {
        const linked = db.select().from(users).where(eq(users.email, acct.linkTenant)).get()
        const mem = linked && db.select().from(memberships).where(eq(memberships.userId, linked.id)).get()
        tenantId = mem?.tenantId
      }
      if (!tenantId) {
        console.log(`  skip  ${acct.email} (linked tenant not found)`)
        continue
      }
    } else {
      tenantId = newId()
      db.insert(tenants).values({
        id: tenantId,
        type: acct.type,
        name: acct.name,
        slug: acct.slug,
        createdAt: now,
      }).run()
    }

    const userId = newId()

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

    tenantByEmail[acct.email] = tenantId
    console.log(`  added ${acct.email} (${acct.role})`)
  }

  console.log('\n=== Seeding notifications ===\n')
  const allUsers = db.select().from(users).all()
  for (const user of allUsers) {
    const existing = db.select().from(notifications).where(eq(notifications.userId, user.id)).all()
    if (existing.length > 0) {
      console.log(`  skip  notifications for ${user.email}`)
      continue
    }
    const membership = db.select().from(memberships).where(eq(memberships.userId, user.id)).get()
    if (!membership) continue
    for (const n of NOTIFICATION_SEEDS) {
      await createNotification({
        userId: user.id,
        tenantId: membership.tenantId,
        ...n,
        link: user.tenantType === 'ngo' ? n.link?.replace('/dashboard', '/ngo') : n.link,
        sendEmailFlag: false,
      })
    }
    console.log(`  notifications for ${user.email}`)
  }

  console.log(`\n  Password for all seeded accounts: ${SEED_PASSWORD}\n`)

  console.log('=== Seeding tags ===\n')
  seedTags()
  console.log('  tags seeded')

  console.log('\n=== Seeding NGO profiles ===\n')
  const ngoResult = seedNgos()
  console.log(`  ${ngoResult.total} NGOs (${ngoResult.created} new tenants, ${ngoResult.updated} updated)`)

  console.log('\n=== Indexing search documents ===\n')
  reindexAll()
  console.log('  search index built')

  console.log('\n=== Seeding workflows ===\n')
  seedWorkflowDefinitions()
  console.log('  workflow definitions seeded')
}
