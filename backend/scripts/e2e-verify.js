#!/usr/bin/env node
import { eq, and } from 'drizzle-orm'
import { db } from '../src/db/index.js'
import {
  users,
  memberships,
  volunteerEvents,
  volunteerSignups,
  volunteerAttendance,
  messageThreads,
  workflowInstances,
  activityLogs,
  files,
  csrProjects,
} from '../src/db/schema.js'

const errors = []

function check(label, ok, detail) {
  if (ok) console.log(`  ✓ ${label}`)
  else {
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
    errors.push(label)
  }
}

console.log('\n=== E2E demo dataset verification ===\n')

const acmeUser = db.select().from(users).where(eq(users.email, 'admin@acme.com')).get()
const acmeMem = acmeUser
  ? db.select().from(memberships).where(eq(memberships.userId, acmeUser.id)).get()
  : null

check('Acme corporate tenant', !!acmeMem?.tenantId)

if (acmeMem?.tenantId) {
  const acmeRoles = db.select().from(memberships)
    .where(eq(memberships.tenantId, acmeMem.tenantId)).all()
  check('Acme corporate memberships (7 roles)', acmeRoles.length >= 7, `count=${acmeRoles.length}`)
}

const roleEmails = [
  'admin@acme.com',
  'csr.head@acme.com',
  'finance@acme.com',
  'compliance@acme.com',
  'esg@acme.com',
  'volunteer@acme.com',
  'board@acme.com',
  'admin@greenearth.org',
  'field_officer@greenearth.org',
  'platform@sustainalign.com',
]
for (const email of roleEmails) {
  check(`Account ${email}`, !!db.select().from(users).where(eq(users.email, email)).get())
}

const events = db.select().from(volunteerEvents)
  .where(eq(volunteerEvents.corporateTenantId, acmeMem?.tenantId)).all()
check('Volunteer events (≥2)', events.length >= 2, `count=${events.length}`)

const eventIds = events.map((e) => e.id)
let signups = []
if (eventIds.length) {
  signups = db.select().from(volunteerSignups).all()
    .filter((s) => eventIds.includes(s.eventId))
}
check('Volunteer signups (≥1)', signups.length >= 1, `count=${signups.length}`)

const attendance = db.select().from(volunteerAttendance).all()
  .filter((a) => signups.some((s) => s.id === a.signupId))
check('Volunteer attendance (≥1)', attendance.length >= 1, `count=${attendance.length}`)

const threads = db.select().from(messageThreads)
  .where(eq(messageThreads.corporateTenantId, acmeMem?.tenantId)).all()
check('CRM message threads (≥1)', threads.length >= 1, `count=${threads.length}`)

const pendingMilestones = db.select().from(workflowInstances)
  .where(and(
    eq(workflowInstances.entityType, 'milestone'),
    eq(workflowInstances.status, 'pending'),
  )).all()
check('Pending milestone workflow (≥1)', pendingMilestones.length >= 1, `count=${pendingMilestones.length}`)

const pendingPartnership = db.select().from(csrProjects)
  .where(eq(csrProjects.ngoPartnershipStatus, 'pending')).all()
check('Pending NGO partnership (≥1)', pendingPartnership.length >= 1, `count=${pendingPartnership.length}`)

const acceptedPartnership = db.select().from(csrProjects)
  .where(eq(csrProjects.ngoPartnershipStatus, 'accepted')).all()
check('Accepted NGO partnership (≥1)', acceptedPartnership.length >= 1, `count=${acceptedPartnership.length}`)

const activity = db.select().from(activityLogs)
  .where(eq(activityLogs.tenantId, acmeMem?.tenantId)).all()
check('Activity log entries (≥2)', activity.length >= 2, `count=${activity.length}`)

const storedFiles = db.select().from(files)
  .where(eq(files.tenantId, acmeMem?.tenantId)).all()
  .filter((f) => f.checksum)
check('Stored files with checksum (≥1)', storedFiles.length >= 1, `count=${storedFiles.length}`)

console.log('')
if (errors.length) {
  console.log(`FAILED: ${errors.length} check(s)\n`)
  process.exit(1)
}
console.log('All E2E checks passed.\n')
