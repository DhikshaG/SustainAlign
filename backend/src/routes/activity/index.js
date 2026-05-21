import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { requirePermission } from '../../middleware/permissions.js'
import { ok } from '../../lib/response.js'
import { PERMISSIONS } from '../../lib/permissions.js'
import { listActivity } from '../../services/activity-log/index.js'

const router = Router()

router.get('/', authenticate, requirePermission(PERMISSIONS.ACTIVITY_READ), (req, res) => {
  const { entityType, userId, limit } = req.query
  const items = listActivity({
    tenantId: req.user.tenantId,
    entityType: entityType || undefined,
    userId: userId || undefined,
    limit: limit ? Number(limit) : 50,
  })
  return ok(res, { activity: items })
})

const adminRouter = Router()

adminRouter.get('/', authenticate, requirePermission(PERMISSIONS.ADMIN_AUDIT_READ), (req, res) => {
  const { entityType, userId, limit } = req.query
  const items = listActivity({
    crossTenant: true,
    entityType: entityType || undefined,
    userId: userId || undefined,
    limit: limit ? Number(limit) : 100,
  })
  return ok(res, { activity: items })
})

export { router as activityRouter, adminRouter as adminActivityRouter }
