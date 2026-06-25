import { env } from '../config/env.js'
import { logger } from '../lib/logger.js'

function isOperational(err) {
  return typeof err?.status === 'number' && err.status >= 400 && err.status < 500
}

export function notFound(req, res) {
  return res.status(404).json({ ok: false, message: 'Route not found' })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const status = typeof err?.status === 'number' ? err.status : 500

  const logData = {
    requestId: req.id,
    status,
    method: req.method,
    path: req.path,
    err,
  }

  if (req.log) {
    req.log.error(logData, err?.message || 'Request failed')
  } else {
    logger.error(logData, err?.message || 'Request failed')
  }

  if (isOperational(err)) {
    return res.status(status).json({
      ok: false,
      message: err.message || 'Request failed',
      errors: err.errors || undefined,
    })
  }

  return res.status(status).json({
    ok: false,
    message: env.NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Internal server error',
    errors: env.NODE_ENV === 'production' ? undefined : err.errors,
  })
}
