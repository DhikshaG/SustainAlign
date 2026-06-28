import { eq, and } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { csrProjects, projectMilestones, users, memberships } from '../../db/schema.js'
import { createProject, submitMilestoneForReview, updateProjectSpent } from '../projects/index.js'
import { createThread, postMessage } from '../messaging/index.js'
import { createTask, updateTaskStatus } from '../tasks/index.js'
import { saveNgo, createNgoInquiry } from '../discovery/index.js'
import { storeFile, logFileDownload } from '../files/index.js'
import {
  createEvent,
  registerForEvent,
  updateEvent,
  recordManualAttendance,
  issueCertificate,
} from '../volunteers/index.js'

function mockReq(user, extra = {}) {
  return {
    user: { sub: user.id, tenantId: user.tenantId, role: user.role, ...extra },
    headers: { 'user-agent': 'e2e-seed' },
    ip: '127.0.0.1',
  }
}

async function lookupUser(email) {
  const user = await db.select().from(users).where(eq(users.email, email)).get()
  if (!user) return null
  const mem = await db.select().from(memberships).where(eq(memberships.userId, user.id)).get()
  return mem ? { id: user.id, email, role: mem.role, tenantId: mem.tenantId } : null
}

export async function seedE2e({ tenantByEmail }) {
  console.log('\n=== E2E enrichment (volunteers, CRM, audit, discovery) ===\n')

  const acmeTenantId = tenantByEmail['admin@acme.com']
  const acmeAdmin = lookupUser('admin@acme.com')
  const csrHead = lookupUser('csr.head@acme.com')
  const volunteerUser = lookupUser('volunteer@acme.com')
  const financeUser = lookupUser('finance@acme.com')
  const geAdmin = lookupUser('admin@greenearth.org')

  if (!acmeTenantId || !acmeAdmin || !geAdmin) {
    console.log('  skip  E2E (required accounts missing)')
    return
  }

  // --- Partnership + CRM on proj-001 ---
  await db
    .update(csrProjects)
    .set({ ngoPartnershipStatus: 'accepted', updatedAt: new Date() })
    .where(eq(csrProjects.id, 'proj-001'))
    .run()
  console.log('  proj-001 partnership accepted')

  const existingPending = await db.select().from(csrProjects).where(eq(csrProjects.id, 'proj-e2e-pending')).get()
  if (!existingPending) {
    createProject(
      {
        id: 'proj-e2e-pending',
        corporateTenantId: acmeTenantId,
        ngoSlug: 'green-earth-foundation',
        userId: acmeAdmin.id,
        name: 'Community Water Conservation',
        description: 'Rainwater harvesting and watershed restoration in drought-prone villages.',
        scheduleVii: 'Ensuring environmental sustainability',
        theme: 'Environment',
        location: 'Maharashtra',
        budgetInr: 1200000,
        startDate: '2026-04-01',
        endDate: '2027-03-31',
        milestones: [{ title: 'Site survey', dueDate: '2026-05-31', status: 'pending' }],
        skipWorkflow: true,
        initialStatus: 'pending_ngo',
      },
      null,
    )
    await db
      .update(csrProjects)
      .set({ ngoPartnershipStatus: 'pending', updatedAt: new Date() })
      .where(eq(csrProjects.id, 'proj-e2e-pending'))
      .run()
    console.log('  proj-e2e-pending created (NGO partnership inbox)')
  }

  const thread = createThread(
    {
      corporateTenantId: acmeTenantId,
      ngoTenantId: geAdmin.tenantId,
      projectId: 'proj-001',
      subject: 'Q4 plantation update',
      createdBy: csrHead?.id || acmeAdmin.id,
      message: 'Hi Priya Ã¢â‚¬â€ please share photos from the Nashik planting drive for our board pack.',
    },
    mockReq(csrHead || acmeAdmin),
  )
  postMessage(
    thread.id,
    geAdmin.id,
    'Photos uploaded to the project folder. Survival rate is tracking at 94%.',
    { sub: geAdmin.id, tenantId: geAdmin.tenantId, tenantType: 'ngo' },
    null,
  )
  postMessage(
    thread.id,
    (csrHead || acmeAdmin).id,
    'Excellent Ã¢â‚¬â€ we will include this in the compliance report.',
    { sub: (csrHead || acmeAdmin).id, tenantId: acmeTenantId, tenantType: 'corporate' },
    null,
  )
  console.log('  CRM message thread on proj-001')

  const openTask = createTask(
    'proj-001',
    { title: 'Upload geo-tagged plantation photos', assigneeSide: 'ngo', dueDate: '2026-02-15' },
    acmeAdmin.id,
    null,
  )
  const doneTask = createTask(
    'proj-001',
    { title: 'Submit Q3 utilization certificate', assigneeSide: 'ngo', dueDate: '2025-10-31' },
    acmeAdmin.id,
    null,
  )
  updateTaskStatus(doneTask.id, { status: 'done' }, { sub: geAdmin.id, tenantId: geAdmin.tenantId }, null)
  console.log('  CRM tasks on proj-001 (1 open, 1 done)')

  const milestone = await db
    .select()
    .from(projectMilestones)
    .where(and(eq(projectMilestones.projectId, 'proj-001'), eq(projectMilestones.title, 'Plant 1M saplings')))
    .get()
  if (milestone && milestone.reviewStatus !== 'submitted') {
    submitMilestoneForReview(
      'proj-001',
      milestone.id,
      {
        userId: geAdmin.id,
        ngoTenantId: geAdmin.tenantId,
        note: '1.02M saplings planted; awaiting corporate sign-off.',
      },
      mockReq(geAdmin),
    )
    console.log('  milestone review submitted (approval inbox)')
  }

  // --- Discovery saves + inquiry ---
  saveNgo(acmeAdmin.id, 'green-earth-foundation', mockReq(acmeAdmin))
  saveNgo(acmeAdmin.id, 'pratham-education-foundation', mockReq(acmeAdmin))
  createNgoInquiry(
    {
      userId: (csrHead || acmeAdmin).id,
      corporateTenantId: acmeTenantId,
      slug: 'sankara-eye-foundation',
      subject: 'Mobile clinic partnership inquiry',
      message: 'We are exploring healthcare CSR initiatives in Tamil Nadu for FY26.',
    },
    mockReq(csrHead || acmeAdmin),
  )
  console.log('  discovery saves + inquiry')

  // --- Audit trail samples ---
  const invoiceBuffer = Buffer.from('%PDF-1.4 E2E demo invoice for proj-001 afforestation tranche 3')
  const stored = await storeFile({
    req: mockReq(financeUser || acmeAdmin, { role: 'finance' }),
    buffer: invoiceBuffer,
    tenantId: acmeTenantId,
    tenantType: 'corporate',
    uploadedBy: (financeUser || acmeAdmin).id,
    category: 'invoice',
    originalName: 'proj-001-tranche-3-invoice.pdf',
    mime: 'application/pdf',
    entityType: 'project',
    entityId: 'proj-001',
  })

  const complianceBuffer = Buffer.from('E2E demo Section 135 compliance annex for Acme Corp FY25')
  await storeFile({
    req: mockReq(acmeAdmin, { role: 'compliance' }),
    buffer: complianceBuffer,
    tenantId: acmeTenantId,
    tenantType: 'corporate',
    uploadedBy: acmeAdmin.id,
    category: 'compliance',
    originalName: 'section-135-annex-fy25.pdf',
    mime: 'application/pdf',
    entityType: 'tenant',
    entityId: acmeTenantId,
  })

  await logFileDownload(stored.id, mockReq(financeUser || acmeAdmin, { role: 'finance' }))
  updateProjectSpent('proj-001', 3300000, {
    corporateTenantId: acmeTenantId,
    req: mockReq(financeUser || acmeAdmin, { role: 'finance' }),
  })
  console.log('  audit files + activity trail')

  // --- Volunteer events ---
  const now = Date.now()
  const upcomingStart = new Date(now + 14 * 24 * 3600000)
  const upcomingEnd = new Date(upcomingStart.getTime() + 4 * 3600000)

  const eventUpcoming = createEvent(acmeTenantId, acmeAdmin.id, {
    title: 'Acme Earth Day Cleanup',
    description: 'Riverbank cleanup and native sapling planting with Green Earth volunteers.',
    location: 'Mula River, Pune',
    startsAt: upcomingStart.toISOString(),
    endsAt: upcomingEnd.toISOString(),
    slots: 30,
    hoursCredit: 4,
    status: 'open',
  })
  registerForEvent(acmeTenantId, eventUpcoming.id, volunteerUser?.id || acmeAdmin.id)
  if (csrHead) registerForEvent(acmeTenantId, eventUpcoming.id, csrHead.id)
  console.log('  upcoming volunteer event with signups')

  const pastStart = new Date(now - 30 * 24 * 3600000)
  const pastEnd = new Date(pastStart.getTime() + 5 * 3600000)
  const eventPast = createEvent(acmeTenantId, acmeAdmin.id, {
    title: 'School Kit Packing Day',
    description: 'Pack and label education kits for rural Karnataka schools.',
    location: 'Acme HQ, Mumbai',
    startsAt: pastStart.toISOString(),
    endsAt: pastEnd.toISOString(),
    slots: 25,
    hoursCredit: 6,
    status: 'open',
  })

  const volId = volunteerUser?.id || acmeAdmin.id
  const pastSignup = registerForEvent(acmeTenantId, eventPast.id, volId)
  recordManualAttendance(acmeTenantId, eventPast.id, [pastSignup.signupId], acmeAdmin.id)
  updateEvent(acmeTenantId, eventPast.id, { status: 'completed' })

  const certReq = mockReq(acmeAdmin, { permissions: ['volunteers:manage'] })
  await issueCertificate(acmeTenantId, pastSignup.signupId, volId, certReq)
  console.log('  completed volunteer event with certificate')

  console.log('\n  E2E enrichment complete\n')
}
