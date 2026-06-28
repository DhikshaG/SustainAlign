import { eq, and } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { csrProjects, tenants, users } from '../../db/schema.js'
import { logMutation } from '../activity-log/index.js'
import { createNotification, notifyRole } from '../notifications/index.js'

function httpError(message, status) {
  const err = new Error(message)
  err.status = status
  return err
}

export function canUseCrm(project) {
  if (project.ngoPartnershipStatus === 'accepted') return true
  if (!project.ngoPartnershipStatus && project.status === 'active') return true
  return false
}

export async function onCorporateProjectApproved(projectId) {
  const row = await db.select().from(csrProjects).where(eq(csrProjects.id, projectId)).get()
  if (!row) return

  const now = new Date()
  await db
    .update(csrProjects)
    .set({
      status: 'pending_ngo',
      ngoPartnershipStatus: 'pending',
      updatedAt: now,
    })
    .where(eq(csrProjects.id, projectId))
    .run()

  const corporate = await db.select().from(tenants).where(eq(tenants.id, row.corporateTenantId)).get()
  notifyRole(row.ngoTenantId, 'ngo_admin', {
    type: 'partnership.request',
    title: 'New partnership request',
    body: `${corporate?.name || 'A corporate partner'} invited you to project "${row.name}".`,
    link: '/ngo/partnership-requests',
  }).catch(() => {})
}

export async function listPartnershipRequests(ngoTenantId) {
  return await db
    .select()
    .from(csrProjects)
    .where(and(eq(csrProjects.ngoTenantId, ngoTenantId), eq(csrProjects.ngoPartnershipStatus, 'pending')))
    .all()
    .map(async (row) => {
      const corporate = await db.select().from(tenants).where(eq(tenants.id, row.corporateTenantId)).get()
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        budgetInr: row.budgetInr,
        theme: row.theme,
        location: row.location,
        startDate: row.startDate,
        endDate: row.endDate,
        corporateName: corporate?.name,
        status: row.status,
        ngoPartnershipStatus: row.ngoPartnershipStatus,
      }
    })
}

export async function respondToPartnership(projectId, ngoTenantId, { action, note }, req) {
  const row = await db.select().from(csrProjects).where(eq(csrProjects.id, projectId)).get()
  if (!row || row.ngoTenantId !== ngoTenantId) throw httpError('Project not found', 404)
  if (row.ngoPartnershipStatus !== 'pending') {
    throw httpError('Partnership request is not pending', 400)
  }

  const now = new Date()
  const accepted = action === 'accept'
  await db
    .update(csrProjects)
    .set({
      ngoPartnershipStatus: accepted ? 'accepted' : 'declined',
      ngoRespondedAt: now,
      ngoResponseNote: note || null,
      status: accepted ? 'active' : 'rejected',
      updatedAt: now,
    })
    .where(eq(csrProjects.id, projectId))
    .run()

  if (req) {
    logMutation({
      req,
      action: accepted ? 'partnership.accept' : 'partnership.decline',
      entityType: 'project',
      entityId: projectId,
      after: { action, note },
    }).catch(() => {})
  }

  const submitter = await db.select().from(users).where(eq(users.id, row.createdBy)).get()
  if (submitter) {
    createNotification({
      userId: row.createdBy,
      tenantId: row.corporateTenantId,
      type: accepted ? 'partnership.accepted' : 'partnership.declined',
      title: accepted ? 'NGO accepted partnership' : 'NGO declined partnership',
      body: `${row.name}: ${note || (accepted ? 'Accepted' : 'Declined')}`,
      link: `/dashboard/projects/${projectId}`,
    }).catch(() => {})
  }

  notifyRole(row.corporateTenantId, 'csr_head', {
    type: accepted ? 'partnership.accepted' : 'partnership.declined',
    title: accepted ? 'Partnership accepted' : 'Partnership declined',
    body: row.name,
    link: `/dashboard/projects/${projectId}`,
  }).catch(() => {})

  return {
    id: projectId,
    ngoPartnershipStatus: accepted ? 'accepted' : 'declined',
    status: accepted ? 'active' : 'rejected',
  }
}
