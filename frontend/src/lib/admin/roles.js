export const ADMIN_ROLES = ['platform_super_admin']

export function canAccessAdminNavItem(role, itemRoles) {
  if (!itemRoles?.length) return true
  return itemRoles.includes(role)
}
