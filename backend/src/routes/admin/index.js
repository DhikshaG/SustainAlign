import { Router } from 'express'
import { authenticate, requireRole } from '../../middleware/authenticate.js'
import { ok, fail } from '../../lib/response.js'
import {
  overview,
  users,
  verificationQueue,
  fraudAlerts,
  analytics,
  supportTickets,
  compliance,
  aiMonitoring,
  contentModeration,
} from '../../data/admin-sample.js'

const router = Router()

function requirePlatformTenant(req, res, next) {
  if (req.user?.tenantType !== 'platform') {
    return fail(res, 403, 'Platform tenant required')
  }
  next()
}

router.use(authenticate, requireRole('platform_super_admin'), requirePlatformTenant)

router.get('/overview', (_req, res) => ok(res, overview))
router.get('/users', (_req, res) => ok(res, { users }))
router.get('/ngo-verification', (_req, res) => ok(res, { queue: verificationQueue }))
router.get('/fraud/alerts', (_req, res) => ok(res, { alerts: fraudAlerts }))
router.get('/analytics', (_req, res) => ok(res, analytics))
router.get('/support/tickets', (_req, res) => ok(res, { tickets: supportTickets }))
router.get('/compliance', (_req, res) => ok(res, { records: compliance }))
router.get('/ai-monitoring', (_req, res) => ok(res, aiMonitoring))
router.get('/content/moderation', (_req, res) => ok(res, { items: contentModeration }))

export default router
