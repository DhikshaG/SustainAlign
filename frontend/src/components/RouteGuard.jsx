import { useEffect } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { getRole, getToken, isAuthenticated, parseJwt } from '../lib/auth'

/**
 * Application-wide guard. Handles role-based onboarding redirects (corporate
 * needs to fill company details, NGO needs to complete onboarding) but does
 * NOT enforce per-route role membership. Use RequireRole for that.
 */
export default function RouteGuard({ children }) {
    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => {
        if (!isAuthenticated()) {
            return
        }

        const token = getToken()
        const payload = parseJwt(token) || {}
        const role = payload.role || 'corporate'

        if (role === 'corporate' && localStorage.getItem('newCorporateUser') === 'true') {
            if (location.pathname !== '/profile/company-details') {
                navigate('/profile/company-details', { replace: true })
                return
            }
        }

        if (role === 'ngo' && localStorage.getItem('ngoOnboardingComplete') !== 'true') {
            if (location.pathname !== '/ngo-onboarding') {
                navigate('/ngo-onboarding', { replace: true })
                return
            }
        }
    }, [location.pathname, navigate])

    return children
}

/**
 * Per-route role guard. Use as an Outlet wrapper in App.jsx:
 *
 *     <Route element={<RequireRole roles={['corporate', 'admin']} />}>
 *       <Route path="/discovery" element={<Discovery />} />
 *       ...
 *     </Route>
 *
 * Behavior:
 *   - Unauthenticated -> redirect to /login (preserving intended path).
 *   - Authenticated but wrong role -> redirect to /dashboard (or `fallback`
 *     prop if provided).
 *   - Authenticated with allowed role -> render the nested route via Outlet.
 */
export function RequireRole({ roles, fallback = '/dashboard', children }) {
    const location = useLocation()

    if (!isAuthenticated()) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    const role = getRole()
    if (!roles || roles.length === 0 || !roles.includes(role)) {
        return <Navigate to={fallback} replace />
    }

    return children ?? <Outlet />
}
