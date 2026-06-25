import { describe, it, expect } from 'vitest'

describe('frontend permissions lib', () => {
  it('getPermissionsForRole returns permissions for super_admin', async () => {
    const { getPermissionsForRole, PERMISSIONS } = await import('./permissions.js')
    const perms = getPermissionsForRole('super_admin')
    expect(perms).toContain(PERMISSIONS.PROJECTS_READ)
    expect(perms).toContain(PERMISSIONS.SETTINGS_MANAGE)
    expect(perms).not.toContain(PERMISSIONS.ADMIN_USERS)
  })

  it('getPermissionsForRole returns limited permissions for volunteer', async () => {
    const { getPermissionsForRole, PERMISSIONS } = await import('./permissions.js')
    const perms = getPermissionsForRole('volunteer')
    expect(perms).toContain(PERMISSIONS.PROJECTS_READ)
    expect(perms).not.toContain(PERMISSIONS.PROJECTS_WRITE)
    expect(perms).not.toContain(PERMISSIONS.FUNDS_RELEASE)
  })

  it('getPermissionsForRole returns empty for unknown role', async () => {
    const { getPermissionsForRole } = await import('./permissions.js')
    expect(getPermissionsForRole('unknown')).toEqual([])
  })

  it('hasPermission checks permission in array', async () => {
    const { hasPermission, PERMISSIONS } = await import('./permissions.js')
    expect(hasPermission(['projects:read', 'projects:write'], PERMISSIONS.PROJECTS_READ)).toBe(true)
    expect(hasPermission(['projects:read'], PERMISSIONS.PROJECTS_WRITE)).toBe(false)
  })

  it('hasPermission checks permission by role', async () => {
    const { hasPermission, PERMISSIONS } = await import('./permissions.js')
    expect(hasPermission('super_admin', PERMISSIONS.PROJECTS_READ)).toBe(true)
    expect(hasPermission('volunteer', PERMISSIONS.FUNDS_RELEASE)).toBe(false)
  })

  it('canAccessNavItem checks role and permission based access', async () => {
    const { canAccessNavItem } = await import('./permissions.js')
    expect(canAccessNavItem('admin', ['admin', 'super_admin'])).toBe(true)
    expect(canAccessNavItem('volunteer', ['admin', 'super_admin'])).toBe(false)
    expect(canAccessNavItem('admin', [], [], ['admin:users'])).toBe(false)
    expect(canAccessNavItem('admin', [], ['admin:users'], ['admin:users'])).toBe(true)
    expect(canAccessNavItem('admin', [], [])).toBe(true)
  })
})
