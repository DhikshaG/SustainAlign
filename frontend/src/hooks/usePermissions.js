import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { getPermissionsForRole, hasPermission as checkPerm } from '../lib/permissions'

export function usePermissions() {
  const { user } = useAuth()

  const permissions = useMemo(() => {
    if (user?.permissions?.length) return user.permissions
    if (user?.role) return getPermissionsForRole(user.role)
    return []
  }, [user])

  const hasPermission = (perm) => checkPerm(permissions, perm)
  const hasAnyPermission = (...perms) => perms.some((p) => hasPermission(p))

  return { permissions, role: user?.role, hasPermission, hasAnyPermission }
}
