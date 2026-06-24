import { env } from '../config/env.js'

// Operational (safe-to-expose) errors are 4xx and carry an explicit status.
// Anything else is treated as an unexpected internal error: we never leak its
// message or stack to the client in production.
function isOperational(err) {
  return typeof err?.status === 'number' && err.status >= 400 && err.status < 500
}

export function notFound(req, res) {
  return res.status(404).json({ ok: false, message: 'Route not found' })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const status = typeof err?.status === 'number' ? err.status : 500

  // Always log server-side. In development, include the full object.
  const requestId = req.id
  if (env.NODE_ENV === 'production') {
    // Structured, PII-light line. Stack traces stay server-side only.
    console.error(JSON.stringify({
      level: 'error',
      requestId,
      status,
      method: req.method,
      path: req.path,
      message: err?.message,
      name: err?.name,
    }))
  } else {
    console.error(`[req ${requestId ?? '-'}] ${req.method} ${req.path} → ${status}`, err)
  }

  if (isOperational(err)) {
    // Client-facing errors (validation, auth, not-found thrown by handlers).
    return res.status(status).json({
      ok: false,
      message: err.message || 'Request failed',
      errors: err.errors || undefined,
    })
  }

  // Unexpected errors: never leak internals in production.
  return res.status(status).json({
    ok: false,
    message: env.NODE_ENV === 'production'
      ? 'Internal server error'
      : (err.message || 'Internal server error'),
    errors: env.NODE_ENV === 'production' ? undefined : err.errors,
  })
}
