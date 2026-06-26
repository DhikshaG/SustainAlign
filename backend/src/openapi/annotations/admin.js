import registry from '../registry.js'
import { okSchema } from '../components.js'

function ok200() {
  return { 200: { description: 'OK', content: { 'application/json': { schema: okSchema } } } }
}
const auth = [{ bearerAuth: [] }]

registry.registerPath({
  method: 'get',
  path: '/admin/overview',
  summary: 'Admin dashboard overview',
  security: auth,
  tags: ['Admin'],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/admin/users',
  summary: 'List platform users',
  security: auth,
  tags: ['Admin'],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/admin/ngo-verification',
  summary: 'List NGO verification queue',
  security: auth,
  tags: ['Admin'],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/admin/fraud/alerts',
  summary: 'List fraud alerts',
  security: auth,
  tags: ['Admin'],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/admin/analytics',
  summary: 'Platform analytics',
  security: auth,
  tags: ['Admin'],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/admin/support/tickets',
  summary: 'List support tickets',
  security: auth,
  tags: ['Admin'],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/admin/compliance',
  summary: 'List compliance records',
  security: auth,
  tags: ['Admin'],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/admin/audit/trail',
  summary: 'Admin audit trail (cross-tenant)',
  security: auth,
  tags: ['Admin'],
  parameters: [
    { name: 'tenantId', in: 'query', schema: { type: 'string' } },
    { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
    { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
  ],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/admin/audit/summary',
  summary: 'Get compliance audit summary for a tenant',
  security: auth,
  tags: ['Admin'],
  parameters: [{ name: 'tenantId', in: 'query', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/admin/ai-monitoring',
  summary: 'AI monitoring dashboard',
  security: auth,
  tags: ['Admin'],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/admin/content/moderation',
  summary: 'Content moderation queue',
  security: auth,
  tags: ['Admin'],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/admin/ngo-verification/{tenantId}/approve',
  summary: 'Approve NGO verification',
  security: auth,
  tags: ['Admin'],
  parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/admin/ngo-verification/{tenantId}/reject',
  summary: 'Reject NGO verification',
  security: auth,
  tags: ['Admin'],
  parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }],
  requestBody: {
    content: { 'application/json': { schema: { type: 'object', properties: { reason: { type: 'string' } } } } },
  },
  responses: ok200(),
})
registry.registerPath({
  method: 'patch',
  path: '/admin/ngos/{tenantId}/risk',
  summary: 'Update NGO risk/platform fields',
  security: auth,
  tags: ['Admin'],
  parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
