import rateLimit from 'express-rate-limit'

export const authRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Too many requests, please try again later' },
})
