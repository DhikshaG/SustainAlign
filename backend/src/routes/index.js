import { Router } from 'express'
import authCorporate from './auth.corporate.js'
import authNgo from './auth.ngo.js'
import publicRoutes from './public.js'

const router = Router()

router.use('/auth/corporate', authCorporate)
router.use('/auth/ngo', authNgo)
router.use('/', publicRoutes)

export default router
