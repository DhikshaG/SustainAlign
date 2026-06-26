import registry from '../registry.js'

const auth = [{ bearerAuth: [] }]
function okRef() {
  return {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } },
    },
  }
}

registry.registerPath({
  method: 'get',
  path: '/activity',
  summary: 'List activity log',
  security: auth,
  tags: ['Activity'],
  responses: okRef(),
})
registry.registerPath({
  method: 'get',
  path: '/activity/export',
  summary: 'Export activity log',
  security: auth,
  tags: ['Activity'],
  responses: okRef(),
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
  responses: okRef(),
})

registry.registerPath({
  method: 'get',
  path: '/admin/activity',
  summary: 'Admin cross-tenant activity log',
  security: auth,
  tags: ['Admin', 'Activity'],
  responses: okRef(),
})
