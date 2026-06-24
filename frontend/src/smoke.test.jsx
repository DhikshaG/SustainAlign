import { describe, it, expect } from 'vitest'

describe('frontend smoke test', () => {
  it('should have a valid package.json', async () => {
    const pkg = await import('../package.json', { with: { type: 'json' } })
    expect(pkg).toBeDefined()
    expect(pkg.name).toBe('frontend')
  })

  it('should export App component', async () => {
    const { default: App } = await import('./App.jsx')
    expect(App).toBeDefined()
    expect(typeof App).toBe('function')
  })

  it('should export api utility', async () => {
    const { api } = await import('./lib/api.js')
    expect(api).toBeDefined()
    expect(api.get).toBeDefined()
    expect(api.post).toBeDefined()
  })
})
