import registry from '../registry.js'
import { okSchema } from '../components.js'

function ok200() {
  return { 200: { description: 'OK', content: { 'application/json': { schema: okSchema } } } }
}
const auth = [{ bearerAuth: [] }]

registry.registerPath({
  method: 'get',
  path: '/tags',
  summary: 'List tag categories',
  security: auth,
  tags: ['Tags'],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/tags/{category}',
  summary: 'List tags by category',
  security: auth,
  tags: ['Tags'],
  parameters: [{ name: 'category', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
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
  responses: ok200(),
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
  responses: ok200(),
})
