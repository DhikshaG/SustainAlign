import registry from '../registry.js'

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
  responses: {
    201: {
      description: 'Account created',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/CreatedResponse' } } },
    },
  },
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
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Login successful',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } },
    },
  },
})

registry.registerPath({
  method: 'post',
  path: '/auth/corporate/forgot-password',
  summary: 'Request password reset',
  tags: ['Auth', 'Corporate'],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['email'],
          properties: { email: { type: 'string', format: 'email' } },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Reset link sent if account exists',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } },
    },
  },
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
          properties: {
            token: { type: 'string' },
            password: { type: 'string', minLength: 8 },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Password reset successful',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } },
    },
  },
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
          properties: {
            mfaSessionId: { type: 'string' },
            code: { type: 'string' },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'MFA verified',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } },
    },
  },
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
                properties: {
                  email: { type: 'string', format: 'email' },
                  role: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Invitations sent',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } },
    },
  },
})
