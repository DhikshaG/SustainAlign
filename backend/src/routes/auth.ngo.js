import { Router } from 'express'
import multer from 'multer'
import { validate } from '../middleware/validate.js'
import { ok, created } from '../lib/response.js'
import { ngoRegisterSchema, ngoLoginSchema } from '../schemas/auth.corporate.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg']
    cb(null, allowed.includes(file.mimetype))
  },
})

const router = Router()

router.post('/register', validate(ngoRegisterSchema), (req, res) => {
  console.log('[stub] ngo register:', req.validated.ngoName)
  return created(res, { ngoId: 'stub-ngo-id' }, 'NGO registered (stub)')
})

router.post('/login', validate(ngoLoginSchema), (req, res) => {
  console.log('[stub] ngo login:', req.validated.email)
  return ok(res, { accessToken: 'stub-access-token' }, 'Login successful (stub)')
})

router.post('/verification', upload.fields([
  { name: 'registration', maxCount: 1 },
  { name: '12a', maxCount: 1 },
  { name: '80g', maxCount: 1 },
  { name: 'fcra', maxCount: 1 },
]), (req, res) => {
  const files = Object.entries(req.files || {}).map(([key, arr]) => ({
    field: key,
    name: arr[0]?.originalname,
    size: arr[0]?.size,
  }))
  console.log('[stub] ngo verification upload:', files)
  return ok(res, { files, status: 'pending_review' }, 'Documents received (stub)')
})

export default router
