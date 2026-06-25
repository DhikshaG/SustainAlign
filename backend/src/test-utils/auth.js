import { env } from '../config/env.js'
import { createAccessToken } from '../lib/tokens.js'

export const TEST_USER = {
  sub: 'test-user-id',
  tenantId: 'test-corp-tenant',
  tenantType: 'corporate',
  role: 'super_admin',
}

export const TEST_NGO_USER = {
  sub: 'test-ngo-user-id',
  tenantId: 'test-ngo-tenant',
  tenantType: 'ngo',
  role: 'ngo_admin',
}

export const TEST_ADMIN_USER = {
  sub: 'test-admin-id',
  tenantId: 'test-platform-tenant',
  tenantType: 'platform',
  role: 'platform_super_admin',
}

export function fakeAuth(userOverrides = {}) {
  const user = { ...TEST_USER, ...userOverrides }
  return (req, _res, next) => {
    req.user = user
    next()
  }
}

export async function createTestAuthToken(userOverrides = {}) {
  const user = { ...TEST_USER, ...userOverrides }
  return createAccessToken({
    sub: user.sub,
    tenantId: user.tenantId,
    tenantType: user.tenantType,
    role: user.role,
  })
}
