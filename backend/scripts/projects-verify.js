#!/usr/bin/env node
/**
 * Verify Step 3 Project Management V1 — run after migrate + seed.
 */
import { eq } from 'drizzle-orm'
import { db } from '../src/db/index.js'
import { users, memberships, workflowInstances, workflowEvents, searchDocuments, csrProjects } from '../src/db/schema.js'
import {
  listProjects,
  getProject,
  createProject,
  updateMilestone,
  addProjectUpdate,
  computeProjectProgress,
} from '../src/services/projects/index.js'
import { getDefinition } from '../src/services/workflow/index.js'

const errors = []

function check(label, ok, detail) {
  if (ok) console.log(`  ✓ ${label}`)
  else {
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
    errors.push(label)
  }
}

console.log('\n=== Project Management V1 verification ===\n')

const acmeUser = db.select().from(users).where(eq(users.email, 'admin@acme.com')).get()
const acmeMem = acmeUser
  ? db.select().from(memberships).where(eq(memberships.userId, acmeUser.id)).get()
  : null

check('Seeded corporate user (admin@acme.com)', !!acmeUser && !!acmeMem)

const def = getDefinition('csr_project_approval')
check('Workflow definition csr_project_approval', !!def && def.steps?.length === 2)

const corpList = listProjects({ corporateTenantId: acmeMem?.tenantId, audience: 'corporate' })
check('Corporate project list', corpList.projects.length >= 3, `found ${corpList.projects.length}`)

const greenEarth = db.select().from(users).where(eq(users.email, 'admin@greenearth.org')).get()
const geMem = greenEarth
  ? db.select().from(memberships).where(eq(memberships.userId, greenEarth.id)).get()
  : null
const ngoList = listProjects({ ngoTenantId: geMem?.tenantId, audience: 'ngo' })
check('NGO scoped list (Green Earth)', ngoList.projects.some((p) => p.id === 'proj-001'))

const proj001 = getProject('proj-001', { corporateTenantId: acmeMem?.tenantId, audience: 'corporate' })
check('Project detail proj-001', !!proj001 && proj001.milestones?.length >= 4)
check('Project detail includes updates', proj001?.updates?.length >= 1)
check('Active project status', proj001?.status === 'active')

const progress = computeProjectProgress(proj001?.milestones ?? [])
check('Progress computed from milestones', progress >= 40 && progress <= 80, `progress=${progress}`)

try {
  const tempId = `verify-proj-${Date.now()}`
  createProject({
    id: tempId,
    corporateTenantId: acmeMem.tenantId,
    ngoSlug: 'green-earth-foundation',
    userId: acmeUser.id,
    name: 'Verify Test Project',
    scheduleVii: 'Promoting education',
    location: 'Test',
    budgetInr: 100000,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    milestones: [{ title: 'M1', dueDate: '2026-06-01', status: 'pending' }],
  }, null)

  const created = getProject(tempId, { corporateTenantId: acmeMem.tenantId })
  check('Create project pending_approval', created?.status === 'pending_approval')

  const wf = db.select().from(workflowInstances)
    .where(eq(workflowInstances.entityId, tempId))
    .get()
  check('Workflow instance on create', wf?.entityType === 'project' && wf?.status === 'pending')

  const mid = created.milestones[0]?.id
  if (mid) {
    updateMilestone(tempId, mid, { status: 'completed' }, { corporateTenantId: acmeMem.tenantId })
    const after = getProject(tempId, { corporateTenantId: acmeMem.tenantId })
    check('Milestone update recomputes progress', after?.progress === 100)
  }

  addProjectUpdate(tempId, { userId: acmeUser.id, body: 'Verify update message' }, { corporateTenantId: acmeMem.tenantId })
  const withUpdate = getProject(tempId, { corporateTenantId: acmeMem.tenantId })
  check('Post update persists', withUpdate?.updates?.some((u) => u.body.includes('Verify update')))

  if (wf) {
    db.delete(workflowEvents).where(eq(workflowEvents.instanceId, wf.id)).run()
    db.delete(workflowInstances).where(eq(workflowInstances.id, wf.id)).run()
  }
  db.delete(csrProjects).where(eq(csrProjects.id, tempId)).run()
} catch (err) {
  check('Create/update round-trip', false, err.message)
}

try {
  createProject({
    corporateTenantId: acmeMem.tenantId,
    ngoSlug: 'nonexistent-ngo-slug',
    userId: acmeUser.id,
    name: 'Bad NGO',
    scheduleVii: 'Promoting education',
    location: 'X',
    budgetInr: 1000,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
  }, null)
  check('Invalid NGO rejected', false, 'should have thrown')
} catch {
  check('Invalid NGO rejected', true)
}

const searchRow = db.select().from(searchDocuments).where(eq(searchDocuments.id, 'project:proj-001')).get()
check('Search index includes project', !!searchRow)

console.log('')
if (errors.length) {
  console.log(`FAILED: ${errors.length} check(s)\n`)
  process.exit(1)
}
console.log('All project V1 checks passed.\n')
