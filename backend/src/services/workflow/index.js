import { eq, and, desc } from 'drizzle-orm'
import { db } from '../../db/index.js'
import {
  workflowDefinitions,
  workflowInstances,
  workflowEvents,
  memberships,
} from '../../db/schema.js'
import { newId } from '../../lib/ids.js'
import { logMutation } from '../activity-log/index.js'
import { createNotification, notifyRole } from '../notifications/index.js'
import { indexDocument } from '../search/index.js'

const TERMINAL = new Set(['approved', 'rejected'])

export function seedWorkflowDefinitions() {
  const existing = db.select().from(workflowDefinitions)
    .where(eq(workflowDefinitions.slug, 'ngo_report_approval'))
    .get()
  if (existing) return existing

  const id = newId()
  const steps = [
    { role: 'csr_head', permission: 'workflow:review', label: 'CSR Head review' },
    { role: 'finance', permission: 'workflow:review', label: 'Finance approval' },
    { role: 'compliance', permission: 'workflow:review', label: 'Compliance verification' },
  ]
  db.insert(workflowDefinitions).values({
    id,
    slug: 'ngo_report_approval',
    name: 'NGO Report Approval',
    steps: JSON.stringify(steps),
  }).run()
  return { id, slug: 'ngo_report_approval', steps }
}

export function getDefinition(slug) {
  const row = db.select().from(workflowDefinitions).where(eq(workflowDefinitions.slug, slug)).get()
  if (!row) return null
  return { ...row, steps: JSON.parse(row.steps) }
}

export function createInstance({ req, definitionSlug, tenantId, entityType, entityId, submittedBy, title }) {
  const def = getDefinition(definitionSlug)
  if (!def) throw Object.assign(new Error('Workflow definition not found'), { status: 404 })

  const now = new Date()
  const id = newId()
  db.insert(workflowInstances).values({
    id,
    definitionId: def.id,
    tenantId,
    entityType,
    entityId,
    status: 'pending',
    currentStepIndex: 0,
    submittedBy,
    createdAt: now,
    updatedAt: now,
  }).run()

  db.insert(workflowEvents).values({
    id: newId(),
    instanceId: id,
    fromStatus: null,
    toStatus: 'pending',
    stepIndex: 0,
    actorUserId: submittedBy,
    comment: 'Submitted',
    createdAt: now,
  }).run()

  logMutation({
    req,
    action: 'workflow.submit',
    entityType: 'workflow',
    entityId: id,
    before: null,
    after: { status: 'pending', entityType, entityId },
  }).catch(() => {})

  indexDocument({
    tenantId,
    entityType: 'report',
    entityId,
    title: title || `Report ${entityId}`,
    body: `Workflow ${def.name}`,
    keywords: ['report', 'workflow', 'pending'],
  })

  const firstStep = def.steps[0]
  notifyRole(tenantId, firstStep.role, {
    type: 'report.pending',
    title: 'Report pending your review',
    body: `A new ${entityType} requires ${firstStep.label}.`,
    link: '/dashboard/approvals',
  }).catch(() => {})

  return getInstance(id)
}

export function getInstance(id) {
  const row = db.select().from(workflowInstances).where(eq(workflowInstances.id, id)).get()
  if (!row) return null
  const def = db.select().from(workflowDefinitions).where(eq(workflowDefinitions.id, row.definitionId)).get()
  const events = db.select().from(workflowEvents)
    .where(eq(workflowEvents.instanceId, id))
    .orderBy(desc(workflowEvents.createdAt))
    .all()
  return {
    ...row,
    definition: def ? { ...def, steps: JSON.parse(def.steps) } : null,
    events,
  }
}

export function listPendingForUser(userId, role, tenantId) {
  const instances = db.select().from(workflowInstances)
    .where(and(
      eq(workflowInstances.tenantId, tenantId),
      eq(workflowInstances.status, 'pending'),
    ))
    .all()

  return instances.filter((inst) => {
    const def = db.select().from(workflowDefinitions).where(eq(workflowDefinitions.id, inst.definitionId)).get()
    if (!def) return false
    const steps = JSON.parse(def.steps)
    const step = steps[inst.currentStepIndex]
    return step?.role === role
  }).map((i) => getInstance(i.id))
}

export function listInboxForUser(userId, role, tenantId) {
  if (role === 'ngo_admin' || role === 'field_officer') {
    return db.select().from(workflowInstances)
      .where(eq(workflowInstances.submittedBy, userId))
      .orderBy(desc(workflowInstances.updatedAt))
      .all()
      .map((i) => getInstance(i.id))
  }
  return listPendingForUser(userId, role, tenantId)
}

export async function transition({ req, instanceId, action, comment }) {
  const inst = db.select().from(workflowInstances).where(eq(workflowInstances.id, instanceId)).get()
  if (!inst) throw Object.assign(new Error('Workflow not found'), { status: 404 })
  if (TERMINAL.has(inst.status)) {
    throw Object.assign(new Error('Workflow already completed'), { status: 400 })
  }

  const def = db.select().from(workflowDefinitions).where(eq(workflowDefinitions.id, inst.definitionId)).get()
  const steps = JSON.parse(def.steps)
  const currentStep = steps[inst.currentStepIndex]
  const actorRole = req.user.role

  if (currentStep.role !== actorRole && req.user.role !== 'super_admin') {
    throw Object.assign(new Error('Not authorized for this workflow step'), { status: 403 })
  }

  const now = new Date()
  const previousStatus = inst.status
  let newStatus = inst.status
  let newStepIndex = inst.currentStepIndex

  if (action === 'reject') {
    newStatus = 'rejected'
  } else if (action === 'request_revision') {
    newStatus = 'needs_revision'
  } else if (action === 'approve') {
    if (inst.currentStepIndex >= steps.length - 1) {
      newStatus = 'approved'
    } else {
      newStepIndex = inst.currentStepIndex + 1
      newStatus = 'pending'
    }
  } else {
    throw Object.assign(new Error('Invalid action'), { status: 400 })
  }

  db.update(workflowInstances).set({
    status: newStatus,
    currentStepIndex: newStepIndex,
    updatedAt: now,
  }).where(eq(workflowInstances.id, instanceId)).run()

  db.insert(workflowEvents).values({
    id: newId(),
    instanceId,
    fromStatus: previousStatus,
    toStatus: newStatus,
    stepIndex: inst.currentStepIndex,
    actorUserId: req.user.sub,
    comment: comment || null,
    createdAt: now,
  }).run()

  await logMutation({
    req,
    action: `workflow.${action}`,
    entityType: 'workflow',
    entityId: instanceId,
    before: { status: previousStatus, step: inst.currentStepIndex },
    after: { status: newStatus, step: newStepIndex },
    reason: comment,
  })

  if (newStatus === 'pending' && action === 'approve') {
    const nextStep = steps[newStepIndex]
    await notifyRole(inst.tenantId, nextStep.role, {
      type: 'report.pending',
      title: 'Report pending your review',
      body: `${nextStep.label} required.`,
      link: '/dashboard/approvals',
    })
  }

  if (TERMINAL.has(newStatus) || newStatus === 'needs_revision') {
    await createNotification({
      userId: inst.submittedBy,
      tenantId: inst.tenantId,
      type: newStatus === 'approved' ? 'ngo.approved' : 'report.pending',
      title: `Report ${newStatus.replace('_', ' ')}`,
      body: comment || `Your submission was ${newStatus.replace('_', ' ')}.`,
      link: '/ngo/finance',
    })
  }

  return getInstance(instanceId)
}
