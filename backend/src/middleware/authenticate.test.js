import { describe, it, expect, vi } from 'vitest'

vi.mock('../lib/tokens.js', () => ({
  decodeAccessToken: vi.fn(),
}))

const { decodeAccessToken } = await import('../lib/tokens.js')
const { authenticate, requireRole, reqMeta } = await import('./authenticate.js')

function mockReq(headers = {}, body) {
  return { headers, body, ip: '127.0.0.1' }
}
function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  }
}
function mockNext() {
  return vi.fn()
}

describe('authenticate middleware', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 401 if no authorization header', async () => {
    const req = mockReq({})
    const res = mockRes()
    const next = mockNext()
    await authenticate(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ ok: false, message: 'Authentication required' })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 if header is not Bearer', async () => {
    const req = mockReq({ authorization: 'Basic token123' })
    const res = mockRes()
    const next = mockNext()
    await authenticate(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next with user payload for valid token', async () => {
    decodeAccessToken.mockResolvedValue({ sub: 'u1', tenantId: 't1', tenantType: 'corporate', role: 'admin' })
    const req = mockReq({ authorization: 'Bearer valid-token' })
    const res = mockRes()
    const next = mockNext()
    await authenticate(req, res, next)
    expect(req.user).toMatchObject({ sub: 'u1', tenantId: 't1', tenantType: 'corporate', role: 'admin' })
    expect(next).toHaveBeenCalled()
  })

  it('returns 401 for invalid token', async () => {
    decodeAccessToken.mockRejectedValue(new Error('bad token'))
    const req = mockReq({ authorization: 'Bearer bad-token' })
    const res = mockRes()
    const next = mockNext()
    await authenticate(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ ok: false, message: 'Invalid or expired token' })
    expect(next).not.toHaveBeenCalled()
  })
})

describe('requireRole', () => {
  it('returns 401 if no user on request', () => {
    const req = mockReq()
    const res = mockRes()
    const next = mockNext()
    requireRole('admin')(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 403 if user role not in allowed roles', () => {
    const req = mockReq()
    req.user = { role: 'viewer' }
    const res = mockRes()
    const next = mockNext()
    requireRole('admin', 'super_admin')(req, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ ok: false, message: 'Insufficient permissions' })
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next if user role is allowed', () => {
    const req = mockReq()
    req.user = { role: 'admin' }
    const res = mockRes()
    const next = mockNext()
    requireRole('admin', 'super_admin')(req, res, next)
    expect(next).toHaveBeenCalled()
  })
})

describe('reqMeta', () => {
  it('extracts user-agent and ip from request', () => {
    const req = mockReq({ 'user-agent': 'TestAgent/1.0' })
    const meta = reqMeta(req)
    expect(meta).toEqual({ userAgent: 'TestAgent/1.0', ipAddress: '127.0.0.1' })
  })
})
