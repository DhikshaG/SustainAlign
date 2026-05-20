export const NGO_ROLES = ['ngo_admin']

export function canAccessNgoNavItem(role, itemRoles) {
  if (!itemRoles?.length) return true
  return itemRoles.includes(role)
}
