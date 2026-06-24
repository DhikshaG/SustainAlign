import rateLimit from 'express-rate-limit'
import { env } from '../config/env.js'

const IS_PROD = env.NODE_ENV === 'production'

const standardOpts = {
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Too many requests, please try again later' },
}

// ── Auth endpoints (login, signup, refresh, MFA) ────────────────────────────
// 10 req/min per IP in production, 60 in dev.
export const authRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: IS_PROD ? 10 : 60,
  ...standardOpts,
})

// ── General API (everything under /api except auth) ─────────────────────────
// 200 req/min per IP in production, 1000 in dev.
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: IS_PROD ? 200 : 1000,
  ...standardOpts,
})

// ── File uploads (memory-heavy) ─────────────────────────────────────────────
// 20 uploads/min per IP in production, 100 in dev.
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: IS_PROD ? 20 : 100,
  ...standardOpts,
})

// ── AI / RAG endpoints (CPU-intensive) ─────────────────────────────────────────
// 15 req/min per IP in production, 60 in dev.
export const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: IS_PROD ? 15 : 60,
  ...standardOpts,
})
