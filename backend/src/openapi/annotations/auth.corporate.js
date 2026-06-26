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
  path: '/auth/corporate/signup',
  summary: 'Register a corporate account',
  tags: ['Auth', 'Corporate'],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['email', 'password', 'companyName'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            companyName: { type: 'string' },
          },
        },
      },
    },
  },
  responses: created201(),
})
registry.registerPath({
  method: 'post',
  path: '/auth/corporate/login',
  summary: 'Login as corporate user',
  tags: ['Auth', 'Corporate'],
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
  path: '/auth/corporate/forgot-password',
  summary: 'Request password reset',
  tags: ['Auth', 'Corporate'],
  requestBody: {
    content: {
      'application/json': {
        schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } },
      },
    },
  },
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/auth/corporate/reset-password',
  summary: 'Reset password with token',
  tags: ['Auth', 'Corporate'],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['token', 'password'],
          properties: { token: { type: 'string' }, password: { type: 'string', minLength: 8 } },
        },
      },
    },
  },
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/auth/corporate/mfa/verify',
  summary: 'Verify MFA code during login',
  tags: ['Auth', 'Corporate'],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['mfaSessionId', 'code'],
          properties: { mfaSessionId: { type: 'string' }, code: { type: 'string' } },
        },
      },
    },
  },
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/auth/corporate/invite-team',
  summary: 'Invite team members',
  security: [{ bearerAuth: [] }],
  tags: ['Auth', 'Corporate'],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['invites'],
          properties: {
            invites: {
              type: 'array',
              items: {
                type: 'object',
                properties: { email: { type: 'string', format: 'email' }, role: { type: 'string' } },
              },
            },
          },
        },
      },
    },
  },
  responses: ok200(),
})
