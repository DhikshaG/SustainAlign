import registry from '../registry.js'
import { okSchema } from '../components.js'

function ok200() {
  return { 200: { description: 'OK', content: { 'application/json': { schema: okSchema } } } }
}

registry.registerPath({
  method: 'post',
  path: '/auth/refresh',
  summary: 'Refresh access token',
  tags: ['Auth'],
  requestBody: {
    content: {
      'application/json': {
        schema: { type: 'object', required: ['refresh_token'], properties: { refresh_token: { type: 'string' } } },
      },
    },
  },
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/auth/logout',
  summary: 'Logout and invalidate refresh token',
  tags: ['Auth'],
  requestBody: {
    content: { 'application/json': { schema: { type: 'object', properties: { refresh_token: { type: 'string' } } } } },
  },
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/auth/me',
  summary: 'Get current user profile',
  security: [{ bearerAuth: [] }],
  tags: ['Auth'],
  responses: ok200(),
})
