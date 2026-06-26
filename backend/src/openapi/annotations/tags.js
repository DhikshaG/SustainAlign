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
  path: '/tags',
  summary: 'List tag categories',
  security: auth,
  tags: ['Tags'],
  responses: okRef(),
})
registry.registerPath({
  method: 'get',
  path: '/tags/{category}',
  summary: 'List tags by category',
  security: auth,
  tags: ['Tags'],
  parameters: [{ name: 'category', in: 'path', required: true, schema: { type: 'string' } }],
  responses: okRef(),
})
registry.registerPath({
  method: 'get',
  path: '/entities/{type}/{id}/tags',
  summary: 'Get entity tags',
  security: auth,
  tags: ['Tags'],
  parameters: [
    { name: 'type', in: 'path', required: true, schema: { type: 'string' } },
    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
  ],
  responses: okRef(),
})
registry.registerPath({
  method: 'put',
  path: '/entities/{type}/{id}/tags',
  summary: 'Set entity tags',
  security: auth,
  tags: ['Tags'],
  parameters: [
    { name: 'type', in: 'path', required: true, schema: { type: 'string' } },
    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
  ],
  responses: okRef(),
})
