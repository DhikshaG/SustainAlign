import { eq, and, desc } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { csrProjects, projectTasks, users } from '../../db/schema.js'
import { newId } from '../../lib/ids.js'
import { logMutation } from '../activity-log/index.js'
import { createNotification, notifyRole } from '../notifications/index.js'
import { canUseCrm } from '../partnership/index.js'

function httpError(message, status) {
  const err = new Error(message)
  err.status = status
  return err
}

function assertProjectCrm(project) {
  if (!canUseCrm(project)) throw httpError('Partnership must be accepted before CRM actions', 400)
}

function shapeTask(row) {
  const assignee = row.assigneeUserId
    ? db.select().from(users).where(eq(users.id, row.assigneeUserId)).get()
    : null
  return {
    id: row.id,
    projectId: row.projectId,
    title: row.title,
    description: row.description,
    assigneeSide: row.assigneeSide,
    assigneeUserId: row.assigneeUserId,
    assigneeName: assignee?.fullName || null,
    status: row.status,
    dueDate: row.dueDate,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function createTask(projectId, data, createdBy, req) {
  const project = db.select().from(csrProjects).where(eq(csrProjects.id, projectId)).get()
  if (!project) throw httpError('Project not found', 404)
  assertProjectCrm(project)

  const now = new Date()
  const id = newId()
  db.insert(projectTasks).values({
    id,
    projectId,
    title: data.title,
    description: data.description || null,
    assigneeSide: data.assigneeSide,
    assigneeUserId: data.assigneeUserId || null,
    status: 'open',
    dueDate: data.dueDate || null,
    createdBy,
    createdAt: now,
    updatedAt: now,
  }).run()

  if (req) {
    logMutation({ req, action: 'task.create', entityType: 'project', entityId: projectId, after: { taskId: id, title: data.title } }).catch(() => {})
  }

  const notifyTenant = data.assigneeSide === 'ngo' ? project.ngoTenantId : project.corporateTenantId
  const notifyTargetRole = data.assigneeSide === 'ngo' ? 'ngo_admin' : 'csr_head'
  notifyRole(notifyTenant, notifyTargetRole, {
    type: 'task.assigned',
    title: 'New task assigned',
    body: data.title,
    link: data.assigneeSide === 'ngo' ? `/ngo/projects/${projectId}` : `/dashboard/projects/${projectId}`,
  }).catch(() => {})

  return shapeTask(db.select().from(projectTasks).where(eq(projectTasks.id, id)).get())
}

export function listTasksForProject(projectId) {
  return db.select().from(projectTasks)
    .where(eq(projectTasks.projectId, projectId))
    .orderBy(desc(projectTasks.updatedAt))
    .all()
    .map(shapeTask)
}

export function listTasksForUser(userId, tenantId, side) {
  const projects = side === 'ngo'
    ? db.select().from(csrProjects).where(eq(csrProjects.ngoTenantId, tenantId)).all()
    : db.select().from(csrProjects).where(eq(csrProjects.corporateTenantId, tenantId)).all()
  const projectIds = new Set(projects.map((p) => p.id))
  const tasks = db.select().from(projectTasks)
    .where(and(
      eq(projectTasks.assigneeSide, side),
    ))
    .orderBy(desc(projectTasks.updatedAt))
    .all()
  return tasks
    .filter((t) => projectIds.has(t.projectId) && (!t.assigneeUserId || t.assigneeUserId === userId))
    .map(shapeTask)
}

export function updateTaskStatus(taskId, patch, user, req) {
  const task = db.select().from(projectTasks).where(eq(projectTasks.id, taskId)).get()
  if (!task) throw httpError('Task not found', 404)

  const project = db.select().from(csrProjects).where(eq(csrProjects.id, task.projectId)).get()
  if (!project) throw httpError('Project not found', 404)
  if (user.tenantId !== project.corporateTenantId && user.tenantId !== project.ngoTenantId) {
    throw httpError('Task not found', 404)
  }
  assertProjectCrm(project)

  const now = new Date()
  const updates = { updatedAt: now }
  if (patch.title !== undefined) updates.title = patch.title
  if (patch.description !== undefined) updates.description = patch.description
  if (patch.status !== undefined) updates.status = patch.status
  if (patch.dueDate !== undefined) updates.dueDate = patch.dueDate

  db.update(projectTasks).set(updates).where(eq(projectTasks.id, taskId)).run()

  if (req) {
    logMutation({
      req,
      action: 'task.update',
      entityType: 'project',
      entityId: task.projectId,
      after: { taskId, ...updates },
    }).catch(() => {})
  }

  return shapeTask(db.select().from(projectTasks).where(eq(projectTasks.id, taskId)).get())
}
