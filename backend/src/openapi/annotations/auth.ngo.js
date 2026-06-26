import registry from '../registry.js'

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
  responses: {
    201: {
      description: 'NGO registered',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/CreatedResponse' } } },
    },
  },
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
  responses: {
    200: {
      description: 'Documents received',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } },
    },
  },
})
