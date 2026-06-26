import registry from '../registry.js'

registry.registerPath({
  method: 'get',
  path: '/admin/overview',
  summary: 'Admin dashboard overview',
  security: [{ bearerAuth: [] }],
  tags: ['Admin'],
  responses: {
    200: {
      description: 'Overview data',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } },
    },
  },
})

registry.registerPath({
  method: 'get',
  path: '/admin/users',
  summary: 'List platform users',
  security: [{ bearerAuth: [] }],
  tags: ['Admin'],
  responses: {
    200: {
      description: 'Users list',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } },
    },
  },
})

registry.registerPath({
  method: 'get',
  path: '/admin/ngo-verification',
  summary: 'List NGO verification queue',
  security: [{ bearerAuth: [] }],
  tags: ['Admin'],
  responses: {
    200: {
      description: 'Verification queue',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } },
    },
  },
})

registry.registerPath({
  method: 'get',
  path: '/admin/fraud/alerts',
  summary: 'List fraud alerts',
  security: [{ bearerAuth: [] }],
  tags: ['Admin'],
  responses: {
    200: {
      description: 'Fraud alerts',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } },
    },
  },
})

registry.registerPath({
  method: 'get',
  path: '/admin/analytics',
  summary: 'Platform analytics',
  security: [{ bearerAuth: [] }],
  tags: ['Admin'],
  responses: {
    200: {
      description: 'Analytics data',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } },
    },
  },
})

registry.registerPath({
  method: 'get',
  path: '/admin/support/tickets',
  summary: 'List support tickets',
  security: [{ bearerAuth: [] }],
  tags: ['Admin'],
  responses: {
    200: {
      description: 'Support tickets',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } },
    },
  },
})

registry.registerPath({
  method: 'get',
  path: '/admin/compliance',
  summary: 'List compliance records',
  security: [{ bearerAuth: [] }],
  tags: ['Admin'],
  responses: {
    200: {
      description: 'Compliance records',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } },
    },
  },
})

registry.registerPath({
  method: 'get',
  path: '/admin/audit/trail',
  summary: 'Admin audit trail (cross-tenant)',
  security: [{ bearerAuth: [] }],
  tags: ['Admin'],
  parameters: [
    { name: 'tenantId', in: 'query', schema: { type: 'string' } },
    { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
    { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
  ],
  responses: {
    200: {
      description: 'Audit trail',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } },
    },
  },
})

registry.registerPath({
  method: 'get',
  path: '/admin/audit/summary',
  summary: 'Get compliance audit summary for a tenant',
  security: [{ bearerAuth: [] }],
  tags: ['Admin'],
  parameters: [{ name: 'tenantId', in: 'query', required: true, schema: { type: 'string' } }],
  responses: {
    200: {
      description: 'Audit summary',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } },
    },
  },
})

registry.registerPath({
  method: 'get',
  path: '/admin/ai-monitoring',
  summary: 'AI monitoring dashboard',
  security: [{ bearerAuth: [] }],
  tags: ['Admin'],
  responses: {
    200: {
      description: 'AI monitoring data',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } },
    },
  },
})

registry.registerPath({
  method: 'get',
  path: '/admin/content/moderation',
  summary: 'Content moderation queue',
  security: [{ bearerAuth: [] }],
  tags: ['Admin'],
  responses: {
    200: {
      description: 'Moderation queue',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } },
    },
  },
})

registry.registerPath({
  method: 'post',
  path: '/admin/ngo-verification/{tenantId}/approve',
  summary: 'Approve NGO verification',
  security: [{ bearerAuth: [] }],
  tags: ['Admin'],
  parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }],
  responses: {
    200: {
      description: 'NGO approved',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } },
    },
  },
})

registry.registerPath({
  method: 'post',
  path: '/admin/ngo-verification/{tenantId}/reject',
  summary: 'Reject NGO verification',
  security: [{ bearerAuth: [] }],
  tags: ['Admin'],
  parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: { reason: { type: 'string' } },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'NGO rejected',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } },
    },
  },
})

registry.registerPath({
  method: 'patch',
  path: '/admin/ngos/{tenantId}/risk',
  summary: 'Update NGO risk/platform fields',
  security: [{ bearerAuth: [] }],
  tags: ['Admin'],
  parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }],
  responses: {
    200: {
      description: 'Platform fields updated',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } },
    },
  },
})
