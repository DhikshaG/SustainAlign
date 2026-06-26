import registry from '../registry.js'

registry.registerPath({
  method: 'post',
  path: '/auth/refresh',
  summary: 'Refresh access token',
  tags: ['Auth'],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['refresh_token'],
          properties: { refresh_token: { type: 'string' } },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Token refreshed',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } },
    },
  },
})

registry.registerPath({
  method: 'post',
  path: '/auth/logout',
  summary: 'Logout and invalidate refresh token',
  tags: ['Auth'],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: { refresh_token: { type: 'string' } },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Logged out',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } },
    },
  },
})

registry.registerPath({
  method: 'get',
  path: '/auth/me',
  summary: 'Get current user profile',
  security: [{ bearerAuth: [] }],
  tags: ['Auth'],
  responses: {
    200: {
      description: 'User profile',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } },
    },
  },
})
