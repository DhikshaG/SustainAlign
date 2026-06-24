import { eq, and, isNull, desc } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { notifications, memberships, users } from '../../db/schema.js'
import { newId } from '../../lib/ids.js'
import { sendEmail } from '../../lib/email.js'
import { env } from '../../config/env.js'

const EMAIL_TEMPLATES = {
  'ngo.approved': (p) => ({
    subject: 'Your NGO has been verified',
    text: p.body,
    html: `<p>${p.body}</p>`,
  }),
  'report.pending': (p) => ({
    subject: 'Report pending submission',
    text: p.body,
    html: `<p>${p.body}</p>`,
  }),
  'compliance.deadline': (p) => ({
    subject: 'Compliance deadline reminder',
    text: p.body,
    html: `<p><strong>${p.title}</strong></p><p>${p.body}</p>`,
  }),
  'milestone.delayed': (p) => ({
    subject: 'Project milestone delayed',
    text: p.body,
    html: `<p>${p.body}</p>`,
  }),
  'verification.submitted': (p) => ({
    subject: 'NGO verification documents submitted',
    text: p.body,
    html: `<p>${p.body}</p>`,
  }),
}

export async function createNotification({ userId, tenantId, type, title, body, link = null, sendEmailFlag = true }) {
  const now = new Date()
  const id = newId()

  db.insert(notifications).values({
    id,
    userId,
    tenantId,
    type,
    title,
    body,
    link,
    readAt: null,
    createdAt: now,
  }).run()

  if (sendEmailFlag) {
    const user = db.select().from(users).where(eq(users.id, userId)).get()
    if (user?.email) {
      const tpl = EMAIL_TEMPLATES[type]
      const payload = tpl ? tpl({ title, body, link }) : { subject: title, text: body, html: `<p>${body}</p>` }
      const fullLink = link?.startsWith('http') ? link : link ? `${env.APP_URL}${link}` : null
      const html = fullLink ? `${payload.html}<p><a href="${fullLink}">View in SustainAlign</a></p>` : payload.html
      await sendEmail({ to: user.email, subject: payload.subject, text: payload.text, html }).catch(() => {})
    }
  }

  return { id, userId, tenantId, type, title, body, link, createdAt: now }
}

export async function notifyRole(tenantId, role, { type, title, body, link }) {
  const members = db.select().from(memberships)
    .where(and(eq(memberships.tenantId, tenantId), eq(memberships.role, role), eq(memberships.status, 'active')))
    .all()

  const results = []
  for (const m of members) {
    results.push(await createNotification({
      userId: m.userId,
      tenantId,
      type,
      title,
      body,
      link,
    }))
  }
  return results
}

export async function notifyPlatformAdmins({ type, title, body, link }) {
  const platformTenant = db.select().from(memberships)
    .where(eq(memberships.role, 'platform_super_admin'))
    .all()

  const results = []
  for (const m of platformTenant) {
    results.push(await createNotification({
      userId: m.userId,
      tenantId: m.tenantId,
      type,
      title,
      body,
      link,
    }))
  }
  return results
}

export function listNotifications(userId, { limit = 30, unreadOnly = false } = {}) {
  const conditions = [eq(notifications.userId, userId)]
  if (unreadOnly) {
    conditions.push(isNull(notifications.readAt))
  }

  return db.select().from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .all()
}

export function countUnread(userId) {
  const rows = db.select().from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
    .all()
  return rows.length
}

export function markRead(notificationId, userId) {
  const now = new Date()
  db.update(notifications)
    .set({ readAt: now })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
    .run()
  return { readAt: now }
}

export function markAllRead(userId) {
  const now = new Date()
  db.update(notifications)
    .set({ readAt: now })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
    .run()
  return { readAt: now }
}
