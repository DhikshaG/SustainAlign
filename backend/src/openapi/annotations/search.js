import registry from '../registry.js'
import { okSchema } from '../components.js'

function ok200() {
  return { 200: { description: 'OK', content: { 'application/json': { schema: okSchema } } } }
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
  responses: ok200(),
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
  responses: ok200(),
})
