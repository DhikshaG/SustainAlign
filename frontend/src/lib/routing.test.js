import { describe, it, expect } from 'vitest'

describe('routing lib', () => {
  it('getDashboardPath returns correct path for corporate', async () => {
    const { getDashboardPath } = await import('./routing.js')
    const path = getDashboardPath('corporate')
    expect(path).toBeTruthy()
    expect(typeof path).toBe('string')
  })

  it('getDashboardPath returns correct path for ngo', async () => {
    const { getDashboardPath } = await import('./routing.js')
    const path = getDashboardPath('ngo')
    expect(path).toBeTruthy()
    expect(path).not.toBe(getDashboardPath('corporate'))
  })

  it('getDashboardPath returns corporate as default for unknown type', async () => {
    const { getDashboardPath } = await import('./routing.js')
    expect(getDashboardPath('unknown')).toBe(getDashboardPath('corporate'))
  })

  it('getLoginPath returns login paths', async () => {
    const { getLoginPath } = await import('./routing.js')
    expect(getLoginPath('corporate')).toBeTruthy()
    expect(getLoginPath('ngo')).toBeTruthy()
  })

  it('getDashboardPathForUser handles null user', async () => {
    const { getDashboardPathForUser } = await import('./routing.js')
    expect(getDashboardPathForUser(null)).toBeTruthy()
    expect(getDashboardPathForUser(undefined)).toBeTruthy()
  })

  it('getDashboardPathForUser returns path based on tenantType', async () => {
    const { getDashboardPathForUser } = await import('./routing.js')
    const path = getDashboardPathForUser({ tenantType: 'ngo' })
    expect(path).toBeTruthy()
  })
})
