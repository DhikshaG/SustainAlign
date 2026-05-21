import { eq, or, desc, and } from 'drizzle-orm'
import { db } from '../../db/index.js'
import {
  activityLogs,
  workflowInstances,
  workflowEvents,
  messageThreads,
  messages,
  projectTasks,
  projectMilestones,
  csrProjects,
  users,
} from '../../db/schema.js'

export function getProjectTimeline(projectId) {
  const project = db.select().from(csrProjects).where(eq(csrProjects.id, projectId)).get()
  if (!project) return []

  const items = []

  const logs = db.select().from(activityLogs)
    .where(and(
      eq(activityLogs.entityType, 'project'),
      eq(activityLogs.entityId, projectId),
    ))
    .orderBy(desc(activityLogs.createdAt))
    .limit(50)
    .all()

  for (const log of logs) {
    items.push({
      id: log.id,
      type: 'activity',
      action: log.action,
      summary: log.action.replace(/\./g, ' '),
      createdAt: log.createdAt,
      reason: log.reason,
    })
  }

  const wfInstances = db.select().from(workflowInstances)
    .where(or(
      and(eq(workflowInstances.entityType, 'project'), eq(workflowInstances.entityId, projectId)),
    ))
    .all()

  const milestoneIds = db.select().from(projectMilestones).where(eq(projectMilestones.projectId, projectId)).all().map((m) => m.id)
  for (const mid of milestoneIds) {
    const mWfs = db.select().from(workflowInstances)
      .where(and(eq(workflowInstances.entityType, 'milestone'), eq(workflowInstances.entityId, mid)))
      .all()
    wfInstances.push(...mWfs)
  }

  for (const wf of wfInstances) {
    const events = db.select().from(workflowEvents)
      .where(eq(workflowEvents.instanceId, wf.id))
      .orderBy(desc(workflowEvents.createdAt))
      .all()
    for (const ev of events) {
      items.push({
        id: ev.id,
        type: 'workflow',
        action: `workflow.${ev.toStatus}`,
        summary: `${wf.entityType} workflow → ${ev.toStatus}`,
        createdAt: ev.createdAt,
        reason: ev.comment,
      })
    }
  }

  const thread = db.select().from(messageThreads).where(eq(messageThreads.projectId, projectId)).get()
  if (thread) {
    const msgs = db.select({
      id: messages.id,
      body: messages.body,
      createdAt: messages.createdAt,
      senderName: users.fullName,
    })
      .from(messages)
      .innerJoin(users, eq(users.id, messages.senderUserId))
      .where(eq(messages.threadId, thread.id))
      .orderBy(desc(messages.createdAt))
      .limit(20)
      .all()
    for (const m of msgs) {
      items.push({
        id: m.id,
        type: 'message',
        action: 'crm.message',
        summary: `${m.senderName || 'User'}: ${m.body.slice(0, 80)}`,
        createdAt: m.createdAt,
      })
    }
  }

  const tasks = db.select().from(projectTasks).where(eq(projectTasks.projectId, projectId)).all()
  for (const t of tasks) {
    items.push({
      id: t.id,
      type: 'task',
      action: `task.${t.status}`,
      summary: `Task "${t.title}" — ${t.status}`,
      createdAt: t.updatedAt,
    })
  }

  return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}
