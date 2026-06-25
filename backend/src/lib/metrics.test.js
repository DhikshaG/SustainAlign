import { describe, it, expect, vi } from 'vitest'

vi.mock('../config/env.js', () => ({
  env: { PROMETHEUS_ENABLED: 'true' },
}))

describe('metrics lib', () => {
  it('isMetricsEnabled returns true when PROMETHEUS_ENABLED is truthy', async () => {
    const { isMetricsEnabled } = await import('./metrics.js')
    expect(isMetricsEnabled()).toBe(true)
  })

  it('exports expected functions', async () => {
    const mod = await import('./metrics.js')
    expect(typeof mod.metricsMiddleware).toBe('function')
    expect(typeof mod.metricsRoute).toBe('function')
    expect(typeof mod.setActiveTenants).toBe('function')
    expect(typeof mod.observeDbQuery).toBe('function')
  })
})
