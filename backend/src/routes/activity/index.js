import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { requirePermission } from '../../middleware/permissions.js'
import { validate } from '../../middleware/validate.js'
import { ok } from '../../lib/response.js'
import { PERMISSIONS } from '../../lib/permissions.js'
import { activityQuerySchema } from '../../schemas/activity.js'
import {
  listActivity,
  getEntityHistory,
  formatActivityForExport,
} from '../../services/activity-log/index.js'

function buildList(req, crossTenant = false) {
  const q = req.validated
  const rows = listActivity({
    tenantId: req.user.tenantId,
    crossTenant,
    filterTenantId: crossTenant ? q.tenantId : undefined,
    entityType: q.entityType,
    entityId: q.entityId,
    userId: q.userId,
    action: q.action,
    dateFrom: q.dateFrom,
    dateTo: q.dateTo,
    limit: q.limit ?? 50,
    offset: q.offset ?? 0,
  })
  return formatActivityForExport(rows)
}

const router = Router()

router.get('/', authenticate, requirePermission(PERMISSIONS.ACTIVITY_READ), validate(activityQuerySchema, 'query'), (req, res) => {
  return ok(res, { activity: buildList(req) })
})

router.get('/export', authenticate, requirePermission(PERMISSIONS.ACTIVITY_EXPORT), validate(activityQuerySchema, 'query'), (req, res) => {
  return ok(res, { activity: buildList(req), exportedAt: new Date().toISOString() })
})

router.get('/entity/:entityType/:entityId', authenticate, requirePermission(PERMISSIONS.ACTIVITY_READ), (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 50
  const rows = getEntityHistory(req.params.entityType, req.params.entityId, { limit })
  return ok(res, { activity: formatActivityForExport(rows) })
})

const adminRouter = Router()

adminRouter.get('/', authenticate, requirePermission(PERMISSIONS.ADMIN_AUDIT_READ), validate(activityQuerySchema, 'query'), (req, res) => {
  return ok(res, { activity: buildList(req, true) })
})

export { router as activityRouter, adminRouter as adminActivityRouter }
