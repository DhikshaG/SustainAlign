import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getRole } from '../lib/auth'
import { ROUTES } from '../lib/routes'

export function RequireRole({ roles, fallback = ROUTES.home, children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const role = getRole()

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
        Loading...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.corporateLogin} replace />
  }

  if (roles?.length && !roles.includes(role)) {
    return <Navigate to={fallback} replace />
  }

  return children
}
