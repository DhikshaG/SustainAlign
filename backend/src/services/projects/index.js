import { eq, and, desc, asc } from 'drizzle-orm'
import { db } from '../../db/index.js'
import {
  csrProjects,
  projectMilestones,
  projectUpdates,
  tenants,
  ngoProfiles,
  files,
  users,
} from '../../db/schema.js'
import { newId } from '../../lib/ids.js'
import { logMutation } from '../activity-log/index.js'
import { indexDocument } from '../search/index.js'
import { createInstance } from '../workflow/index.js'

function httpError(message, status) {
  const err = new Error(message)
  err.status = status
  return err
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function computeProjectProgress(milestones) {
  if (!milestones?.length) return 0
  const total = milestones.reduce((sum, m) => {
    if (m.status === 'completed') return sum + 100
    return sum + (m.progress ?? 0)
  }, 0)
  return Math.round(total / milestones.length)
}

function effectiveMilestoneStatus(m) {
  if (m.status === 'completed') return 'completed'
  if (m.dueDate && m.dueDate < todayIso() && m.status !== 'completed') return 'delayed'
  return m.status
}

function resolveNgoTenant({ ngoTenantId, ngoSlug }) {
  let tenant
  if (ngoTenantId) {
    tenant = db.select().from(tenants)
      .where(and(eq(tenants.id, ngoTenantId), eq(tenants.type, 'ngo')))
      .get()
  } else if (ngoSlug) {
    tenant = db.select().from(tenants)
      .where(and(eq(tenants.slug, ngoSlug), eq(tenants.type, 'ngo')))
      .get()
  }
  if (!tenant) throw httpError('NGO not found', 404)

  const profile = db.select().from(ngoProfiles).where(eq(ngoProfiles.tenantId, tenant.id)).get()
  if (!profile || profile.verificationStatus !== 'verified') {
    throw httpError('NGO must be verified to assign to a project', 400)
  }
  return tenant
}

function loadMilestones(projectId) {
  return db.select().from(projectMilestones)
    .where(eq(projectMilestones.projectId, projectId))
    .orderBy(asc(projectMilestones.sortOrder))
    .all()
}

function loadUpdates(projectId) {
  return db.select({
    id: projectUpdates.id,
    body: projectUpdates.body,
    createdAt: projectUpdates.createdAt,
    authorUserId: projectUpdates.authorUserId,
    authorName: users.fullName,
  })
    .from(projectUpdates)
    .innerJoin(users, eq(users.id, projectUpdates.authorUserId))
    .where(eq(projectUpdates.projectId, projectId))
    .orderBy(desc(projectUpdates.createdAt))
    .all()
}

function loadProjectFiles(projectId) {
  return db.select({
    id: files.id,
    originalName: files.originalName,
    mime: files.mime,
    sizeBytes: files.sizeBytes,
    createdAt: files.createdAt,
    category: files.category,
  })
    .from(files)
    .where(and(eq(files.entityType, 'project'), eq(files.entityId, projectId)))
    .orderBy(desc(files.createdAt))
    .all()
}

function shapeMilestone(m) {
  const status = effectiveMilestoneStatus(m)
  return {
    id: m.id,
    title: m.title,
    due: m.dueDate,
    dueDate: m.dueDate,
    status,
    progress: m.status === 'completed' ? 100 : m.progress,
    sortOrder: m.sortOrder,
    completedAt: m.completedAt,
  }
}

function getCorporateTenantName(tenantId) {
  const t = db.select().from(tenants).where(eq(tenants.id, tenantId)).get()
  return t?.name ?? 'Corporate Partner'
}

export function reindexProject(projectId) {
  const row = db.select().from(csrProjects).where(eq(csrProjects.id, projectId)).get()
  if (!row) return
  const ngo = db.select().from(tenants).where(eq(tenants.id, row.ngoTenantId)).get()
  indexDocument({
    tenantId: row.corporateTenantId,
    entityType: 'project',
    entityId: row.id,
    title: row.name,
    body: [row.description, row.location, row.theme, row.scheduleVii].filter(Boolean).join(' '),
    keywords: [row.status, row.theme, ngo?.name, ngo?.slug].filter(Boolean),
  })
}

function recomputeAndSaveProgress(projectId) {
  const milestones = loadMilestones(projectId)
  const progress = computeProjectProgress(milestones.map(shapeMilestone))
  db.update(csrProjects)
    .set({ progress, updatedAt: new Date() })
    .where(eq(csrProjects.id, projectId))
    .run()
  return progress
}

function assertProjectAccess(project, { corporateTenantId, ngoTenantId }) {
  if (corporateTenantId && project.corporateTenantId !== corporateTenantId) {
    throw httpError('Project not found', 404)
  }
  if (ngoTenantId && project.ngoTenantId !== ngoTenantId) {
    throw httpError('Project not found', 404)
  }
}

function toListDto(row, audience) {
  const ngo = db.select().from(tenants).where(eq(tenants.id, row.ngoTenantId)).get()
  const corporate = db.select().from(tenants).where(eq(tenants.id, row.corporateTenantId)).get()
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    budget: row.budgetInr,
    budgetInr: row.budgetInr,
    spent: row.spentInr,
    spentInr: row.spentInr,
    theme: row.theme,
    progress: row.progress,
    location: row.location,
    startDate: row.startDate,
    endDate: row.endDate,
    ngoSlug: ngo?.slug,
    ngoName: ngo?.name,
    partner: corporate?.name,
    corporateName: corporate?.name,
  }
}

function toDetailDto(row, audience) {
  const ngo = db.select().from(tenants).where(eq(tenants.id, row.ngoTenantId)).get()
  const milestones = loadMilestones(row.id).map(shapeMilestone)
  const updates = loadUpdates(row.id).map((u) => ({
    id: u.id,
    date: u.createdAt.toISOString().slice(0, 10),
    author: u.authorName || 'User',
    text: u.body,
    body: u.body,
    createdAt: u.createdAt,
  }))
  const evidence = loadProjectFiles(row.id).map((f) => ({
    id: f.id,
    name: f.originalName,
    date: f.createdAt.toISOString().slice(0, 10),
    mime: f.mime,
    sizeBytes: f.sizeBytes,
  }))

  const base = toListDto(row, audience)
  return {
    ...base,
    description: row.description,
    scheduleVII: row.scheduleVii,
    scheduleVii: row.scheduleVii,
    milestones,
    updates,
    evidence,
    files: evidence,
    partner: getCorporateTenantName(row.corporateTenantId),
    beneficiaries: { direct: 0, indirect: 0, added: 0 },
    expenses: [],
  }
}

export function listProjects({ corporateTenantId, ngoTenantId, status, audience = 'corporate' } = {}) {
  let rows = db.select().from(csrProjects).all()

  if (corporateTenantId) {
    rows = rows.filter((r) => r.corporateTenantId === corporateTenantId)
  }
  if (ngoTenantId) {
    rows = rows.filter((r) => r.ngoTenantId === ngoTenantId)
  }
  if (status) {
    rows = rows.filter((r) => r.status === status)
  }

  rows.sort((a, b) => b.updatedAt - a.updatedAt)
  return { projects: rows.map((r) => toListDto(r, audience)) }
}

export function getProject(id, { corporateTenantId, ngoTenantId, audience = 'corporate' } = {}) {
  const row = db.select().from(csrProjects).where(eq(csrProjects.id, id)).get()
  if (!row) return null
  assertProjectAccess(row, { corporateTenantId, ngoTenantId })
  return toDetailDto(row, audience)
}

export function createProject({
  corporateTenantId,
  ngoTenantId,
  ngoSlug,
  userId,
  name,
  description,
  scheduleVii,
  theme,
  location,
  budgetInr,
  startDate,
  endDate,
  milestones = [],
  skipWorkflow = false,
  initialStatus,
  id: fixedId,
}, req) {
  const ngo = resolveNgoTenant({ ngoTenantId, ngoSlug })
  const now = new Date()
  const id = fixedId || newId()
  const status = initialStatus || 'pending_approval'

  db.insert(csrProjects).values({
    id,
    corporateTenantId,
    ngoTenantId: ngo.id,
    name,
    description: description || null,
    scheduleVii,
    theme: theme || null,
    location,
    status,
    budgetInr,
    spentInr: 0,
    startDate,
    endDate,
    progress: 0,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
  }).run()

  if (milestones.length) {
    milestones.forEach((m, i) => {
      db.insert(projectMilestones).values({
        id: newId(),
        projectId: id,
        title: m.title,
        dueDate: m.dueDate,
        status: m.status || 'pending',
        progress: m.progress ?? 0,
        sortOrder: i,
        completedAt: m.status === 'completed' ? now : null,
      }).run()
    })
    recomputeAndSaveProgress(id)
  }

  if (!skipWorkflow && status === 'pending_approval') {
    createInstance({
      req,
      definitionSlug: 'csr_project_approval',
      tenantId: corporateTenantId,
      entityType: 'project',
      entityId: id,
      submittedBy: userId,
      title: name,
    })
  }

  reindexProject(id)

  if (req) {
    logMutation({
      req,
      action: 'project.create',
      entityType: 'project',
      entityId: id,
      after: { name, status, ngoTenantId: ngo.id },
    }).catch(() => {})
  }

  return getProject(id, { corporateTenantId, audience: 'corporate' })
}

export function updateProject(id, patch, { corporateTenantId, req } = {}) {
  const row = db.select().from(csrProjects).where(eq(csrProjects.id, id)).get()
  if (!row) throw httpError('Project not found', 404)
  assertProjectAccess(row, { corporateTenantId })

  if (row.status !== 'pending_approval' && (patch.ngoTenantId || patch.ngoSlug)) {
    throw httpError('Cannot reassign NGO after approval', 400)
  }

  const updates = { updatedAt: new Date() }
  if (patch.name !== undefined) updates.name = patch.name
  if (patch.description !== undefined) updates.description = patch.description
  if (patch.scheduleVii !== undefined) updates.scheduleVii = patch.scheduleVii
  if (patch.theme !== undefined) updates.theme = patch.theme
  if (patch.location !== undefined) updates.location = patch.location
  if (patch.budgetInr !== undefined) updates.budgetInr = patch.budgetInr
  if (patch.startDate !== undefined) updates.startDate = patch.startDate
  if (patch.endDate !== undefined) updates.endDate = patch.endDate
  if (patch.status !== undefined) updates.status = patch.status

  if (patch.ngoTenantId || patch.ngoSlug) {
    const ngo = resolveNgoTenant({ ngoTenantId: patch.ngoTenantId, ngoSlug: patch.ngoSlug })
    updates.ngoTenantId = ngo.id
  }

  db.update(csrProjects).set(updates).where(eq(csrProjects.id, id)).run()
  reindexProject(id)

  if (req) {
    logMutation({
      req,
      action: 'project.update',
      entityType: 'project',
      entityId: id,
      after: updates,
    }).catch(() => {})
  }

  return getProject(id, { corporateTenantId, audience: 'corporate' })
}

export function archiveProject(id, { corporateTenantId, req } = {}) {
  return updateProject(id, { status: 'archived' }, { corporateTenantId, req })
}

export function updateProjectSpent(id, spentInr, { corporateTenantId, req } = {}) {
  const row = db.select().from(csrProjects).where(eq(csrProjects.id, id)).get()
  if (!row) throw httpError('Project not found', 404)
  assertProjectAccess(row, { corporateTenantId })

  db.update(csrProjects)
    .set({ spentInr, updatedAt: new Date() })
    .where(eq(csrProjects.id, id))
    .run()

  if (req) {
    logMutation({
      req,
      action: 'project.update_spent',
      entityType: 'project',
      entityId: id,
      after: { spentInr },
    }).catch(() => {})
  }

  return getProject(id, { corporateTenantId, audience: 'corporate' })
}

export function setProjectStatusFromWorkflow(projectId, workflowStatus) {
  const row = db.select().from(csrProjects).where(eq(csrProjects.id, projectId)).get()
  if (!row) return

  let status = row.status
  if (workflowStatus === 'approved') status = 'active'
  else if (workflowStatus === 'rejected') status = 'rejected'

  if (status !== row.status) {
    db.update(csrProjects)
      .set({ status, updatedAt: new Date() })
      .where(eq(csrProjects.id, projectId))
      .run()
    reindexProject(projectId)
  }
}

export function addMilestone(projectId, data, { corporateTenantId, ngoTenantId, req } = {}) {
  const row = db.select().from(csrProjects).where(eq(csrProjects.id, projectId)).get()
  if (!row) throw httpError('Project not found', 404)
  assertProjectAccess(row, { corporateTenantId, ngoTenantId })

  const existing = loadMilestones(projectId)
  const now = new Date()
  const id = newId()
  const status = data.status || 'pending'

  db.insert(projectMilestones).values({
    id,
    projectId,
    title: data.title,
    dueDate: data.dueDate,
    status,
    progress: data.progress ?? (status === 'completed' ? 100 : 0),
    sortOrder: existing.length,
    completedAt: status === 'completed' ? now : null,
  }).run()

  recomputeAndSaveProgress(projectId)

  if (req) {
    logMutation({
      req,
      action: 'project.milestone.add',
      entityType: 'project',
      entityId: projectId,
      after: { milestoneId: id, title: data.title },
    }).catch(() => {})
  }

  return shapeMilestone(db.select().from(projectMilestones).where(eq(projectMilestones.id, id)).get())
}

export function updateMilestone(projectId, milestoneId, patch, { corporateTenantId, ngoTenantId, req } = {}) {
  const row = db.select().from(csrProjects).where(eq(csrProjects.id, projectId)).get()
  if (!row) throw httpError('Project not found', 404)
  assertProjectAccess(row, { corporateTenantId, ngoTenantId })

  const milestone = db.select().from(projectMilestones)
    .where(and(eq(projectMilestones.id, milestoneId), eq(projectMilestones.projectId, projectId)))
    .get()
  if (!milestone) throw httpError('Milestone not found', 404)

  const now = new Date()
  const updates = {}
  if (patch.title !== undefined) updates.title = patch.title
  if (patch.dueDate !== undefined) updates.dueDate = patch.dueDate
  if (patch.status !== undefined) {
    updates.status = patch.status
    if (patch.status === 'completed') {
      updates.progress = 100
      updates.completedAt = now
    }
  }
  if (patch.progress !== undefined) updates.progress = patch.progress

  db.update(projectMilestones).set(updates)
    .where(eq(projectMilestones.id, milestoneId))
    .run()

  recomputeAndSaveProgress(projectId)

  if (req) {
    logMutation({
      req,
      action: 'project.milestone.update',
      entityType: 'project',
      entityId: projectId,
      after: { milestoneId, ...updates },
    }).catch(() => {})
  }

  const updated = db.select().from(projectMilestones).where(eq(projectMilestones.id, milestoneId)).get()
  return shapeMilestone(updated)
}

export function deleteMilestone(projectId, milestoneId, { corporateTenantId, req } = {}) {
  const row = db.select().from(csrProjects).where(eq(csrProjects.id, projectId)).get()
  if (!row) throw httpError('Project not found', 404)
  assertProjectAccess(row, { corporateTenantId })

  db.delete(projectMilestones)
    .where(and(eq(projectMilestones.id, milestoneId), eq(projectMilestones.projectId, projectId)))
    .run()

  recomputeAndSaveProgress(projectId)

  if (req) {
    logMutation({
      req,
      action: 'project.milestone.delete',
      entityType: 'project',
      entityId: projectId,
      after: { milestoneId },
    }).catch(() => {})
  }

  return { deleted: true, milestoneId }
}

export function addProjectUpdate(projectId, { userId, body }, { corporateTenantId, ngoTenantId, req } = {}) {
  const row = db.select().from(csrProjects).where(eq(csrProjects.id, projectId)).get()
  if (!row) throw httpError('Project not found', 404)
  assertProjectAccess(row, { corporateTenantId, ngoTenantId })

  const id = newId()
  const now = new Date()
  db.insert(projectUpdates).values({
    id,
    projectId,
    authorUserId: userId,
    body,
    createdAt: now,
  }).run()

  db.update(csrProjects)
    .set({ updatedAt: now })
    .where(eq(csrProjects.id, projectId))
    .run()

  if (req) {
    logMutation({
      req,
      action: 'project.update_post',
      entityType: 'project',
      entityId: projectId,
      after: { updateId: id },
    }).catch(() => {})
  }

  const author = db.select().from(users).where(eq(users.id, userId)).get()
  return {
    id,
    date: now.toISOString().slice(0, 10),
    author: author?.fullName || 'User',
    text: body,
    body,
    createdAt: now,
  }
}
