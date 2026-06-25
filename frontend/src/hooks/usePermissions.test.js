import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const { useAuth } = await import('../context/AuthContext')

describe('usePermissions', () => {
  it('returns permissions from user.role when no explicit permissions', async () => {
    useAuth.mockReturnValue({ user: { role: 'super_admin' } })
    const { usePermissions } = await import('./usePermissions.js')
    const { result } = renderHook(() => usePermissions())
    expect(result.current.permissions).toContain('projects:read')
    expect(result.current.role).toBe('super_admin')
    expect(result.current.hasPermission('projects:read')).toBe(true)
    expect(result.current.hasPermission('nonexistent')).toBe(false)
  })

  it('returns permissions from user.permissions when available', async () => {
    useAuth.mockReturnValue({ user: { role: 'admin', permissions: ['custom:perm'] } })
    const { usePermissions } = await import('./usePermissions.js')
    const { result } = renderHook(() => usePermissions())
    expect(result.current.permissions).toEqual(['custom:perm'])
    expect(result.current.hasPermission('custom:perm')).toBe(true)
  })

  it('hasAnyPermission returns true if any permission matches', async () => {
    useAuth.mockReturnValue({ user: { role: 'super_admin' } })
    const { usePermissions } = await import('./usePermissions.js')
    const { result } = renderHook(() => usePermissions())
    expect(result.current.hasAnyPermission('projects:read', 'nonexistent')).toBe(true)
    expect(result.current.hasAnyPermission('nonexistent1', 'nonexistent2')).toBe(false)
  })

  it('returns empty permissions when no user', async () => {
    useAuth.mockReturnValue({ user: null })
    const { usePermissions } = await import('./usePermissions.js')
    const { result } = renderHook(() => usePermissions())
    expect(result.current.permissions).toEqual([])
    expect(result.current.hasPermission('projects:read')).toBe(false)
  })
})
