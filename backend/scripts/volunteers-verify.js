#!/usr/bin/env node
import { eq } from 'drizzle-orm'
import { db } from '../src/db/index.js'
import { users, memberships } from '../src/db/schema.js'
import {
  getVolunteerSummary,
  createEvent,
  registerForEvent,
  mintQrToken,
  checkInWithToken,
  issueCertificate,
  listSignups,
} from '../src/services/volunteers/index.js'

const errors = []

function check(label, ok, detail) {
  if (ok) console.log(`  ✓ ${label}`)
  else {
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
    errors.push(label)
  }
}

console.log('\n=== Employee Volunteering verification ===\n')

const acmeUser = db.select().from(users).where(eq(users.email, 'admin@acme.com')).get()
const acmeMem = acmeUser
  ? db.select().from(memberships).where(eq(memberships.userId, acmeUser.id)).get()
  : null

check('Corporate tenant', !!acmeMem?.tenantId)
if (!acmeMem?.tenantId) {
  console.log('\nFAILED: no tenant\n')
  process.exit(1)
}

const tenantId = acmeMem.tenantId
const userId = acmeUser.id

const event = createEvent(tenantId, userId, {
  title: 'Verify Tree Plantation',
  description: 'Volunteer verify script event',
  location: 'Pune',
  startsAt: new Date().toISOString(),
  endsAt: new Date(Date.now() + 4 * 3600000).toISOString(),
  slots: 20,
  hoursCredit: 6,
  status: 'open',
})
check('Create volunteer event', !!event.id)

const signup = registerForEvent(tenantId, event.id, userId)
check('Employee registration', signup.status === 'registered')

const { token } = mintQrToken(tenantId, event.id)
check('QR token minted', !!token)

const checkIn = checkInWithToken(tenantId, userId, token)
check('QR check-in', checkIn.checkedIn === true || checkIn.alreadyCheckedIn === true)

const mockReq = {
  user: { id: userId, permissions: ['volunteers:manage'], tenantId },
  headers: { 'user-agent': 'volunteers-verify' },
  ip: '127.0.0.1',
}
const cert = await issueCertificate(tenantId, signup.signupId, userId, mockReq)
check('Certificate issued', !!cert.id && cert.hoursCredited === 6)

const summary = getVolunteerSummary(tenantId)
check('Summary hours logged', summary.hoursLogged >= 6, `hours=${summary.hoursLogged}`)

const signups = listSignups(tenantId, { eventId: event.id })
check('Signup list', signups.length >= 1)

console.log('')
if (errors.length) {
  console.log(`FAILED: ${errors.length} check(s)\n`)
  process.exit(1)
}
console.log('All volunteering checks passed.\n')
