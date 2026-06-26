import registry from '../registry.js'

registry.registerPath({
  method: 'post',
  path: '/contact',
  summary: 'Submit contact form',
  tags: ['Public'],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['email', 'name', 'message'],
          properties: {
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Message received',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/CreatedResponse' } } },
    },
  },
})

registry.registerPath({
  method: 'post',
  path: '/demo-booking',
  summary: 'Book a demo',
  tags: ['Public'],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['email', 'name', 'company'],
          properties: {
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            company: { type: 'string' },
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Demo request received',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/CreatedResponse' } } },
    },
  },
})

registry.registerPath({
  method: 'get',
  path: '/blog',
  summary: 'List blog posts',
  tags: ['Public'],
  responses: {
    200: {
      description: 'Blog posts',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } },
    },
  },
})

registry.registerPath({
  method: 'get',
  path: '/blog/{slug}',
  summary: 'Get blog post by slug',
  tags: ['Public'],
  parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
  responses: {
    200: {
      description: 'Blog post',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } },
    },
    404: {
      description: 'Not found',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
    },
  },
})

registry.registerPath({
  method: 'get',
  path: '/ngos',
  summary: 'List public NGO profiles',
  tags: ['Public'],
  responses: {
    200: {
      description: 'NGO cards',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } },
    },
  },
})

registry.registerPath({
  method: 'get',
  path: '/ngos/{slug}',
  summary: 'Get public NGO profile by slug',
  tags: ['Public'],
  parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
  responses: {
    200: {
      description: 'NGO profile',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } },
    },
    404: {
      description: 'Not found',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
    },
  },
})

registry.registerPath({
  method: 'get',
  path: '/case-studies',
  summary: 'List case studies',
  tags: ['Public'],
  responses: {
    200: {
      description: 'Case studies',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } },
    },
  },
})

registry.registerPath({
  method: 'get',
  path: '/case-studies/{slug}',
  summary: 'Get case study by slug',
  tags: ['Public'],
  parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
  responses: {
    200: {
      description: 'Case study',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } },
    },
    404: {
      description: 'Not found',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
    },
  },
})

registry.registerPath({
  method: 'get',
  path: '/jobs',
  summary: 'List job openings',
  tags: ['Public'],
  responses: {
    200: {
      description: 'Jobs',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } },
    },
  },
})
