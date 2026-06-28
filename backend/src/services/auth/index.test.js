import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { eq } from 'drizzle-orm'

vi.mock('../../lib/tokens.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, generateOtp: () => '000000' }
})

const testDbPath = path.join(os.tmpdir(), `sustainalign-auth-${Date.now()}.db`)

let auth, db, schema, newId, hashPassword, hashToken, generateResetToken, createRefreshToken

beforeAll(async () => {
  process.env.DATABASE_PATH = testDbPath
  process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-characters-long!!'
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-at-least-32-chars!!!!'
  process.env.NODE_ENV = 'test'
  process.env.ACCESS_TOKEN_TTL_MINUTES = '15'
  process.env.REFRESH_TOKEN_TTL_DAYS = '7'

  const authMod = await import('./index.js')
  auth = authMod
  const dbMod = await import('../../db/index.js')
  db = dbMod.db
  const schemaMod = await import('../../db/schema.js')
  schema = schemaMod
  const idsMod = await import('../../lib/ids.js')
  newId = idsMod.newId
  const pwdMod = await import('../../lib/password.js')
  hashPassword = pwdMod.hashPassword
  const tokMod = await import('../../lib/tokens.js')
  hashToken = tokMod.hashToken
  generateResetToken = tokMod.generateResetToken
  createRefreshToken = tokMod.createRefreshToken
})

afterAll(() => {
  try {
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath)
  } catch {}
  try {
    const w = testDbPath + '-wal'
    if (fs.existsSync(w)) fs.unlinkSync(w)
  } catch {}
  try {
    const s = testDbPath + '-shm'
    if (fs.existsSync(s)) fs.unlinkSync(s)
  } catch {}
})

async function seedUser(overrides = {}) {
  const id = newId()
  const tenantId = newId()
  const now = new Date()
  await db
    .insert(schema.tenants)
    .values({
      id: tenantId,
      type: 'corporate',
      name: 'Test Corp',
      slug: `tc-${Date.now()}-${Math.random()}`,
      createdAt: now,
    })
    .run()
  await db
    .insert(schema.users)
    .values({
      id,
      email: `u-${Date.now()}-${Math.random()}@test.com`,
      passwordHash: await hashPassword('password123'),
      fullName: 'Test User',
      tenantType: 'corporate',
      mfaEnabled: false,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    })
    .run()
  await db
    .insert(schema.memberships)
    .values({
      id: newId(),
      userId: id,
      tenantId,
      role: 'admin',
      status: 'active',
      createdAt: now,
    })
    .run()
  return auth.loadUserContext(id)
}

function mockReqMeta() {
  return { ipAddress: '127.0.0.1', userAgent: 'test-agent' }
}

function uniqueEmail() {
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`
}

describe('buildUserDto', () => {
  it('returns a user DTO from context', () => {
    const dto = auth.buildUserDto({
      user: { id: 'u1', email: 'a@b.com', fullName: 'Alice', tenantType: 'corporate' },
      membership: { role: 'admin' },
      tenant: { id: 't1', name: 'Acme' },
    })
    expect(dto).toMatchObject({
      id: 'u1',
      email: 'a@b.com',
      fullName: 'Alice',
      tenantType: 'corporate',
      role: 'admin',
      tenantId: 't1',
      tenantName: 'Acme',
    })
  })
})

describe('loadUserContext', () => {
  it('returns null for non-existent user', async () => {
    expect(await auth.loadUserContext('nonexistent')).toBeNull()
  })

  it('returns user context for existing user', async () => {
    const ctx = await seedUser()
    const loaded = await auth.loadUserContext(ctx.user.id)
    expect(loaded).not.toBeNull()
    expect(loaded.user.id).toBe(ctx.user.id)
    expect(loaded.tenant.id).toBe(ctx.tenant.id)
    expect(loaded.membership.role).toBe('admin')
  })
})

describe('corporateSignup', () => {
  it('creates a corporate user and returns tokens', async () => {
    const result = await auth.corporateSignup(
      {
        email: uniqueEmail(),
        password: 'StrongPass1!',
        companyName: 'New Corp',
      },
      mockReqMeta(),
    )
    expect(result.access_token).toBeTruthy()
    expect(result.refresh_token).toBeTruthy()
    expect(result.token_type).toBe('Bearer')
    expect(result.user.tenantType).toBe('corporate')
    expect(result.user.role).toBe('super_admin')
  })

  it('throws 409 for duplicate email', async () => {
    const email = uniqueEmail()
    await auth.corporateSignup({ email, password: 'Pass1!', companyName: 'Dup' }, mockReqMeta())
    await expect(
      auth.corporateSignup({ email, password: 'Pass1!', companyName: 'Dup' }, mockReqMeta()),
    ).rejects.toMatchObject({ message: 'An account with this email already exists', status: 409 })
  })

  it('returns MFA challenge when mfaEnabled is true', async () => {
    const result = await auth.corporateSignup(
      {
        email: uniqueEmail(),
        password: 'Pass1!',
        companyName: 'MFA Corp',
        enableMfa: true,
      },
      mockReqMeta(),
    )
    expect(result.requiresMfa).toBe(true)
    expect(result.mfaSessionId).toBeTruthy()
  })
})

describe('loginUser', () => {
  it('returns tokens for valid credentials', async () => {
    const ctx = await seedUser()
    const result = await auth.loginUser(ctx.user.email, 'password123', mockReqMeta())
    expect(result.access_token).toBeTruthy()
    expect(result.refresh_token).toBeTruthy()
  })

  it('throws 401 for invalid password', async () => {
    const ctx = await seedUser()
    await expect(auth.loginUser(ctx.user.email, 'wrongpass', mockReqMeta())).rejects.toMatchObject({
      message: 'Invalid email or password',
      status: 401,
    })
  })

  it('throws 401 for non-existent email', async () => {
    await expect(auth.loginUser('noone@test.com', 'password123', mockReqMeta())).rejects.toMatchObject({
      message: 'Invalid email or password',
      status: 401,
    })
  })

  it('returns MFA challenge when user has MFA enabled', async () => {
    const ctx = await seedUser({ mfaEnabled: true })
    const result = await auth.loginUser(ctx.user.email, 'password123', mockReqMeta())
    expect(result.requiresMfa).toBe(true)
    expect(result.mfaSessionId).toBeTruthy()
  })
})

describe('verifyMfa', () => {
  it('verifies MFA code and returns tokens', async () => {
    const signup = await auth.corporateSignup(
      {
        email: uniqueEmail(),
        password: 'Pass1!',
        companyName: 'MFA Verify',
        enableMfa: true,
      },
      mockReqMeta(),
    )
    expect(signup.requiresMfa).toBe(true)
    const sid = signup.mfaSessionId

    const challenge = await db.select().from(schema.mfaChallenges).where(eq(schema.mfaChallenges.id, sid)).get()
    expect(challenge).not.toBeNull()

    const result = await auth.verifyMfa(sid, '000000', mockReqMeta())
    expect(result.access_token).toBeTruthy()
    expect(result.refresh_token).toBeTruthy()
  })

  it('throws for invalid MFA code', async () => {
    const signup = await auth.corporateSignup(
      {
        email: uniqueEmail(),
        password: 'Pass1!',
        companyName: 'MFA Bad',
        enableMfa: true,
      },
      mockReqMeta(),
    )
    await expect(auth.verifyMfa(signup.mfaSessionId, '111111', mockReqMeta())).rejects.toMatchObject({
      message: 'Invalid or expired verification code',
      status: 400,
    })
  })

  it('throws for consumed MFA challenge', async () => {
    const signup = await auth.corporateSignup(
      {
        email: uniqueEmail(),
        password: 'Pass1!',
        companyName: 'MFA Consumed',
        enableMfa: true,
      },
      mockReqMeta(),
    )
    const sid = signup.mfaSessionId
    await auth.verifyMfa(sid, '000000', mockReqMeta())
    await expect(auth.verifyMfa(sid, '000000', mockReqMeta())).rejects.toMatchObject({
      message: 'Invalid or expired verification code',
      status: 400,
    })
  })
})

describe('forgotPassword', () => {
  it('returns ok even for unknown email', async () => {
    const result = await auth.forgotPassword('unknown@test.com')
    expect(result).toEqual({ ok: true })
  })

  it('creates reset token and sends email for known email', async () => {
    const ctx = await seedUser()
    const result = await auth.forgotPassword(ctx.user.email)
    expect(result).toEqual({ ok: true })
  })
})

describe('resetPassword', () => {
  it('resets password with valid token', async () => {
    const ctx = await seedUser()
    const token = generateResetToken()
    const tHash = hashToken(token)
    await db
      .insert(schema.passwordResetTokens)
      .values({
        id: newId(),
        userId: ctx.user.id,
        tokenHash: tHash,
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
        usedAt: null,
      })
      .run()
    const result = await auth.resetPassword(token, 'NewPass123!')
    expect(result).toEqual({ ok: true })
  })

  it('throws for invalid token', async () => {
    await expect(auth.resetPassword('invalid-token', 'NewPass123!')).rejects.toMatchObject({
      message: 'Invalid or expired reset token',
      status: 400,
    })
  })
})

describe('refreshSession', () => {
  it('returns new tokens for valid refresh token', async () => {
    const ctx = await seedUser()
    const { token: rt, jti, expiresAt } = await createRefreshToken({ sub: ctx.user.id })
    await db
      .insert(schema.refreshTokens)
      .values({
        id: newId(),
        userId: ctx.user.id,
        jti,
        expiresAt,
        userAgent: null,
        ipAddress: null,
        createdAt: new Date(),
      })
      .run()
    const result = await auth.refreshSession(rt, mockReqMeta())
    expect(result.access_token).toBeTruthy()
    expect(result.refresh_token).toBeTruthy()
    expect(result.refresh_token).not.toBe(rt)
  })

  it('throws 401 for invalid refresh token', async () => {
    await expect(auth.refreshSession('invalid-token', mockReqMeta())).rejects.toMatchObject({
      message: 'Invalid refresh token',
      status: 401,
    })
  })
})

describe('logout', () => {
  it('revokes refresh token', async () => {
    const ctx = await seedUser()
    const { token: rt, jti, expiresAt } = await createRefreshToken({ sub: ctx.user.id })
    await db
      .insert(schema.refreshTokens)
      .values({
        id: newId(),
        userId: ctx.user.id,
        jti,
        expiresAt,
        userAgent: null,
        ipAddress: null,
        createdAt: new Date(),
      })
      .run()
    const result = await auth.logout(rt, mockReqMeta())
    expect(result).toEqual({ ok: true })
  })

  it('succeeds with no token', async () => {
    expect(await auth.logout(null)).toEqual({ ok: true })
    expect(await auth.logout(undefined)).toEqual({ ok: true })
    expect(await auth.logout('')).toEqual({ ok: true })
  })
})

describe('getMe', () => {
  it('returns user DTO for existing user', async () => {
    const ctx = await seedUser()
    const result = await auth.getMe(ctx.user.id)
    expect(result.id).toBe(ctx.user.id)
    expect(result.email).toBe(ctx.user.email)
  })

  it('throws 404 for non-existent user', async () => {
    await expect(auth.getMe('nonexistent')).rejects.toMatchObject({ message: 'User not found', status: 404 })
  })
})
