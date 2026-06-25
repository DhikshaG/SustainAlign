import { describe, it, expect, vi } from 'vitest'

vi.mock('../config/env.js', () => ({
  env: { NODE_ENV: 'test', LOG_LEVEL: 'silent' },
}))

describe('logger', () => {
  it('exports a logger instance', async () => {
    const { logger } = await import('./logger.js')
    expect(logger).toBeDefined()
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.error).toBe('function')
    expect(typeof logger.warn).toBe('function')
  })

  it('exports createRequestLogger', async () => {
    const { createRequestLogger } = await import('./logger.js')
    expect(typeof createRequestLogger).toBe('function')
    const middleware = createRequestLogger()
    expect(typeof middleware).toBe('function')
    expect(middleware.length).toBe(3)
  })
})
