#!/usr/bin/env node
import { eq } from 'drizzle-orm'
import { db } from '../src/db/index.js'
import { users, memberships, workflowInstances, workflowEvents, csrProjects, messageThreads, messages, projectTasks } from '../src/db/schema.js'
import {
  createProject,
  getProject,
  submitMilestoneForReview,
} from '../src/services/projects/index.js'
import { seedWorkflowDefinitions, transition, getDefinition } from '../src/services/workflow/index.js'
import { listPartnershipRequests, respondToPartnership } from '../src/services/partnership/index.js'
import { createThread, postMessage, listThreadsForCorporate } from '../src/services/messaging/index.js'
import { createTask, listTasksForProject, updateTaskStatus } from '../src/services/tasks/index.js'
import { getProjectTimeline } from '../src/services/crm/timeline.js'

const errors = []

function check(label, ok, detail) {
  if (ok) console.log(`  ✓ ${label}`)
  else {
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
    errors.push(label)
  }
}

console.log('\n=== NGO CRM + Workflow verification ===\n')

seedWorkflowDefinitions()

const acmeUser = db.select().from(users).where(eq(users.email, 'admin@acme.com')).get()
const acmeMem = acmeUser
  ? db.select().from(memberships).where(eq(memberships.userId, acmeUser.id)).get()
  : null
const geUser = db.select().from(users).where(eq(users.email, 'admin@greenearth.org')).get()
const geMem = geUser
  ? db.select().from(memberships).where(eq(memberships.userId, geUser.id)).get()
  : null

check('Corporate tenant', !!acmeMem?.tenantId)
check('NGO tenant', !!geMem?.tenantId)
check('milestone_approval definition', !!getDefinition('milestone_approval'))

const tempId = `crm-verify-${Date.now()}`
try {
  createProject({
    id: tempId,
    corporateTenantId: acmeMem.tenantId,
    ngoSlug: 'green-earth-foundation',
    userId: acmeUser.id,
    name: 'CRM Verify Project',
    scheduleVii: 'Promoting education',
    location: 'Test',
    budgetInr: 500000,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    milestones: [{ title: 'Phase 1', dueDate: '2026-06-01', status: 'completed' }],
  }, null)

  const wf = db.select().from(workflowInstances).where(eq(workflowInstances.entityId, tempId)).get()
  check('Project workflow created', !!wf)

  const mockReq = (user) => ({ user, headers: { 'user-agent': 'crm-verify' } })
  const mockCsrHead = { sub: acmeUser.id, role: 'csr_head', tenantId: acmeMem.tenantId }
  await transition({ req: mockReq(mockCsrHead), instanceId: wf.id, action: 'approve', comment: 'ok' })
  let wf2 = db.select().from(workflowInstances).where(eq(workflowInstances.entityId, tempId)).get()
  if (wf2.status === 'pending') {
    const financeUser = db.select().from(users).where(eq(users.email, 'finance@acme.com')).get()
    const finMem = financeUser ? db.select().from(memberships).where(eq(memberships.userId, financeUser.id)).get() : null
    const financeRole = finMem ? { sub: financeUser.id, role: 'finance', tenantId: acmeMem.tenantId } : { ...mockCsrHead, role: 'finance' }
    await transition({ req: mockReq(financeRole), instanceId: wf.id, action: 'approve' })
    wf2 = db.select().from(workflowInstances).where(eq(workflowInstances.entityId, tempId)).get()
  }
  check('Corporate workflow approved', wf2?.status === 'approved')

  const afterApprove = getProject(tempId, { corporateTenantId: acmeMem.tenantId })
  check('Partnership pending NGO', afterApprove?.ngoPartnershipStatus === 'pending')
  check('Project status pending_ngo', afterApprove?.status === 'pending_ngo')

  const requests = listPartnershipRequests(geMem.tenantId)
  check('NGO partnership inbox', requests.some((r) => r.id === tempId))

  respondToPartnership(tempId, geMem.tenantId, { action: 'accept', note: 'Happy to partner' }, null)
  const accepted = getProject(tempId, { ngoTenantId: geMem.tenantId, audience: 'ngo' })
  check('Partnership accepted', accepted?.ngoPartnershipStatus === 'accepted' && accepted?.status === 'active')

  const thread = createThread({
    corporateTenantId: acmeMem.tenantId,
    ngoTenantId: geMem.tenantId,
    projectId: tempId,
    subject: 'CRM test thread',
    createdBy: acmeUser.id,
    message: 'Hello NGO',
  }, null)
  check('Message thread created', !!thread?.id)

  postMessage(thread.id, geUser.id, 'Reply from NGO', { sub: geUser.id, tenantId: geMem.tenantId, tenantType: 'ngo' }, null)
  const threads = listThreadsForCorporate(acmeMem.tenantId)
  check('Thread list', threads.length >= 1)

  const task = createTask(tempId, { title: 'Upload photos', assigneeSide: 'ngo' }, acmeUser.id, null)
  check('Task created', !!task?.id)

  updateTaskStatus(task.id, { status: 'done' }, { sub: geUser.id, tenantId: geMem.tenantId }, null)
  const tasks = listTasksForProject(tempId)
  check('Task updated', tasks.some((t) => t.status === 'done'))

  const mid = accepted.milestones[0]?.id
  if (mid) {
    submitMilestoneForReview(tempId, mid, { userId: geUser.id, ngoTenantId: geMem.tenantId }, null)
    const mwf = db.select().from(workflowInstances)
      .where(eq(workflowInstances.entityType, 'milestone'))
      .all()
      .find((w) => w.entityId === mid)
    check('Milestone workflow', mwf?.status === 'pending')
  }

  const timeline = getProjectTimeline(tempId)
  check('Project timeline', timeline.length >= 3)

  const wfs = db.select().from(workflowInstances).where(eq(workflowInstances.entityId, tempId)).all()
  for (const w of wfs) {
    db.delete(workflowEvents).where(eq(workflowEvents.instanceId, w.id)).run()
    db.delete(workflowInstances).where(eq(workflowInstances.id, w.id)).run()
  }
  const mileWfs = db.select().from(workflowInstances).where(eq(workflowInstances.entityType, 'milestone')).all()
  for (const w of mileWfs) {
    if (w.entityId && accepted?.milestones?.some((m) => m.id === w.entityId)) {
      db.delete(workflowEvents).where(eq(workflowEvents.instanceId, w.id)).run()
      db.delete(workflowInstances).where(eq(workflowInstances.id, w.id)).run()
    }
  }
  const threadRow = db.select().from(messageThreads).where(eq(messageThreads.projectId, tempId)).get()
  if (threadRow) {
    db.delete(messages).where(eq(messages.threadId, threadRow.id)).run()
    db.delete(messageThreads).where(eq(messageThreads.id, threadRow.id)).run()
  }
  db.delete(projectTasks).where(eq(projectTasks.projectId, tempId)).run()
  db.delete(csrProjects).where(eq(csrProjects.id, tempId)).run()
} catch (err) {
  check('CRM round-trip', false, err.message)
}

console.log('')
if (errors.length) {
  console.log(`FAILED: ${errors.length} check(s)\n`)
  process.exit(1)
}
console.log('All CRM checks passed.\n')
