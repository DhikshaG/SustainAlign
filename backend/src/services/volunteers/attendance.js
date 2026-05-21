import { randomUUID } from 'node:crypto'
import QRCode from 'qrcode'
import { eq, and, isNull } from 'drizzle-orm'
import { db } from '../../db/index.js'
import {
  volunteerEvents,
  volunteerSignups,
  volunteerAttendance,
  volunteerQrTokens,
} from '../../db/schema.js'
import { env } from '../../config/env.js'
import { newId } from '../../lib/ids.js'
import { shapeEvent } from './helpers.js'

function httpError(message, status) {
  const err = new Error(message)
  err.status = status
  return err
}

export function mintQrToken(corporateTenantId, eventId) {
  const event = db.select().from(volunteerEvents)
    .where(and(
      eq(volunteerEvents.id, eventId),
      eq(volunteerEvents.corporateTenantId, corporateTenantId),
    )).get()
  if (!event) throw httpError('Event not found', 404)

  const token = randomUUID()
  const expiresAt = new Date(event.endsAt)
  expiresAt.setHours(expiresAt.getHours() + 2)

  const id = newId()
  db.insert(volunteerQrTokens).values({
    id,
    eventId,
    token,
    expiresAt,
    revokedAt: null,
  }).run()

  return { tokenId: id, token, expiresAt: expiresAt.toISOString() }
}

export async function getQrPayload(corporateTenantId, eventId) {
  const event = db.select().from(volunteerEvents)
    .where(and(
      eq(volunteerEvents.id, eventId),
      eq(volunteerEvents.corporateTenantId, corporateTenantId),
    )).get()
  if (!event) throw httpError('Event not found', 404)

  let qrRow = db.select().from(volunteerQrTokens)
    .where(and(
      eq(volunteerQrTokens.eventId, eventId),
      isNull(volunteerQrTokens.revokedAt),
    ))
    .orderBy(volunteerQrTokens.expiresAt)
    .get()

  if (!qrRow || new Date(qrRow.expiresAt) < new Date()) {
    const minted = mintQrToken(corporateTenantId, eventId)
    qrRow = db.select().from(volunteerQrTokens)
      .where(eq(volunteerQrTokens.token, minted.token)).get()
  }

  const checkInUrl = `${env.APP_URL}/dashboard/volunteers/check-in/${qrRow.token}`
  const dataUrl = await QRCode.toDataURL(checkInUrl, { width: 280, margin: 2 })

  return {
    eventId,
    token: qrRow.token,
    checkInUrl,
    qrDataUrl: dataUrl,
    expiresAt: qrRow.expiresAt?.toISOString?.() ?? qrRow.expiresAt,
  }
}

export function checkInWithToken(corporateTenantId, userId, token) {
  const qrRow = db.select().from(volunteerQrTokens)
    .where(and(eq(volunteerQrTokens.token, token), isNull(volunteerQrTokens.revokedAt))).get()
  if (!qrRow) throw httpError('Invalid or expired check-in token', 404)
  if (new Date(qrRow.expiresAt) < new Date()) {
    throw httpError('Check-in token has expired', 400)
  }

  const event = db.select().from(volunteerEvents)
    .where(and(
      eq(volunteerEvents.id, qrRow.eventId),
      eq(volunteerEvents.corporateTenantId, corporateTenantId),
    )).get()
  if (!event) throw httpError('Event not found for this tenant', 404)
  if (!['open', 'full', 'completed'].includes(event.status)) {
    throw httpError('Event is not active for check-in', 400)
  }

  let signup = db.select().from(volunteerSignups)
    .where(and(eq(volunteerSignups.eventId, event.id), eq(volunteerSignups.userId, userId))).get()

  if (!signup) {
    const id = newId()
    db.insert(volunteerSignups).values({
      id,
      eventId: event.id,
      userId,
      status: 'registered',
      registeredAt: new Date(),
    }).run()
    signup = db.select().from(volunteerSignups).where(eq(volunteerSignups.id, id)).get()
  } else if (signup.status === 'cancelled') {
    db.update(volunteerSignups).set({ status: 'registered', registeredAt: new Date() })
      .where(eq(volunteerSignups.id, signup.id)).run()
  }

  const existing = db.select().from(volunteerAttendance)
    .where(eq(volunteerAttendance.signupId, signup.id)).get()
  if (existing) {
    return {
      alreadyCheckedIn: true,
      eventTitle: event.title,
      checkInAt: existing.checkInAt?.toISOString?.() ?? existing.checkInAt,
    }
  }

  const now = new Date()
  db.insert(volunteerAttendance).values({
    id: newId(),
    signupId: signup.id,
    checkInAt: now,
    checkOutAt: null,
    method: 'qr',
    recordedBy: userId,
  }).run()

  db.update(volunteerSignups).set({ status: 'attended' })
    .where(eq(volunteerSignups.id, signup.id)).run()

  shapeEvent(event)

  return {
    checkedIn: true,
    eventTitle: event.title,
    checkInAt: now.toISOString(),
  }
}

export function recordManualAttendance(corporateTenantId, eventId, signupIds, recordedBy) {
  const event = db.select().from(volunteerEvents)
    .where(and(
      eq(volunteerEvents.id, eventId),
      eq(volunteerEvents.corporateTenantId, corporateTenantId),
    )).get()
  if (!event) throw httpError('Event not found', 404)

  const now = new Date()
  let recorded = 0
  for (const signupId of signupIds) {
    const signup = db.select().from(volunteerSignups)
      .where(and(eq(volunteerSignups.id, signupId), eq(volunteerSignups.eventId, eventId))).get()
    if (!signup) continue

    const existing = db.select().from(volunteerAttendance)
      .where(eq(volunteerAttendance.signupId, signupId)).get()
    if (existing) continue

    db.insert(volunteerAttendance).values({
      id: newId(),
      signupId,
      checkInAt: now,
      checkOutAt: null,
      method: 'manual',
      recordedBy,
    }).run()
    db.update(volunteerSignups).set({ status: 'attended' })
      .where(eq(volunteerSignups.id, signupId)).run()
    recorded += 1
  }

  return { recorded }
}
