import registry from '../registry.js'
import { okSchema } from '../components.js'

function ok200() {
  return { 200: { description: 'OK', content: { 'application/json': { schema: okSchema } } } }
}

registry.registerPath({
  method: 'get',
  path: '/audit-trail',
  summary: 'Get audit trail',
  security: [{ bearerAuth: [] }],
  tags: ['Audit'],
  parameters: [
    { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
    { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
    { name: 'entityType', in: 'query', schema: { type: 'string' } },
    { name: 'entityId', in: 'query', schema: { type: 'string' } },
  ],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/features',
  summary: 'List feature flags',
  tags: ['Public'],
  responses: ok200(),
})
