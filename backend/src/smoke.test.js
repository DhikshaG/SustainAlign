import { describe, it, expect } from 'vitest'

describe('backend smoke test', () => {
  it('should have a valid package.json', async () => {
    const pkg = await import('../package.json', { with: { type: 'json' } })
    expect(pkg).toBeDefined()
    expect(pkg.name).toBe('sustainalign-backend')
  })

  it('should export env config with defaults', async () => {
    const { env } = await import('./config/env.js')
    expect(env).toBeDefined()
    expect(env.PORT).toBeTypeOf('number')
    expect(env.NODE_ENV).toBe('test')
  })
})
