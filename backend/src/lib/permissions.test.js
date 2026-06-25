import { describe, it, expect } from 'vitest'
import { PERMISSIONS, getPermissionsForRole, hasPermission, hasAnyPermission, getPermissionMatrix, CORPORATE_ROLES, NGO_ROLES, PLATFORM_ROLES } from './permissions.js'

describe('permissions', () => {
  describe('PERMISSIONS', () => {
    it('defines all expected permission constants', () => {
      expect(PERMISSIONS.PROJECTS_READ).toBe('projects:read')
      expect(PERMISSIONS.PROJECTS_WRITE).toBe('projects:write')
      expect(PERMISSIONS.FUNDS_RELEASE).toBe('funds:release')
      expect(PERMISSIONS.COMPLIANCE_READ).toBe('compliance:read')
      expect(PERMISSIONS.ADMIN_VERIFY_NGO).toBe('admin:verify_ngo')
      expect(Object.keys(PERMISSIONS).length).toBeGreaterThanOrEqual(40)
    })
  })

  describe('CORPORATE_ROLES', () => {
    it('includes all corporate roles', () => {
      expect(CORPORATE_ROLES).toContain('super_admin')
      expect(CORPORATE_ROLES).toContain('csr_head')
      expect(CORPORATE_ROLES).toContain('finance')
      expect(CORPORATE_ROLES).toContain('compliance')
      expect(CORPORATE_ROLES).toContain('volunteer')
      expect(CORPORATE_ROLES).toContain('board')
    })
  })

  describe('NGO_ROLES', () => {
    it('includes ngo roles', () => {
      expect(NGO_ROLES).toContain('ngo_admin')
      expect(NGO_ROLES).toContain('field_officer')
    })
  })

  describe('PLATFORM_ROLES', () => {
    it('includes platform admin role', () => {
      expect(PLATFORM_ROLES).toContain('platform_super_admin')
    })
  })

  describe('getPermissionsForRole', () => {
    it('super_admin has all permissions', () => {
      const perms = getPermissionsForRole('super_admin')
      expect(perms).toContain(PERMISSIONS.PROJECTS_READ)
      expect(perms).toContain(PERMISSIONS.PROJECTS_APPROVE)
      expect(perms).toContain(PERMISSIONS.FUNDS_RELEASE)
      expect(perms).toContain(PERMISSIONS.SETTINGS_MANAGE)
    })

    it('volunteer has limited permissions', () => {
      const perms = getPermissionsForRole('volunteer')
      expect(perms).toContain(PERMISSIONS.VOLUNTEERS_MANAGE)
      expect(perms).not.toContain(PERMISSIONS.FUNDS_RELEASE)
      expect(perms).not.toContain(PERMISSIONS.SETTINGS_MANAGE)
    })

    it('board has read-only permissions', () => {
      const perms = getPermissionsForRole('board')
      expect(perms).toContain(PERMISSIONS.PROJECTS_READ)
      expect(perms).toContain(PERMISSIONS.IMPACT_READ)
      expect(perms).toContain(PERMISSIONS.COMPLIANCE_READ)
      expect(perms).not.toContain(PERMISSIONS.PROJECTS_WRITE)
    })

    it('ngo_admin has ngo-specific permissions', () => {
      const perms = getPermissionsForRole('ngo_admin')
      expect(perms).toContain(PERMISSIONS.NGO_PROFILE_WRITE)
      expect(perms).toContain(PERMISSIONS.BENEFICIARIES_MANAGE)
      expect(perms).toContain(PERMISSIONS.NGO_EVIDENCE_UPLOAD)
      expect(perms).not.toContain(PERMISSIONS.COMPLIANCE_READ)
    })

    it('field_officer has subset of ngo permissions', () => {
      const perms = getPermissionsForRole('field_officer')
      expect(perms).toContain(PERMISSIONS.BENEFICIARIES_MANAGE)
      expect(perms).toContain(PERMISSIONS.NGO_EVIDENCE_UPLOAD)
      expect(perms).not.toContain(PERMISSIONS.SETTINGS_MANAGE)
      expect(perms).not.toContain(PERMISSIONS.NGO_PROFILE_WRITE)
    })

    it('platform_super_admin has admin permissions', () => {
      const perms = getPermissionsForRole('platform_super_admin')
      expect(perms).toContain(PERMISSIONS.ADMIN_USERS)
      expect(perms).toContain(PERMISSIONS.ADMIN_VERIFY_NGO)
      expect(perms).toContain(PERMISSIONS.ADMIN_FRAUD_READ)
      expect(perms).toContain(PERMISSIONS.ADMIN_ANALYTICS_READ)
    })

    it('unknown role returns empty array', () => {
      const perms = getPermissionsForRole('nonexistent')
      expect(perms).toEqual([])
    })
  })

  describe('hasPermission', () => {
    it('returns true when role has the permission', () => {
      expect(hasPermission('super_admin', PERMISSIONS.FUNDS_RELEASE)).toBe(true)
    })

    it('returns false when role lacks the permission', () => {
      expect(hasPermission('volunteer', PERMISSIONS.FUNDS_RELEASE)).toBe(false)
    })
  })

  describe('hasAnyPermission', () => {
    it('returns true when role has any of the permissions', () => {
      expect(hasAnyPermission('volunteer', [PERMISSIONS.FUNDS_RELEASE, PERMISSIONS.VOLUNTEERS_MANAGE])).toBe(true)
    })

    it('returns false when role has none of the permissions', () => {
      expect(hasAnyPermission('board', [PERMISSIONS.FUNDS_RELEASE, PERMISSIONS.NGO_PROFILE_WRITE])).toBe(false)
    })
  })

  describe('getPermissionMatrix', () => {
    it('returns an array of module-permission rows', () => {
      const matrix = getPermissionMatrix()
      expect(Array.isArray(matrix)).toBe(true)
      expect(matrix.length).toBeGreaterThanOrEqual(6)
    })

    it('each row has a module name and role booleans', () => {
      const matrix = getPermissionMatrix()
      const row = matrix[0]
      expect(row).toHaveProperty('module')
      expect(row).toHaveProperty('super_admin')
      expect(row).toHaveProperty('volunteer')
      expect(typeof row.super_admin).toBe('boolean')
    })

    it('super_admin has access to all modules', () => {
      const matrix = getPermissionMatrix()
      matrix.forEach((row) => {
        expect(row.super_admin).toBe(true)
      })
    })

    it('volunteer only has access to Dashboard', () => {
      const matrix = getPermissionMatrix()
      const dashboardRow = matrix.find((r) => r.module === 'Dashboard')
      const settingsRow = matrix.find((r) => r.module === 'Settings')
      expect(dashboardRow.volunteer).toBe(true)
      expect(settingsRow.volunteer).toBe(false)
    })
  })
})
