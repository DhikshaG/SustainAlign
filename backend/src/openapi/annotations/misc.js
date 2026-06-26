import registry from '../registry.js'
import { okRef } from './_helpers.js'

registry.registerPath({
  method: 'get',
  path: '/audit-trail',
  summary: 'Corporate audit trail (shortcut)',
  security: [{ bearerAuth: [] }],
  tags: ['Corporate', 'Audit'],
  responses: okRef(),
})
registry.registerPath({
  method: 'get',
  path: '/features',
  summary: 'Feature flag status',
  tags: ['Public'],
  responses: okRef(),
})
