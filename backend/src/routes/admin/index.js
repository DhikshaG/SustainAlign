import { Router } from 'express'
import { authenticate, requireRole } from '../../middleware/authenticate.js'
import { requirePermission } from '../../middleware/permissions.js'
import { validate } from '../../middleware/validate.js'
import { ok, fail } from '../../lib/response.js'
import { PERMISSIONS } from '../../lib/permissions.js'
import { auditQuerySchema } from '../../schemas/audit.js'
import { getAuditTrail, getComplianceAuditSummary } from '../../services/audit/index.js'
import { logMutation } from '../../services/activity-log/index.js'
import { createNotification } from '../../services/notifications/index.js'
import { listVerificationQueue, updatePlatformFields } from '../../services/ngo/index.js'
import { platformFieldsSchema } from '../../schemas/ngo.js'
import { db } from '../../db/index.js'
import { ngoProfiles, memberships } from '../../db/schema.js'
import { eq, and } from 'drizzle-orm'
import {
  overview,
  users,
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
router.get('/ngo-verification', (_req, res) => ok(res, { queue: listVerificationQueue() }))
router.get('/fraud/alerts', (_req, res) => ok(res, { alerts: fraudAlerts }))
router.get('/analytics', (_req, res) => ok(res, analytics))
router.get('/support/tickets', (_req, res) => ok(res, { tickets: supportTickets }))
router.get('/compliance', (_req, res) => ok(res, { records: compliance }))

router.get(
  '/audit/trail',
  requirePermission(PERMISSIONS.ADMIN_AUDIT_READ),
  validate(auditQuerySchema, 'query'),
  (req, res) => {
    ok(res, {
      trail: getAuditTrail(null, { ...req.validated, crossTenant: true, filterTenantId: req.validated.tenantId }),
    })
  },
)

router.get('/audit/summary', requirePermission(PERMISSIONS.ADMIN_AUDIT_READ), (req, res) => {
  const tenantId = req.query.tenantId
  if (!tenantId) return ok(res, { message: 'Provide tenantId query param' })
  ok(res, getComplianceAuditSummary(String(tenantId)))
})

router.get('/ai-monitoring', (_req, res) => ok(res, aiMonitoring))
router.get('/content/moderation', (_req, res) => ok(res, { items: contentModeration }))

router.post(
  '/ngo-verification/:tenantId/approve',
  requirePermission(PERMISSIONS.ADMIN_VERIFY_NGO),
  async (req, res, next) => {
    try {
      const { tenantId } = req.params
      const profile = await db.select().from(ngoProfiles).where(eq(ngoProfiles.tenantId, tenantId)).get()
      if (!profile) return fail(res, 404, 'NGO not found')

      const previousStatus = profile.verificationStatus
      await db
        .update(ngoProfiles)
        .set({ verificationStatus: 'verified' })
        .where(eq(ngoProfiles.tenantId, tenantId))
        .run()

      const admins = await db
        .select()
        .from(memberships)
        .where(and(eq(memberships.tenantId, tenantId), eq(memberships.role, 'ngo_admin')))
        .all()

      for (const m of admins) {
        await createNotification({
          userId: m.userId,
          tenantId,
          type: 'ngo.approved',
          title: 'NGO verification approved',
          body: 'Your organization has been verified on SustainAlign.',
          link: '/ngo',
        })
      }

      await logMutation({
        req,
        action: 'ngo.verify.approve',
        entityType: 'ngo',
        entityId: tenantId,
        before: { verificationStatus: previousStatus },
        after: { verificationStatus: 'verified' },
      })

      return ok(res, { tenantId, status: 'verified' })
    } catch (err) {
      next(err)
    }
  },
)

router.post(
  '/ngo-verification/:tenantId/reject',
  requirePermission(PERMISSIONS.ADMIN_VERIFY_NGO),
  async (req, res, next) => {
    try {
      const { tenantId } = req.params
      const profile = await db.select().from(ngoProfiles).where(eq(ngoProfiles.tenantId, tenantId)).get()
      const previousStatus = profile?.verificationStatus ?? 'unknown'
      await db
        .update(ngoProfiles)
        .set({ verificationStatus: 'rejected' })
        .where(eq(ngoProfiles.tenantId, tenantId))
        .run()
      await logMutation({
        req,
        action: 'ngo.verify.reject',
        entityType: 'ngo',
        entityId: tenantId,
        before: { verificationStatus: previousStatus },
        after: { verificationStatus: 'rejected' },
        reason: req.body?.reason,
      })
      return ok(res, { tenantId, status: 'rejected' })
    } catch (err) {
      next(err)
    }
  },
)

router.patch(
  '/ngos/:tenantId/risk',
  requirePermission(PERMISSIONS.ADMIN_VERIFY_NGO),
  validate(platformFieldsSchema),
  (req, res, next) => {
    try {
      const profile = updatePlatformFields(req.params.tenantId, req.validated, req)
      return ok(res, profile, 'Platform fields updated')
    } catch (err) {
      if (err.status === 404) return fail(res, 404, err.message)
      next(err)
    }
  },
)

export default router
