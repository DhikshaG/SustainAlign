import { eq, and, inArray } from 'drizzle-orm'
import { db } from '../../db/index.js'
import {
  volunteerEvents,
  volunteerSignups,
  volunteerAttendance,
  volunteerCertificates,
  users,
  memberships,
} from '../../db/schema.js'
import { newId } from '../../lib/ids.js'
import { httpError, shapeEvent } from './helpers.js'

export async function getVolunteerSummary(corporateTenantId) {
  const events = await db
    .select()
    .from(volunteerEvents)
    .where(eq(volunteerEvents.corporateTenantId, corporateTenantId))
    .all()

  const eventIds = events.map((e) => e.id)
  let signups = []
  if (eventIds.length) {
    signups = await db.select().from(volunteerSignups).where(inArray(volunteerSignups.eventId, eventIds)).all()
  }

  const attended = signups.filter((s) => s.status === 'attended')
  const volunteerUserIds = new Set(attended.map((s) => s.userId))

  const certs = eventIds.length
    ? await db
        .select()
        .from(volunteerCertificates)
        .innerJoin(volunteerSignups, eq(volunteerCertificates.signupId, volunteerSignups.id))
        .where(inArray(volunteerSignups.eventId, eventIds))
        .all()
    : []

  const hoursLogged = certs.reduce((sum, c) => sum + (c.volunteer_certificates?.hoursCredited ?? 0), 0)
  const now = new Date()
  const upcoming = events.filter((e) => ['open', 'full'].includes(e.status) && new Date(e.startsAt) >= now).length

  return {
    campaigns: events.filter((e) => ['open', 'full'].includes(e.status)).length,
    volunteers: volunteerUserIds.size,
    hoursLogged: Math.round(hoursLogged),
    eventsUpcoming: upcoming,
    activeEvents: events.filter((e) => e.status === 'open' || e.status === 'full').length,
  }
}

export async function listEvents(corporateTenantId, { status } = {}) {
  let rows = await db
    .select()
    .from(volunteerEvents)
    .where(eq(volunteerEvents.corporateTenantId, corporateTenantId))
    .orderBy(volunteerEvents.startsAt)
    .all()
  if (status) rows = rows.filter((r) => r.status === status)
  return rows.map((r) => shapeEvent(r))
}

export async function getEvent(corporateTenantId, eventId) {
  const row = await db
    .select()
    .from(volunteerEvents)
    .where(and(eq(volunteerEvents.id, eventId), eq(volunteerEvents.corporateTenantId, corporateTenantId)))
    .get()
  if (!row) throw httpError('Event not found', 404)
  return shapeEvent(row)
}

export async function createEvent(corporateTenantId, userId, data) {
  const now = new Date()
  const id = newId()
  const status = data.status === 'open' ? 'open' : 'draft'
  await db
    .insert(volunteerEvents)
    .values({
      id,
      corporateTenantId,
      title: data.title,
      description: data.description || null,
      location: data.location,
      startsAt: new Date(data.startsAt),
      endsAt: new Date(data.endsAt),
      slots: data.slots,
      status,
      hoursCredit: data.hoursCredit ?? 4,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    })
    .run()
  return getEvent(corporateTenantId, id)
}

export async function updateEvent(corporateTenantId, eventId, data) {
  const row = await db
    .select()
    .from(volunteerEvents)
    .where(and(eq(volunteerEvents.id, eventId), eq(volunteerEvents.corporateTenantId, corporateTenantId)))
    .get()
  if (!row) throw httpError('Event not found', 404)

  const patch = { updatedAt: new Date() }
  if (data.title !== undefined) patch.title = data.title
  if (data.description !== undefined) patch.description = data.description
  if (data.location !== undefined) patch.location = data.location
  if (data.startsAt !== undefined) patch.startsAt = new Date(data.startsAt)
  if (data.endsAt !== undefined) patch.endsAt = new Date(data.endsAt)
  if (data.slots !== undefined) patch.slots = data.slots
  if (data.hoursCredit !== undefined) patch.hoursCredit = data.hoursCredit
  if (data.status !== undefined) patch.status = data.status

  await db.update(volunteerEvents).set(patch).where(eq(volunteerEvents.id, eventId)).run()
  return getEvent(corporateTenantId, eventId)
}

export async function listSignups(corporateTenantId, { eventId } = {}) {
  const events = eventId ? [getEvent(corporateTenantId, eventId)] : listEvents(corporateTenantId)
  const eventMap = Object.fromEntries(events.map((e) => [e.id, e]))
  const ids = Object.keys(eventMap)
  if (!ids.length) return []

  const rows = await db.select().from(volunteerSignups).where(inArray(volunteerSignups.eventId, ids)).all()

  return rows.map(async (s) => {
    const user = await db.select().from(users).where(eq(users.id, s.userId)).get()
    const mem = await db
      .select()
      .from(memberships)
      .where(and(eq(memberships.userId, s.userId), eq(memberships.tenantId, corporateTenantId)))
      .get()
    const event = eventMap[s.eventId]
    const attendance = await db.select().from(volunteerAttendance).where(eq(volunteerAttendance.signupId, s.id)).get()
    const cert = await db.select().from(volunteerCertificates).where(eq(volunteerCertificates.signupId, s.id)).get()
    return {
      id: s.id,
      eventId: s.eventId,
      userId: s.userId,
      name: user?.fullName || user?.email || 'Unknown',
      department: mem?.role || 'ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â',
      campaign: event?.title,
      hours: cert?.hoursCredited ?? (s.status === 'attended' ? event?.hoursCredit : 0),
      status: s.status,
      registeredAt: s.registeredAt?.toISOString?.() ?? s.registeredAt,
      checkedIn: !!attendance,
      certificateId: cert?.id ?? null,
    }
  })
}

export function listCalendarEvents(corporateTenantId) {
  return listEvents(corporateTenantId).map((e) => ({
    id: e.id,
    title: e.title,
    date: e.startsAt?.slice?.(0, 10) ?? e.startsAt,
    type: e.status === 'completed' ? 'completed' : 'volunteer',
  }))
}

export { shapeEvent, httpError } from './helpers.js'
export { registerForEvent, cancelRegistration } from './signups.js'
export { mintQrToken, getQrPayload, checkInWithToken, recordManualAttendance } from './attendance.js'
export { issueCertificate, getCertificate, getCertificateFile } from './certificates.js'
