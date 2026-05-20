import { decodeAccessToken } from '../lib/tokens.js'

export async function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, message: 'Authentication required' })
  }

  try {
    const token = header.slice(7)
    const payload = await decodeAccessToken(token)
    req.user = {
      sub: payload.sub,
      tenantId: payload.tenantId,
      tenantType: payload.tenantType,
      role: payload.role,
    }
    next()
  } catch {
    return res.status(401).json({ ok: false, message: 'Invalid or expired token' })
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ ok: false, message: 'Authentication required' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ ok: false, message: 'Insufficient permissions' })
    }
    next()
  }
}

export function reqMeta(req) {
  return {
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
  }
}
