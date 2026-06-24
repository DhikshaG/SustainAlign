import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { authenticate, reqMeta } from '../middleware/authenticate.js'
import { requirePermission } from '../middleware/permissions.js'
import { PERMISSIONS } from '../lib/permissions.js'
import { authRateLimit } from '../middleware/rate-limit-auth.js'
import { ngoVerificationUpload } from '../middleware/upload.js'
import { ok, created } from '../lib/response.js'
import { ngoRegisterSchema, ngoLoginSchema } from '../schemas/auth.corporate.js'
import { ngoRegister, loginUser, saveNgoDocuments } from '../services/auth/index.js'

const router = Router()

router.use(authRateLimit)

router.post('/register', validate(ngoRegisterSchema), async (req, res, next) => {
  try {
    const data = await ngoRegister(req.validated, reqMeta(req))
    return created(res, data, 'NGO registered')
  } catch (err) { next(err) }
})

router.post('/login', validate(ngoLoginSchema), async (req, res, next) => {
  try {
    const data = await loginUser(req.validated.email, req.validated.password, reqMeta(req))
    return ok(res, data, 'Login successful')
  } catch (err) { next(err) }
})

router.post('/verification', authenticate, requirePermission(PERMISSIONS.NGO_DOCUMENTS_UPLOAD), ngoVerificationUpload.fields([
  { name: 'registration', maxCount: 1 },
  { name: '12a', maxCount: 1 },
  { name: '80g', maxCount: 1 },
  { name: 'fcra', maxCount: 1 },
]), async (req, res, next) => {
  try {
    if (req.user.tenantType !== 'ngo') {
      return res.status(403).json({ ok: false, message: 'NGO account required' })
    }
    const data = await saveNgoDocuments(req.user, req.files || {}, req)
    return ok(res, data, 'Documents received')
  } catch (err) { next(err) }
})

export default router
