import { canAccessNavItem } from '../permissions'

export const NGO_ROLES = ['ngo_admin', 'field_officer']

export function canAccessNgoNavItem(role, itemRoles, userPermissions = [], itemPermissions = []) {
  return canAccessNavItem(role, itemRoles, userPermissions, itemPermissions)
}
