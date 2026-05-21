import { eq, and, desc } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { activityLogs } from '../../db/schema.js'
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

export function listActivity({
  tenantId,
  entityType,
  userId,
  limit = 50,
  crossTenant = false,
}) {
  const conditions = []
  if (!crossTenant && tenantId) {
    conditions.push(eq(activityLogs.tenantId, tenantId))
  }
  if (entityType) {
    conditions.push(eq(activityLogs.entityType, entityType))
  }
  if (userId) {
    conditions.push(eq(activityLogs.userId, userId))
  }

  let query = db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit)
  if (conditions.length === 1) {
    query = query.where(conditions[0])
  } else if (conditions.length > 1) {
    query = query.where(and(...conditions))
  }

  return query.all().map((row) => ({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
    previousValue: row.previousValue ? JSON.parse(row.previousValue) : null,
  }))
}
