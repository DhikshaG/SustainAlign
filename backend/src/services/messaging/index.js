import { eq, and, desc } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { csrProjects, messageThreads, messages, tenants, users, memberships } from '../../db/schema.js'
import { newId } from '../../lib/ids.js'
import { logMutation } from '../activity-log/index.js'
import { createNotification, notifyRole } from '../notifications/index.js'
import { canUseCrm } from '../partnership/index.js'

function httpError(message, status) {
  const err = new Error(message)
  err.status = status
  return err
}

function resolveNgoTenant({ ngoTenantId, ngoSlug }) {
  if (ngoTenantId) {
    const t = db.select().from(tenants).where(and(eq(tenants.id, ngoTenantId), eq(tenants.type, 'ngo'))).get()
    if (t) return t
  }
  if (ngoSlug) {
    const t = db.select().from(tenants).where(and(eq(tenants.slug, ngoSlug), eq(tenants.type, 'ngo'))).get()
    if (t) return t
  }
  throw httpError('NGO not found', 404)
}

function assertThreadAccess(thread, user) {
  const isCorporate = user.tenantId === thread.corporateTenantId
  const isNgo = user.tenantId === thread.ngoTenantId
  if (!isCorporate && !isNgo) throw httpError('Thread not found', 404)
  return { isCorporate, isNgo }
}

function shapeThread(row, preview) {
  const ngo = db.select().from(tenants).where(eq(tenants.id, row.ngoTenantId)).get()
  const corporate = db.select().from(tenants).where(eq(tenants.id, row.corporateTenantId)).get()
  return {
    id: row.id,
    subject: row.subject,
    projectId: row.projectId,
    ngoTenantId: row.ngoTenantId,
    ngoName: ngo?.name,
    ngoSlug: ngo?.slug,
    corporateName: corporate?.name,
    lastMessageAt: row.lastMessageAt,
    updated: row.lastMessageAt?.toISOString?.()?.slice(0, 10) || '',
    preview: preview?.body?.slice(0, 120) || '',
    unread: 0,
  }
}

function getLastMessage(threadId) {
  return db.select().from(messages)
    .where(eq(messages.threadId, threadId))
    .orderBy(desc(messages.createdAt))
    .limit(1)
    .get()
}

export function createThread({ corporateTenantId, ngoTenantId, ngoSlug, projectId, subject, createdBy, message }, req) {
  const ngo = resolveNgoTenant({ ngoTenantId, ngoSlug })

  if (projectId) {
    const project = db.select().from(csrProjects).where(eq(csrProjects.id, projectId)).get()
    if (!project || project.corporateTenantId !== corporateTenantId || project.ngoTenantId !== ngo.id) {
      throw httpError('Project not found', 404)
    }
    if (!canUseCrm(project)) throw httpError('Partnership must be accepted before messaging', 400)
  }

  const now = new Date()
  const id = newId()
  db.insert(messageThreads).values({
    id,
    corporateTenantId,
    ngoTenantId: ngo.id,
    projectId: projectId || null,
    subject,
    lastMessageAt: now,
    createdBy,
    createdAt: now,
  }).run()

  if (message) {
    db.insert(messages).values({
      id: newId(),
      threadId: id,
      senderUserId: createdBy,
      body: message,
      createdAt: now,
    }).run()
  }

  if (req) {
    logMutation({ req, action: 'crm.thread.create', entityType: 'message_thread', entityId: id, after: { subject } }).catch(() => {})
  }

  notifyRole(ngo.id, 'ngo_admin', {
    type: 'message.new',
    title: 'New message thread',
    body: subject,
    link: '/ngo/communications',
  }).catch(() => {})

  return getThread(id, { sub: createdBy, tenantId: corporateTenantId, tenantType: 'corporate' })
}

export function listThreadsForCorporate(tenantId) {
  const rows = db.select().from(messageThreads)
    .where(eq(messageThreads.corporateTenantId, tenantId))
    .orderBy(desc(messageThreads.lastMessageAt))
    .all()
  return rows.map((r) => shapeThread(r, getLastMessage(r.id)))
}

export function listThreadsForNgo(tenantId) {
  const rows = db.select().from(messageThreads)
    .where(eq(messageThreads.ngoTenantId, tenantId))
    .orderBy(desc(messageThreads.lastMessageAt))
    .all()
  return rows.map((r) => shapeThread(r, getLastMessage(r.id)))
}

export function getThread(threadId, user) {
  const row = db.select().from(messageThreads).where(eq(messageThreads.id, threadId)).get()
  if (!row) throw httpError('Thread not found', 404)
  assertThreadAccess(row, user)

  const msgs = db.select({
    id: messages.id,
    body: messages.body,
    createdAt: messages.createdAt,
    senderUserId: messages.senderUserId,
    senderName: users.fullName,
  })
    .from(messages)
    .innerJoin(users, eq(users.id, messages.senderUserId))
    .where(eq(messages.threadId, threadId))
    .orderBy(messages.createdAt)
    .all()

  return {
    ...shapeThread(row, getLastMessage(threadId)),
    messages: msgs.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt,
      senderUserId: m.senderUserId,
      senderName: m.senderName || 'User',
    })),
  }
}

export function postMessage(threadId, userId, body, user, req) {
  const row = db.select().from(messageThreads).where(eq(messageThreads.id, threadId)).get()
  if (!row) throw httpError('Thread not found', 404)
  const { isCorporate, isNgo } = assertThreadAccess(row, user)

  if (row.projectId) {
    const project = db.select().from(csrProjects).where(eq(csrProjects.id, row.projectId)).get()
    if (project && !canUseCrm(project)) throw httpError('Partnership must be accepted before messaging', 400)
  }

  const now = new Date()
  const id = newId()
  db.insert(messages).values({
    id,
    threadId,
    senderUserId: userId,
    body,
    createdAt: now,
  }).run()

  db.update(messageThreads).set({ lastMessageAt: now }).where(eq(messageThreads.id, threadId)).run()

  if (req) {
    logMutation({ req, action: 'crm.message.post', entityType: 'message_thread', entityId: threadId, after: { messageId: id } }).catch(() => {})
  }

  const targetTenantId = isCorporate ? row.ngoTenantId : row.corporateTenantId
  const targetRole = isCorporate ? 'ngo_admin' : 'csr_head'
  notifyRole(targetTenantId, targetRole, {
    type: 'message.new',
    title: 'New message',
    body: body.slice(0, 100),
    link: isCorporate ? '/ngo/communications' : '/dashboard/communications',
  }).catch(() => {})

  return {
    id,
    body,
    createdAt: now,
    senderUserId: userId,
  }
}

export function getOrCreateProjectThread(projectId, user, req) {
  const project = db.select().from(csrProjects).where(eq(csrProjects.id, projectId)).get()
  if (!project) throw httpError('Project not found', 404)
  if (user.tenantId !== project.corporateTenantId && user.tenantId !== project.ngoTenantId) {
    throw httpError('Project not found', 404)
  }
  if (!canUseCrm(project)) throw httpError('Partnership must be accepted before messaging', 400)

  const existing = db.select().from(messageThreads)
    .where(and(eq(messageThreads.projectId, projectId)))
    .get()
  if (existing) return getThread(existing.id, user)

  const corporateTenantId = project.corporateTenantId
  return createThread({
    corporateTenantId,
    ngoTenantId: project.ngoTenantId,
    projectId,
    subject: `Project: ${project.name}`,
    createdBy: user.sub,
    message: `Thread started for project "${project.name}".`,
  }, req)
}
