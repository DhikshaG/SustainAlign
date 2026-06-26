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

  it('should generate OpenAPI spec with all routes', async () => {
    const { generateSpec } = await import('./openapi/index.js')
    const spec = generateSpec()
    expect(spec).toBeDefined()
    expect(spec.openapi).toBe('3.0.3')
    expect(Object.keys(spec.paths).length).toBeGreaterThan(100)
    expect(spec.components.securitySchemes.bearerAuth).toBeDefined()
    expect(spec.security).toBeDefined()
    expect(spec.tags.length).toBeGreaterThan(10)
  })
})
