import { eq, and } from 'drizzle-orm'
import { db } from '../../db/index.js'
import {
  volunteerEvents,
  volunteerSignups,
  volunteerCertificates,
  volunteerAttendance,
  users,
  tenants,
  files,
} from '../../db/schema.js'
import { newId } from '../../lib/ids.js'
import { storeFile } from '../files/index.js'
import { getStorage } from '../../lib/storage/index.js'
import { generateVolunteerCertificatePdf } from './certificates/pdf.js'

function httpError(message, status) {
  const err = new Error(message)
  err.status = status
  return err
}

export async function issueCertificate(corporateTenantId, signupId, userId, req) {
  const signup = db.select().from(volunteerSignups)
    .innerJoin(volunteerEvents, eq(volunteerSignups.eventId, volunteerEvents.id))
    .where(and(
      eq(volunteerSignups.id, signupId),
      eq(volunteerEvents.corporateTenantId, corporateTenantId),
    )).get()
  if (!signup) throw httpError('Signup not found', 404)

  const { volunteer_signups: s, volunteer_events: event } = signup
  if (s.userId !== userId) {
    const canManage = req?.user?.permissions?.includes?.('volunteers:manage')
    if (!canManage) throw httpError('Not authorized to issue certificate for this signup', 403)
  }

  if (s.status !== 'attended') {
    throw httpError('Certificate requires recorded attendance', 400)
  }

  const existing = db.select().from(volunteerCertificates)
    .where(eq(volunteerCertificates.signupId, signupId)).get()
  if (existing) return getCertificate(corporateTenantId, existing.id)

  const attendance = db.select().from(volunteerAttendance)
    .where(eq(volunteerAttendance.signupId, signupId)).get()
  if (!attendance) throw httpError('No attendance record found', 400)

  const employee = db.select().from(users).where(eq(users.id, s.userId)).get()
  const company = db.select().from(tenants).where(eq(tenants.id, corporateTenantId)).get()

  const eventDate = event.startsAt instanceof Date
    ? event.startsAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : String(event.startsAt).slice(0, 10)

  const pdfBuffer = await generateVolunteerCertificatePdf({
    employeeName: employee?.fullName || employee?.email || 'Volunteer',
    companyName: company?.name || 'Corporate Partner',
    eventTitle: event.title,
    eventDate,
    location: event.location,
    hoursCredited: event.hoursCredit,
  })

  const fileName = `volunteer-cert-${signupId.slice(0, 8)}.pdf`
  const stored = await storeFile({
    req,
    buffer: pdfBuffer,
    tenantId: corporateTenantId,
    tenantType: 'corporate',
    uploadedBy: userId,
    category: 'volunteer_certificate',
    originalName: fileName,
    mime: 'application/pdf',
    entityType: 'volunteer_signup',
    entityId: signupId,
  })

  const certId = newId()
  const now = new Date()
  db.insert(volunteerCertificates).values({
    id: certId,
    signupId,
    fileId: stored.id,
    issuedAt: now,
    hoursCredited: event.hoursCredit,
  }).run()

  if (event.status !== 'completed') {
    db.update(volunteerEvents).set({ status: 'completed', updatedAt: now })
      .where(eq(volunteerEvents.id, event.id)).run()
  }

  return getCertificate(corporateTenantId, certId)
}

export function getCertificate(corporateTenantId, certificateId) {
  const row = db.select().from(volunteerCertificates)
    .innerJoin(volunteerSignups, eq(volunteerCertificates.signupId, volunteerSignups.id))
    .innerJoin(volunteerEvents, eq(volunteerSignups.eventId, volunteerEvents.id))
    .where(and(
      eq(volunteerCertificates.id, certificateId),
      eq(volunteerEvents.corporateTenantId, corporateTenantId),
    )).get()
  if (!row) throw httpError('Certificate not found', 404)

  const file = db.select().from(files).where(eq(files.id, row.volunteer_certificates.fileId)).get()
  return {
    id: row.volunteer_certificates.id,
    signupId: row.volunteer_certificates.signupId,
    fileId: row.volunteer_certificates.fileId,
    hoursCredited: row.volunteer_certificates.hoursCredited,
    issuedAt: row.volunteer_certificates.issuedAt?.toISOString?.() ?? row.volunteer_certificates.issuedAt,
    downloadUrl: file ? `/api/files/${file.id}/download` : null,
    eventTitle: row.volunteer_events.title,
  }
}

export async function getCertificateFile(corporateTenantId, certificateId) {
  const cert = getCertificate(corporateTenantId, certificateId)
  const file = db.select().from(files).where(eq(files.id, cert.fileId)).get()
  if (!file) throw httpError('Certificate file not found', 404)
  const storage = getStorage()
  const buffer = await storage.download(file.storageKey)
  return { buffer, file }
}
