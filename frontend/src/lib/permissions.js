/** Mirror of backend/src/lib/permissions.js — keep in sync */

export const PERMISSIONS = {
  PROJECTS_READ: 'projects:read',
  PROJECTS_WRITE: 'projects:write',
  PROJECTS_APPROVE: 'projects:approve',
  FUNDS_READ: 'funds:read',
  FUNDS_RELEASE: 'funds:release',
  COMPLIANCE_READ: 'compliance:read',
  COMPLIANCE_EXPORT: 'compliance:export',
  DISCOVERY_READ: 'discovery:read',
  REPORTING_READ: 'reporting:read',
  COPILOT_USE: 'copilot:use',
  VOLUNTEERS_MANAGE: 'volunteers:manage',
  DOCUMENTS_READ: 'documents:read',
  COMMUNICATIONS_READ: 'communications:read',
  SETTINGS_MANAGE: 'settings:manage',
  NGO_PROFILE_WRITE: 'ngo:profile:write',
  NGO_EVIDENCE_UPLOAD: 'ngo:evidence:upload',
  NGO_DOCUMENTS_UPLOAD: 'ngo:documents:upload',
  BENEFICIARIES_MANAGE: 'beneficiaries:manage',
  FINANCE_READ: 'finance:read',
  FILES_UPLOAD: 'files:upload',
  FILES_DOWNLOAD: 'files:download',
  NOTIFICATIONS_READ: 'notifications:read',
  ACTIVITY_READ: 'activity:read',
  ADMIN_USERS: 'admin:users',
  ADMIN_VERIFY_NGO: 'admin:verify_ngo',
  ADMIN_AUDIT_READ: 'admin:audit:read',
}

const ALL_CORPORATE = [
  PERMISSIONS.PROJECTS_READ,
  PERMISSIONS.PROJECTS_WRITE,
  PERMISSIONS.PROJECTS_APPROVE,
  PERMISSIONS.FUNDS_READ,
  PERMISSIONS.FUNDS_RELEASE,
  PERMISSIONS.COMPLIANCE_READ,
  PERMISSIONS.COMPLIANCE_EXPORT,
  PERMISSIONS.DISCOVERY_READ,
  PERMISSIONS.REPORTING_READ,
  PERMISSIONS.COPILOT_USE,
  PERMISSIONS.VOLUNTEERS_MANAGE,
  PERMISSIONS.DOCUMENTS_READ,
  PERMISSIONS.COMMUNICATIONS_READ,
  PERMISSIONS.SETTINGS_MANAGE,
  PERMISSIONS.FILES_UPLOAD,
  PERMISSIONS.FILES_DOWNLOAD,
  PERMISSIONS.NOTIFICATIONS_READ,
  PERMISSIONS.ACTIVITY_READ,
]

const ROLE_PERMISSIONS = {
  super_admin: ALL_CORPORATE,
  csr_head: ALL_CORPORATE.filter((p) => p !== PERMISSIONS.FUNDS_RELEASE),
  finance: [
    PERMISSIONS.PROJECTS_READ,
    PERMISSIONS.FUNDS_READ,
    PERMISSIONS.FUNDS_RELEASE,
    PERMISSIONS.COMPLIANCE_READ,
    PERMISSIONS.COMPLIANCE_EXPORT,
    PERMISSIONS.REPORTING_READ,
    PERMISSIONS.DOCUMENTS_READ,
    PERMISSIONS.COMMUNICATIONS_READ,
    PERMISSIONS.FILES_UPLOAD,
    PERMISSIONS.FILES_DOWNLOAD,
    PERMISSIONS.NOTIFICATIONS_READ,
    PERMISSIONS.ACTIVITY_READ,
  ],
  compliance: [
    PERMISSIONS.PROJECTS_READ,
    PERMISSIONS.COMPLIANCE_READ,
    PERMISSIONS.COMPLIANCE_EXPORT,
    PERMISSIONS.REPORTING_READ,
    PERMISSIONS.DOCUMENTS_READ,
    PERMISSIONS.COMMUNICATIONS_READ,
    PERMISSIONS.FILES_UPLOAD,
    PERMISSIONS.FILES_DOWNLOAD,
    PERMISSIONS.NOTIFICATIONS_READ,
    PERMISSIONS.ACTIVITY_READ,
  ],
  esg_head: [
    PERMISSIONS.PROJECTS_READ,
    PERMISSIONS.PROJECTS_WRITE,
    PERMISSIONS.DISCOVERY_READ,
    PERMISSIONS.REPORTING_READ,
    PERMISSIONS.COPILOT_USE,
    PERMISSIONS.COMMUNICATIONS_READ,
    PERMISSIONS.FILES_UPLOAD,
    PERMISSIONS.FILES_DOWNLOAD,
    PERMISSIONS.NOTIFICATIONS_READ,
    PERMISSIONS.ACTIVITY_READ,
  ],
  volunteer: [PERMISSIONS.PROJECTS_READ, PERMISSIONS.VOLUNTEERS_MANAGE, PERMISSIONS.NOTIFICATIONS_READ],
  board: [PERMISSIONS.PROJECTS_READ, PERMISSIONS.COMPLIANCE_READ, PERMISSIONS.REPORTING_READ, PERMISSIONS.NOTIFICATIONS_READ],
  ngo_admin: [
    PERMISSIONS.PROJECTS_READ,
    PERMISSIONS.PROJECTS_WRITE,
    PERMISSIONS.NGO_PROFILE_WRITE,
    PERMISSIONS.NGO_EVIDENCE_UPLOAD,
    PERMISSIONS.NGO_DOCUMENTS_UPLOAD,
    PERMISSIONS.BENEFICIARIES_MANAGE,
    PERMISSIONS.FINANCE_READ,
    PERMISSIONS.FILES_UPLOAD,
    PERMISSIONS.FILES_DOWNLOAD,
    PERMISSIONS.NOTIFICATIONS_READ,
    PERMISSIONS.ACTIVITY_READ,
  ],
  field_officer: [
    PERMISSIONS.PROJECTS_READ,
    PERMISSIONS.PROJECTS_WRITE,
    PERMISSIONS.NGO_EVIDENCE_UPLOAD,
    PERMISSIONS.BENEFICIARIES_MANAGE,
    PERMISSIONS.FILES_UPLOAD,
    PERMISSIONS.FILES_DOWNLOAD,
    PERMISSIONS.NOTIFICATIONS_READ,
  ],
  platform_super_admin: Object.values(PERMISSIONS),
}

export function getPermissionsForRole(role) {
  return ROLE_PERMISSIONS[role] || []
}

export function hasPermission(roleOrPerms, permission) {
  if (Array.isArray(roleOrPerms)) {
    return roleOrPerms.includes(permission)
  }
  return getPermissionsForRole(roleOrPerms).includes(permission)
}

export function getPermissionMatrix() {
  const modules = [
    { module: 'Dashboard', key: PERMISSIONS.PROJECTS_READ },
    { module: 'NGO Discovery', key: PERMISSIONS.DISCOVERY_READ },
    { module: 'Projects', key: PERMISSIONS.PROJECTS_WRITE },
    { module: 'Compliance', key: PERMISSIONS.COMPLIANCE_READ },
    { module: 'Reporting', key: PERMISSIONS.REPORTING_READ },
    { module: 'Settings', key: PERMISSIONS.SETTINGS_MANAGE },
  ]
  const roles = ['super_admin', 'csr_head', 'esg_head', 'finance', 'compliance', 'volunteer', 'board']
  return modules.map(({ module, key }) => {
    const row = { module }
    for (const r of roles) {
      row[r] = hasPermission(r, key)
    }
    return row
  })
}

export function canAccessNavItem(role, itemRoles, userPermissions = [], itemPermissions = []) {
  if (itemPermissions?.length && userPermissions.some((p) => itemPermissions.includes(p))) {
    return true
  }
  if (itemRoles?.length && itemRoles.includes(role)) {
    return true
  }
  if (!itemRoles?.length && !itemPermissions?.length) return true
  return false
}
