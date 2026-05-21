import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { requirePermission } from '../../middleware/permissions.js'
import { ok } from '../../lib/response.js'
import { PERMISSIONS } from '../../lib/permissions.js'
import {
  listNotifications,
  countUnread,
  markRead,
  markAllRead,
} from '../../services/notifications/index.js'
import { logActivity } from '../../services/activity-log/index.js'
import { env } from '../../config/env.js'

const router = Router()

router.use(authenticate, requirePermission(PERMISSIONS.NOTIFICATIONS_READ))

router.get('/', (req, res) => {
  const items = listNotifications(req.user.sub, { limit: 30 })
  const unreadCount = countUnread(req.user.sub)
  return ok(res, { notifications: items, unreadCount })
})

router.patch('/read-all', async (req, res, next) => {
  try {
    markAllRead(req.user.sub)
    await logActivity({ req, action: 'notification.read_all' })
    return ok(res, { ok: true })
  } catch (err) {
    next(err)
  }
})

router.patch('/:id/read', async (req, res, next) => {
  try {
    markRead(req.params.id, req.user.sub)
    await logActivity({
      req,
      action: 'notification.read',
      entityType: 'notification',
      entityId: req.params.id,
    })
    return ok(res, { ok: true })
  } catch (err) {
    next(err)
  }
})

if (env.NODE_ENV === 'development') {
  router.post('/dev/test', async (req, res, next) => {
    try {
      const { createNotification } = await import('../../services/notifications/index.js')
      const n = await createNotification({
        userId: req.user.sub,
        tenantId: req.user.tenantId,
        type: 'report.pending',
        title: 'Test notification',
        body: 'This is a dev-only test notification.',
        link: '/dashboard',
        sendEmailFlag: false,
      })
      return ok(res, n)
    } catch (err) {
      next(err)
    }
  })
}

export default router
