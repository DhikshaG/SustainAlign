import { ROUTES, CORPORATE_ROUTES, NGO_ROUTES, ADMIN_ROUTES } from './routes'

export function getDashboardPath(tenantType) {
  switch (tenantType) {
    case 'ngo':
      return NGO_ROUTES.home
    case 'platform':
      return ADMIN_ROUTES.home
    case 'corporate':
    default:
      return CORPORATE_ROUTES.home
  }
}

export function getLoginPath(tenantType) {
  switch (tenantType) {
    case 'ngo':
      return ROUTES.ngoLogin
    case 'platform':
      return ROUTES.corporateLogin
    case 'corporate':
    default:
      return ROUTES.corporateLogin
  }
}

export function getDashboardPathForUser(user) {
  return getDashboardPath(user?.tenantType)
}
