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

export function canAccessNavItem(role, itemRoles) {
  if (!itemRoles?.length) return true
  return itemRoles.includes(role)
}
