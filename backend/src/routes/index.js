import { Router } from 'express'
import authCorporate from './auth.corporate.js'
import authNgo from './auth.ngo.js'
import authShared from './auth.shared.js'
import publicRoutes from './public.js'
import corporateRoutes from './corporate/index.js'
import ngoRoutes from './ngo/index.js'
import adminRoutes from './admin/index.js'
import filesRoutes from './files/index.js'
import notificationsRoutes from './notifications/index.js'
import searchRoutes from './search/index.js'
import { activityRouter, adminActivityRouter } from './activity/index.js'
import { tagsRouter, entityTagsRouter } from './tags/index.js'
import workflowRoutes, { ngoReportsRouter } from './workflows/index.js'
import { authenticate } from '../middleware/authenticate.js'
import { requirePermission } from '../middleware/permissions.js'
import { validate } from '../middleware/validate.js'
import { ok } from '../lib/response.js'
import { PERMISSIONS } from '../lib/permissions.js'
import { auditQuerySchema } from '../schemas/audit.js'
import { getAuditTrail } from '../services/audit/index.js'
import { featureStatusRoute } from '../middleware/feature-flags.js'

const router = Router()

router.use('/auth/corporate', authCorporate)
router.use('/auth/ngo', authNgo)
router.use('/auth', authShared)
router.use('/corporate', corporateRoutes)
router.use('/ngo', ngoRoutes)
router.use('/ngo/reports', ngoReportsRouter)
router.use('/admin', adminRoutes)
router.use('/admin/activity', adminActivityRouter)
router.use('/files', filesRoutes)
router.use('/notifications', notificationsRoutes)
router.use('/activity', activityRouter)
router.use('/search', searchRoutes)
router.use('/tags', tagsRouter)
router.use('/entities', entityTagsRouter)
router.use('/workflows', workflowRoutes)
router.get(
  '/audit-trail',
  authenticate,
  requirePermission(PERMISSIONS.ACTIVITY_READ),
  validate(auditQuerySchema, 'query'),
  (req, res) => {
    ok(res, { trail: getAuditTrail(req.user.tenantId, req.validated) })
  },
)
router.get('/features', featureStatusRoute)
router.use('/', publicRoutes)

export default router
