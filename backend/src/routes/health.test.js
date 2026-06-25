import { describe, it, expect, vi, beforeAll } from 'vitest'

vi.mock('../db/index.js', () => ({
  sqlite: {
    prepare: vi.fn(() => ({ get: vi.fn(() => ({})) })),
  },
}))

vi.mock('../lib/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
  createRequestLogger: () => (req, res, next) => next(),
}))

vi.mock('../config/env.js', () => ({
  env: { NODE_ENV: 'test', LOG_LEVEL: 'silent' },
}))

vi.mock('@sentry/node', () => ({
  init: vi.fn(),
  Handlers: { requestHandler: () => vi.fn(), errorHandler: () => vi.fn() },
}))

import { createApp } from '../server.js'
import supertest from 'supertest'

describe('GET /api/health', () => {
  let app

  beforeAll(() => {
    app = createApp()
  })

  it('returns 200 with ok:true and status healthy', async () => {
    const res = await supertest(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.status).toBe('healthy')
  })

  it('includes checks object with db, memory, disk, uptime, version', async () => {
    const res = await supertest(app).get('/api/health')
    expect(res.body.checks).toBeDefined()
    expect(res.body.checks.db).toBeDefined()
    expect(res.body.checks.memory).toBeDefined()
    expect(res.body.checks.disk).toBeDefined()
    expect(res.body.checks.uptime).toBeDefined()
    expect(res.body.checks.version).toBeDefined()
    expect(res.body.timestamp).toBeDefined()
  })

  it('reports db check as connected', async () => {
    const res = await supertest(app).get('/api/health')
    expect(res.body.checks.db.ok).toBe(true)
    expect(res.body.checks.db.status).toBe('connected')
  })
})
