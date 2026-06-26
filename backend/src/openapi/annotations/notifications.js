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
  path: '/notifications',
  summary: 'List notifications',
  security: auth,
  tags: ['Notifications'],
  parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 30 } }],
  responses: okRef(),
})
registry.registerPath({
  method: 'patch',
  path: '/notifications/read-all',
  summary: 'Mark all notifications as read',
  security: auth,
  tags: ['Notifications'],
  responses: okRef(),
})
registry.registerPath({
  method: 'patch',
  path: '/notifications/{id}/read',
  summary: 'Mark notification as read',
  security: auth,
  tags: ['Notifications'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: okRef(),
})
