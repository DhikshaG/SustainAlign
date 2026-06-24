import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getRole, getStoredUser } from '../lib/auth'
import { getDashboardPathForUser, getLoginPath } from '../lib/routing'

export function RequireRole({ roles, fallback, loginPath, children }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const role = getRole()
  const storedUser = user || getStoredUser()
  const resolvedFallback = fallback ?? getDashboardPathForUser(storedUser)
  const resolvedLoginPath = loginPath ?? getLoginPath(storedUser?.tenantType)

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
        Loading...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={resolvedLoginPath} replace />
  }

  if (roles?.length && !roles.includes(role)) {
    return <Navigate to={resolvedFallback} replace />
  }

  return children
}
