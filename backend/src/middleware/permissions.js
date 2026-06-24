import { hasAnyPermission } from '../lib/permissions.js'
import { fail } from '../lib/response.js'
import { logActivity } from '../services/activity-log/index.js'

export function requirePermission(...requiredPermissions) {
  return async (req, res, next) => {
    if (!req.user) {
      return fail(res, 401, 'Authentication required')
    }

    if (!hasAnyPermission(req.user.role, requiredPermissions)) {
      try {
        await logActivity({
          req,
          action: 'authz.denied',
          entityType: 'permission',
          entityId: requiredPermissions.join(','),
          metadata: { role: req.user.role, required: requiredPermissions },
        })
      } catch {
        // activity log may not be ready during early boot
      }
      return fail(res, 403, 'Insufficient permissions')
    }

    next()
  }
}
