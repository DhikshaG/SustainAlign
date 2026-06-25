import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'

const testDbPath = path.join(os.tmpdir(), `sustainalign-auth-int-${Date.now()}.db`)

let request

beforeAll(async () => {
  process.env.DATABASE_PATH = testDbPath
  process.env.JWT_SECRET = 'int-test-jwt-secret-at-least-32-characters!!'
  process.env.JWT_REFRESH_SECRET = 'int-test-refresh-secret-at-least-32-chars!'
  process.env.NODE_ENV = 'test'
  process.env.ACCESS_TOKEN_TTL_MINUTES = '15'
  process.env.REFRESH_TOKEN_TTL_DAYS = '7'

  const supertest = await import('supertest')
  const { createApp } = await import('../server.js')
  request = supertest.default(createApp())
})

afterAll(() => {
  try { if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath) } catch {}
  try { const w = testDbPath + '-wal'; if (fs.existsSync(w)) fs.unlinkSync(w) } catch {}
  try { const s = testDbPath + '-shm'; if (fs.existsSync(s)) fs.unlinkSync(s) } catch {}
})

describe('POST /api/auth/corporate/signup', () => {
  const email = `int-signup-${Date.now()}@test.com`

  it('creates a corporate account', async () => {
    const res = await request
      .post('/api/auth/corporate/signup')
      .send({ email, password: 'StrongPass1!', companyName: 'Int Test Corp', acceptTerms: true })
    expect(res.status).toBe(201)
    expect(res.body.ok).toBe(true)
    expect(res.body.data.access_token).toBeTruthy()
    expect(res.body.data.refresh_token).toBeTruthy()
    expect(res.body.data.user.tenantType).toBe('corporate')
    expect(res.body.data.user.role).toBe('super_admin')
  })

  it('rejects duplicate email with 409', async () => {
    const res = await request
      .post('/api/auth/corporate/signup')
      .send({ email, password: 'StrongPass1!', companyName: 'Int Test Corp', acceptTerms: true })
    expect(res.status).toBe(409)
    expect(res.body.ok).toBe(false)
    expect(res.body.message).toContain('already exists')
  })

  it('rejects invalid payload with 400', async () => {
    const res = await request
      .post('/api/auth/corporate/signup')
      .send({ email: 'not-an-email' })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/corporate/login', () => {
  const email = `int-login-${Date.now()}@test.com`

  beforeAll(async () => {
    await request
      .post('/api/auth/corporate/signup')
      .send({ email, password: 'StrongPass1!', companyName: 'Login Corp', acceptTerms: true })
  })

  it('logs in with valid credentials', async () => {
    const res = await request
      .post('/api/auth/corporate/login')
      .send({ email, password: 'StrongPass1!' })
    expect(res.status).toBe(200)
    expect(res.body.data.access_token).toBeTruthy()
    expect(res.body.data.refresh_token).toBeTruthy()
  })

  it('rejects invalid password with 401', async () => {
    const res = await request
      .post('/api/auth/corporate/login')
      .send({ email, password: 'wrongpass' })
    expect(res.status).toBe(401)
  })
})

describe('POST /api/auth/refresh', () => {
  let refreshToken

  beforeAll(async () => {
    const res = await request
      .post('/api/auth/corporate/signup')
      .send({ email: `int-refresh-${Date.now()}@test.com`, password: 'StrongPass1!', companyName: 'Refresh Corp', acceptTerms: true })
    refreshToken = res.body.data.refresh_token
  })

  it('refreshes tokens', async () => {
    const res = await request
      .post('/api/auth/refresh')
      .send({ refresh_token: refreshToken })
    expect(res.status).toBe(200)
    expect(res.body.data.access_token).toBeTruthy()
    expect(res.body.data.refresh_token).toBeTruthy()
  })

  it('rejects missing refresh token', async () => {
    const res = await request.post('/api/auth/refresh').send({})
    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/logout', () => {
  let refreshToken

  beforeAll(async () => {
    const res = await request
      .post('/api/auth/corporate/signup')
      .send({ email: `int-logout-${Date.now()}@test.com`, password: 'StrongPass1!', companyName: 'Logout Corp', acceptTerms: true })
    refreshToken = res.body.data.refresh_token
  })

  it('logs out successfully', async () => {
    const res = await request
      .post('/api/auth/logout')
      .send({ refresh_token: refreshToken })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })
})

describe('GET /api/auth/me', () => {
  let accessToken

  beforeAll(async () => {
    const res = await request
      .post('/api/auth/corporate/signup')
      .send({ email: `int-me-${Date.now()}@test.com`, password: 'StrongPass1!', companyName: 'Me Corp', acceptTerms: true })
    accessToken = res.body.data.access_token
  })

  it('returns user profile', async () => {
    const res = await request
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data.email).toBeTruthy()
  })

  it('rejects without auth header', async () => {
    const res = await request.get('/api/auth/me')
    expect(res.status).toBe(401)
  })
})

describe('POST /api/auth/corporate/forgot-password', () => {
  it('returns ok for known email', async () => {
    const email = `int-forgot-${Date.now()}@test.com`
    await request
      .post('/api/auth/corporate/signup')
      .send({ email, password: 'StrongPass1!', companyName: 'Forgot Corp', acceptTerms: true })
    const res = await request
      .post('/api/auth/corporate/forgot-password')
      .send({ email })
    expect(res.status).toBe(200)
  })

  it('returns ok even for unknown email (no leak)', async () => {
    const res = await request
      .post('/api/auth/corporate/forgot-password')
      .send({ email: 'nobody@test.com' })
    expect(res.status).toBe(200)
  })
})

describe('POST /api/auth/corporate/reset-password', () => {
  it('rejects invalid token with 400', async () => {
    const res = await request
      .post('/api/auth/corporate/reset-password')
      .send({ token: 'bad-token', password: 'NewPass123!', confirmPassword: 'NewPass123!' })
    expect(res.status).toBe(400)
  })
})

describe('GET /api/health', () => {
  it('returns healthy', async () => {
    const res = await request.get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.status).toBe('healthy')
  })
})
