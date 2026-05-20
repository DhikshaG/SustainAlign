import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { ok, created } from '../lib/response.js'
import {
  corporateSignupSchema,
  corporateLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  mfaVerifySchema,
  inviteTeamSchema,
} from '../schemas/auth.corporate.js'

const router = Router()

router.post('/signup', validate(corporateSignupSchema), (req, res) => {
  console.log('[stub] corporate signup:', req.validated.email)
  return created(res, { userId: 'stub-user-id', enableMfa: req.validated.enableMfa }, 'Account created (stub)')
})

router.post('/login', validate(corporateLoginSchema), (req, res) => {
  console.log('[stub] corporate login:', req.validated.email)
  return ok(res, { requiresMfa: false, accessToken: 'stub-access-token' }, 'Login successful (stub)')
})

router.post('/forgot-password', validate(forgotPasswordSchema), (req, res) => {
  console.log('[stub] forgot password:', req.validated.email)
  return ok(res, null, 'If the account exists, a reset link has been sent (stub)')
})

router.post('/reset-password', validate(resetPasswordSchema), (req, res) => {
  console.log('[stub] reset password for token:', req.validated.token?.slice(0, 8))
  return ok(res, null, 'Password reset successful (stub)')
})

router.post('/mfa/verify', validate(mfaVerifySchema), (req, res) => {
  console.log('[stub] mfa verify code:', req.validated.code)
  return ok(res, { verified: true }, 'MFA verified (stub)')
})

router.post('/invite-team', validate(inviteTeamSchema), (req, res) => {
  console.log('[stub] invite team:', req.validated.invites.length, 'invites')
  return ok(res, { sent: req.validated.invites.length }, 'Invitations sent (stub)')
})

export default router
