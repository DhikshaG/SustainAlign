import { usePermissions } from '../hooks/usePermissions'

export function RequirePermission({ permission, permissions: perms, children, fallback = null, hide = true }) {
  const { hasAnyPermission } = usePermissions()
  const required = perms || (permission ? [permission] : [])
  const allowed = required.length === 0 || hasAnyPermission(...required)

  if (allowed) return children
  if (hide) return fallback
  return (
    <span className="opacity-50 pointer-events-none" aria-disabled="true">
      {children}
    </span>
  )
}
