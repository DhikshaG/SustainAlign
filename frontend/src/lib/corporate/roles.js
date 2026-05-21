export const CORPORATE_ROLES = [
  'super_admin',
  'csr_head',
  'esg_head',
  'finance',
  'compliance',
  'volunteer',
  'board',
]

export function isReadOnlyRole(role) {
  return role === 'board'
}

import { canAccessNavItem as canAccess } from '../permissions'

export function canAccessNavItem(role, itemRoles, userPermissions = [], itemPermissions = []) {
  return canAccess(role, itemRoles, userPermissions, itemPermissions)
}
