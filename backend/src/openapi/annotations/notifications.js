import registry from '../registry.js'
import { okSchema } from '../components.js'

function ok200() {
  return { 200: { description: 'OK', content: { 'application/json': { schema: okSchema } } } }
}
const auth = [{ bearerAuth: [] }]

registry.registerPath({
  method: 'get',
  path: '/notifications',
  summary: 'List notifications',
  security: auth,
  tags: ['Notifications'],
  responses: ok200(),
})
registry.registerPath({
  method: 'patch',
  path: '/notifications/read-all',
  summary: 'Mark all notifications as read',
  security: auth,
  tags: ['Notifications'],
  responses: ok200(),
})
registry.registerPath({
  method: 'patch',
  path: '/notifications/{id}/read',
  summary: 'Mark notification as read',
  security: auth,
  tags: ['Notifications'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
