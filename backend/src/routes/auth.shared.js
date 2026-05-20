import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate.js'
import { authenticate, reqMeta } from '../middleware/authenticate.js'
import { authRateLimit } from '../middleware/rate-limit-auth.js'
import { ok } from '../lib/response.js'
import { refreshSession, logout, getMe } from '../services/auth/index.js'

const router = Router()

const refreshSchema = z.object({
  refresh_token: z.string().min(1),
})

router.post('/refresh', authRateLimit, validate(refreshSchema), async (req, res, next) => {
  try {
    const data = await refreshSession(req.validated.refresh_token, reqMeta(req))
    return ok(res, data, 'Token refreshed')
  } catch (err) { next(err) }
})

router.post('/logout', async (req, res, next) => {
  try {
    await logout(req.body?.refresh_token)
    return ok(res, null, 'Logged out')
  } catch (err) { next(err) }
})

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await getMe(req.user.sub)
    return ok(res, user)
  } catch (err) { next(err) }
})

export default router
