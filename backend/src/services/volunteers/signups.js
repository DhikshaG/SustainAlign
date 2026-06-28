import { eq, and, inArray } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { volunteerEvents, volunteerSignups } from '../../db/schema.js'
import { newId } from '../../lib/ids.js'
import { httpError, shapeEvent } from './helpers.js'

async function countEnrolled(eventId) {
  const rows = await db
    .select()
    .from(volunteerSignups)
    .where(and(eq(volunteerSignups.eventId, eventId), inArray(volunteerSignups.status, ['registered', 'attended'])))
    .all()
  return rows.length
}

export async function registerForEvent(corporateTenantId, eventId, userId) {
  const row = await db
    .select()
    .from(volunteerEvents)
    .where(and(eq(volunteerEvents.id, eventId), eq(volunteerEvents.corporateTenantId, corporateTenantId)))
    .get()
  if (!row) throw httpError('Event not found', 404)
  if (!['open', 'full'].includes(row.status)) {
    throw httpError('Event is not open for registration', 400)
  }

  const existing = await db
    .select()
    .from(volunteerSignups)
    .where(and(eq(volunteerSignups.eventId, eventId), eq(volunteerSignups.userId, userId)))
    .get()
  if (existing && existing.status !== 'cancelled') {
    throw httpError('Already registered for this event', 409)
  }

  const enrolled = countEnrolled(eventId)
  if (enrolled >= row.slots) throw httpError('Event is full', 400)

  const now = new Date()
  if (existing?.status === 'cancelled') {
    await db
      .update(volunteerSignups)
      .set({ status: 'registered', registeredAt: now })
      .where(eq(volunteerSignups.id, existing.id))
      .run()
    shapeEvent(row)
    return { signupId: existing.id, status: 'registered' }
  }

  const id = newId()
  await db
    .insert(volunteerSignups)
    .values({
      id,
      eventId,
      userId,
      status: 'registered',
      registeredAt: now,
    })
    .run()

  shapeEvent(row)
  return { signupId: id, status: 'registered' }
}

export async function cancelRegistration(corporateTenantId, eventId, userId) {
  const signup = await db
    .select()
    .from(volunteerSignups)
    .innerJoin(volunteerEvents, eq(volunteerSignups.eventId, volunteerEvents.id))
    .where(
      and(
        eq(volunteerSignups.eventId, eventId),
        eq(volunteerSignups.userId, userId),
        eq(volunteerEvents.corporateTenantId, corporateTenantId),
      ),
    )
    .get()
  if (!signup) throw httpError('Registration not found', 404)
  if (signup.volunteer_signups.status === 'attended') {
    throw httpError('Cannot cancel after attendance recorded', 400)
  }

  await db
    .update(volunteerSignups)
    .set({ status: 'cancelled' })
    .where(eq(volunteerSignups.id, signup.volunteer_signups.id))
    .run()

  const event = await db.select().from(volunteerEvents).where(eq(volunteerEvents.id, eventId)).get()
  if (event) shapeEvent(event)
  return { cancelled: true }
}
