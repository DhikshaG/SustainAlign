import { eq, and, sql, inArray } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { volunteerEvents, volunteerSignups } from '../../db/schema.js'

export function httpError(message, status) {
  const err = new Error(message)
  err.status = status
  return err
}

export function countEnrolled(eventId) {
  const row = db.select({ count: sql`count(*)` })
    .from(volunteerSignups)
    .where(and(
      eq(volunteerSignups.eventId, eventId),
      inArray(volunteerSignups.status, ['registered', 'attended']),
    ))
    .get()
  return Number(row?.count ?? 0)
}

export function refreshEventStatus(event) {
  if (['completed', 'cancelled', 'draft'].includes(event.status)) return event.status
  const enrolled = countEnrolled(event.id)
  if (enrolled >= event.slots) {
    db.update(volunteerEvents).set({ status: 'full', updatedAt: new Date() })
      .where(eq(volunteerEvents.id, event.id)).run()
    return 'full'
  }
  if (event.status === 'full' && enrolled < event.slots) {
    db.update(volunteerEvents).set({ status: 'open', updatedAt: new Date() })
      .where(eq(volunteerEvents.id, event.id)).run()
    return 'open'
  }
  return event.status
}

export function shapeEvent(row, { includeEnrolled = true } = {}) {
  const enrolled = includeEnrolled ? countEnrolled(row.id) : undefined
  const status = includeEnrolled ? refreshEventStatus(row) : row.status
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    location: row.location,
    startsAt: row.startsAt?.toISOString?.() ?? row.startsAt,
    endsAt: row.endsAt?.toISOString?.() ?? row.endsAt,
    slots: row.slots,
    status,
    hoursCredit: row.hoursCredit,
    createdBy: row.createdBy,
    enrolled,
    createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
    updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt,
  }
}
