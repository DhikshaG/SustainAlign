import { Router } from 'express'
import authCorporate from './auth.corporate.js'
import authNgo from './auth.ngo.js'
import authShared from './auth.shared.js'
import publicRoutes from './public.js'
import corporateRoutes from './corporate/index.js'

const router = Router()

router.use('/auth/corporate', authCorporate)
router.use('/auth/ngo', authNgo)
router.use('/auth', authShared)
router.use('/corporate', corporateRoutes)
router.use('/', publicRoutes)

export default router
