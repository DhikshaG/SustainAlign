import registry from '../registry.js'
import { okSchema } from '../components.js'

function ok200() {
  return { 200: { description: 'OK', content: { 'application/json': { schema: okSchema } } } }
}
const auth = [{ bearerAuth: [] }]

registry.registerPath({
  method: 'get',
  path: '/workflows/inbox',
  summary: 'List workflow inbox items',
  security: auth,
  tags: ['Workflows'],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/workflows/instances',
  summary: 'Create workflow instance',
  security: auth,
  tags: ['Workflows'],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/workflows/instances/{id}',
  summary: 'Get workflow instance',
  security: auth,
  tags: ['Workflows'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/workflows/instances/{id}/transition',
  summary: 'Transition workflow',
  security: auth,
  tags: ['Workflows'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/ngo/reports',
  summary: 'Submit NGO report for approval',
  security: auth,
  tags: ['Workflows', 'NGO'],
  responses: ok200(),
})
