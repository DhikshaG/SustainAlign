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
  path: '/workflows/inbox',
  summary: 'List workflow inbox items',
  security: auth,
  tags: ['Workflows'],
  responses: okRef(),
})
registry.registerPath({
  method: 'post',
  path: '/workflows/instances',
  summary: 'Create workflow instance',
  security: auth,
  tags: ['Workflows'],
  responses: okRef(),
})
registry.registerPath({
  method: 'get',
  path: '/workflows/instances/{id}',
  summary: 'Get workflow instance',
  security: auth,
  tags: ['Workflows'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: okRef(),
})
registry.registerPath({
  method: 'post',
  path: '/workflows/instances/{id}/transition',
  summary: 'Transition workflow (approve/reject/request_revision)',
  security: auth,
  tags: ['Workflows'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: okRef(),
})

registry.registerPath({
  method: 'post',
  path: '/ngo/reports',
  summary: 'Submit NGO report for approval',
  security: auth,
  tags: ['Workflows', 'NGO'],
  responses: okRef(),
})
