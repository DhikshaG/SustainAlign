import { eq, and } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { users, tenants, memberships, csrProjects, projectUpdates } from '../../db/schema.js'
import { createProject } from './index.js'
import { newId } from '../../lib/ids.js'

const SEED_PROJECTS = [
  {
    id: 'proj-001',
    name: 'Green Maharashtra Afforestation',
    ngoSlug: 'green-earth-foundation',
    status: 'active',
    scheduleVii: 'Ensuring environmental sustainability',
    theme: 'Environment',
    location: 'Maharashtra',
    description: 'Large-scale afforestation across 85 villages in Pune and Nashik districts with community participation.',
    budgetInr: 4500000,
    spentInr: 3240000,
    startDate: '2025-04-01',
    endDate: '2026-03-31',
    milestones: [
      { title: 'Site identification & sapling procurement', dueDate: '2025-05-15', status: 'completed', progress: 100 },
      { title: 'Plant 500K saplings', dueDate: '2025-09-30', status: 'completed', progress: 100 },
      { title: 'Plant 1M saplings', dueDate: '2025-12-31', status: 'in_progress', progress: 72 },
      { title: 'Survival audit & reporting', dueDate: '2026-02-28', status: 'pending', progress: 0 },
    ],
    updates: [
      { body: 'Monsoon planting phase completed in Nashik. 320K saplings added.', authorEmail: 'admin@greenearth.org' },
      { body: 'Q3 utilization certificate verified and filed.', authorEmail: 'admin@acme.com' },
    ],
  },
  {
    id: 'proj-002',
    name: 'Digital Classrooms Karnataka',
    ngoSlug: 'edu-rise-india',
    status: 'pending_approval',
    scheduleVii: 'Promoting education',
    theme: 'Education',
    location: 'Karnataka',
    description: 'Establish digital learning centers in rural Karnataka with teacher training and content localization.',
    budgetInr: 2800000,
    spentInr: 0,
    startDate: '2025-06-01',
    endDate: '2026-05-31',
    milestones: [
      { title: 'Center setup (50 locations)', dueDate: '2025-08-31', status: 'pending', progress: 0 },
      { title: 'Teacher training batch 1', dueDate: '2025-10-31', status: 'pending', progress: 0 },
    ],
    updates: [],
  },
  {
    id: 'proj-003',
    name: 'Mobile Health Tamil Nadu',
    ngoSlug: 'health-for-all-trust',
    status: 'active',
    scheduleVii: 'Promoting health care',
    theme: 'Healthcare',
    location: 'Tamil Nadu',
    description: 'Mobile clinic units serving primary healthcare in underserved blocks of Tamil Nadu.',
    budgetInr: 3200000,
    spentInr: 2816000,
    startDate: '2025-04-01',
    endDate: '2026-03-31',
    milestones: [
      { title: 'Deploy 8 mobile units', dueDate: '2025-06-30', status: 'completed', progress: 100 },
      { title: '500 health camps', dueDate: '2025-12-31', status: 'completed', progress: 100 },
      { title: '100K patients served', dueDate: '2026-03-31', status: 'in_progress', progress: 88 },
    ],
    updates: [
      { body: 'Crossed 88K patients. Maternal health camps added in Madurai.', authorEmail: 'info@healthforall.org' },
    ],
  },
]

export function seedProjects() {
  const acmeUser = db.select().from(users).where(eq(users.email, 'admin@acme.com')).get()
  const acmeMem = acmeUser
    ? db.select().from(memberships).where(eq(memberships.userId, acmeUser.id)).get()
    : null
  if (!acmeUser || !acmeMem) {
    console.log('  skip  projects (acme corp not seeded)')
    return { created: 0, skipped: 0 }
  }

  let created = 0
  let skipped = 0

  for (const spec of SEED_PROJECTS) {
    const existing = db.select().from(csrProjects).where(eq(csrProjects.id, spec.id)).get()
    if (existing) {
      skipped++
      continue
    }

    const ngo = db.select().from(tenants).where(and(eq(tenants.slug, spec.ngoSlug), eq(tenants.type, 'ngo'))).get()
    if (!ngo) {
      console.log(`  skip  ${spec.id} (NGO ${spec.ngoSlug} not found)`)
      skipped++
      continue
    }

    createProject({
      id: spec.id,
      corporateTenantId: acmeMem.tenantId,
      ngoTenantId: ngo.id,
      userId: acmeUser.id,
      name: spec.name,
      description: spec.description,
      scheduleVii: spec.scheduleVii,
      theme: spec.theme,
      location: spec.location,
      budgetInr: spec.budgetInr,
      startDate: spec.startDate,
      endDate: spec.endDate,
      milestones: spec.milestones,
      skipWorkflow: true,
      initialStatus: spec.status,
    }, null)

    db.update(csrProjects)
      .set({ spentInr: spec.spentInr, updatedAt: new Date() })
      .where(eq(csrProjects.id, spec.id))
      .run()

    for (const u of spec.updates) {
      const author = db.select().from(users).where(eq(users.email, u.authorEmail)).get()
      if (!author) continue
      db.insert(projectUpdates).values({
        id: newId(),
        projectId: spec.id,
        authorUserId: author.id,
        body: u.body,
        createdAt: new Date(),
      }).run()
    }

    created++
    console.log(`  project ${spec.id} (${spec.name})`)
  }

  return { created, skipped }
}
