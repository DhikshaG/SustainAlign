import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { authenticate, requireRole, reqMeta } from '../middleware/authenticate.js'
import { authRateLimit } from '../middleware/rate-limit-auth.js'
import { ok, created } from '../lib/response.js'
import {
  corporateSignupSchema,
  corporateLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  mfaVerifySchema,
  inviteTeamSchema,
} from '../schemas/auth.corporate.js'
import {
  corporateSignup,
  loginUser,
  verifyMfa,
  forgotPassword,
  resetPassword,
  inviteTeam,
} from '../services/auth/index.js'

const router = Router()

router.use(authRateLimit)

router.post('/signup', validate(corporateSignupSchema), async (req, res, next) => {
  try {
    const data = await corporateSignup(req.validated, reqMeta(req))
    return created(res, data, 'Account created')
  } catch (err) { next(err) }
})

router.post('/login', validate(corporateLoginSchema), async (req, res, next) => {
  try {
    const data = await loginUser(req.validated.email, req.validated.password, reqMeta(req))
    return ok(res, data, 'Login successful')
  } catch (err) { next(err) }
})

router.post('/forgot-password', validate(forgotPasswordSchema), async (req, res, next) => {
  try {
    await forgotPassword(req.validated.email)
    return ok(res, null, 'If the account exists, a reset link has been sent')
  } catch (err) { next(err) }
})

router.post('/reset-password', validate(resetPasswordSchema), async (req, res, next) => {
  try {
    await resetPassword(req.validated.token, req.validated.password)
    return ok(res, null, 'Password reset successful')
  } catch (err) { next(err) }
})

router.post('/mfa/verify', validate(mfaVerifySchema), async (req, res, next) => {
  try {
    const data = await verifyMfa(req.validated.mfaSessionId, req.validated.code, reqMeta(req))
    return ok(res, data, 'MFA verified')
  } catch (err) { next(err) }
})

router.post('/invite-team', authenticate, requireRole('super_admin', 'csr_head'), validate(inviteTeamSchema), async (req, res, next) => {
  try {
    const { getMe } = await import('../services/auth/index.js')
    const user = await getMe(req.user.sub)
    const data = await inviteTeam({ ...req.user, ...user }, req.validated.invites)
    return ok(res, data, 'Invitations sent')
  } catch (err) { next(err) }
})

export default router
