import registry from '../registry.js'

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
  path: '/search',
  summary: 'Full-text search',
  security: [{ bearerAuth: [] }],
  tags: ['Search'],
  parameters: [
    { name: 'q', in: 'query', required: true, schema: { type: 'string' }, description: 'Search query' },
    { name: 'types', in: 'query', schema: { type: 'string' }, description: 'Comma-separated entity types' },
    { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
  ],
  responses: okRef(),
})

registry.registerPath({
  method: 'get',
  path: '/search/public',
  summary: 'Public search (NGOs only)',
  tags: ['Search', 'Public'],
  parameters: [
    { name: 'q', in: 'query', required: true, schema: { type: 'string' } },
    { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
  ],
  responses: okRef(),
})
