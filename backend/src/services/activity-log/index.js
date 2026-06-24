import { eq, and, desc, gte, lte, inArray } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { activityLogs, users } from '../../db/schema.js'
import { newId } from '../../lib/ids.js'
import { authLog } from '../../lib/auth-log.js'
import { reqMeta } from '../../middleware/authenticate.js'

export async function logActivity({
  req,
  tenantId,
  userId,
  action,
  entityType = null,
  entityId = null,
  metadata = null,
  previousValue = null,
  reason = null,
  ipAddress: ipOverride = null,
  userAgent: uaOverride = null,
}) {
  const meta = req ? reqMeta(req) : {}
  const tid = tenantId ?? req?.user?.tenantId ?? null
  const uid = userId ?? req?.user?.sub ?? null
  const now = new Date()

  const row = {
    id: newId(),
    tenantId: tid,
    userId: uid,
    action,
    entityType,
    entityId,
    metadata: metadata ? JSON.stringify(metadata) : null,
    previousValue: previousValue ? JSON.stringify(previousValue) : null,
    reason,
    ipAddress: ipOverride ?? meta.ipAddress ?? null,
    userAgent: uaOverride ?? meta.userAgent ?? null,
    createdAt: now,
  }

  try {
    db.insert(activityLogs).values(row).run()
  } catch (err) {
    console.error('activity_log insert failed', err)
  }

  authLog(action, { tenantId: tid, userId: uid, entityType, entityId, ...metadata })
  return row
}

export async function logMutation({ req, action, entityType, entityId, before, after, reason = null }) {
  return logActivity({
    req,
    action,
    entityType,
    entityId,
    previousValue: before,
    metadata: after,
    reason,
  })
}

function parseRow(row) {
  return {
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
    previousValue: row.previousValue ? JSON.parse(row.previousValue) : null,
  }
}

export function listActivity({
  tenantId,
  entityType,
  entityId,
  userId,
  action,
  dateFrom,
  dateTo,
  limit = 50,
  offset = 0,
  crossTenant = false,
  filterTenantId,
}) {
  const conditions = []
  if (!crossTenant && tenantId) {
    conditions.push(eq(activityLogs.tenantId, tenantId))
  }
  if (crossTenant && filterTenantId) {
    conditions.push(eq(activityLogs.tenantId, filterTenantId))
  }
  if (entityType) conditions.push(eq(activityLogs.entityType, entityType))
  if (entityId) conditions.push(eq(activityLogs.entityId, entityId))
  if (userId) conditions.push(eq(activityLogs.userId, userId))
  if (action) conditions.push(eq(activityLogs.action, action))
  if (dateFrom) conditions.push(gte(activityLogs.createdAt, new Date(dateFrom)))
  if (dateTo) conditions.push(lte(activityLogs.createdAt, new Date(dateTo)))

  let query = db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit).offset(offset)
  if (conditions.length === 1) {
    query = query.where(conditions[0])
  } else if (conditions.length > 1) {
    query = query.where(and(...conditions))
  }

  return query.all().map(parseRow)
}

export function getEntityHistory(entityType, entityId, { limit = 50 } = {}) {
  return listActivity({ entityType, entityId, limit, crossTenant: true })
}

export function formatActivityForExport(rows) {
  const userIds = [...new Set(rows.map((r) => r.userId).filter(Boolean))]
  const userMap = {}
  if (userIds.length) {
    const found = db.select({ id: users.id, email: users.email, fullName: users.fullName })
      .from(users)
      .where(inArray(users.id, userIds))
      .all()
    for (const u of found) userMap[u.id] = u
  }

  return rows.map((row) => {
    const u = row.userId ? userMap[row.userId] : null
    return {
      id: row.id,
      user: u ? { id: u.id, email: u.email, name: u.fullName } : null,
      action: row.action,
      at: row.createdAt,
      entity: { type: row.entityType, id: row.entityId },
      previousValue: row.previousValue,
      metadata: row.metadata,
      reason: row.reason,
      ipAddress: row.ipAddress,
    }
  })
}
