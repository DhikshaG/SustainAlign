import registry from '../registry.js'
import { okSchema, createdSchema } from '../components.js'

function ok200() {
  return { 200: { description: 'OK', content: { 'application/json': { schema: okSchema } } } }
}
function created201() {
  return { 201: { description: 'Created', content: { 'application/json': { schema: createdSchema } } } }
}

registry.registerPath({
  method: 'post',
  path: '/auth/ngo/register',
  summary: 'Register an NGO account',
  tags: ['Auth', 'NGO'],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['email', 'password', 'ngoName', 'sector', 'region'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            ngoName: { type: 'string' },
            sector: { type: 'string' },
            region: { type: 'string' },
          },
        },
      },
    },
  },
  responses: created201(),
})
registry.registerPath({
  method: 'post',
  path: '/auth/ngo/login',
  summary: 'Login as NGO user',
  tags: ['Auth', 'NGO'],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['email', 'password'],
          properties: { email: { type: 'string', format: 'email' }, password: { type: 'string' } },
        },
      },
    },
  },
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/auth/ngo/verification',
  summary: 'Upload NGO verification documents',
  security: [{ bearerAuth: [] }],
  tags: ['Auth', 'NGO'],
  requestBody: {
    content: {
      'multipart/form-data': {
        schema: {
          type: 'object',
          properties: {
            registration: { type: 'string', format: 'binary' },
            '12a': { type: 'string', format: 'binary' },
            '80g': { type: 'string', format: 'binary' },
            fcra: { type: 'string', format: 'binary' },
          },
        },
      },
    },
  },
  responses: ok200(),
})
