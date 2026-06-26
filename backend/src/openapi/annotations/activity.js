import registry from '../registry.js'
import { okSchema } from '../components.js'

function ok200() {
  return { 200: { description: 'OK', content: { 'application/json': { schema: okSchema } } } }
}
const auth = [{ bearerAuth: [] }]

registry.registerPath({
  method: 'get',
  path: '/activity',
  summary: 'List activity log',
  security: auth,
  tags: ['Activity'],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/activity/export',
  summary: 'Export activity log',
  security: auth,
  tags: ['Activity'],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/activity/entity/{entityType}/{entityId}',
  summary: 'Get entity activity history',
  security: auth,
  tags: ['Activity'],
  parameters: [
    { name: 'entityType', in: 'path', required: true, schema: { type: 'string' } },
    { name: 'entityId', in: 'path', required: true, schema: { type: 'string' } },
  ],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/admin/activity',
  summary: 'Admin cross-tenant activity log',
  security: auth,
  tags: ['Admin', 'Activity'],
  responses: ok200(),
})
