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
import { activityRouter, adminActivityRouter } from './activity/index.js'

const router = Router()

router.use('/auth/corporate', authCorporate)
router.use('/auth/ngo', authNgo)
router.use('/auth', authShared)
router.use('/corporate', corporateRoutes)
router.use('/ngo', ngoRoutes)
router.use('/admin', adminRoutes)
router.use('/admin/activity', adminActivityRouter)
router.use('/files', filesRoutes)
router.use('/notifications', notificationsRoutes)
router.use('/activity', activityRouter)
router.use('/', publicRoutes)

export default router
