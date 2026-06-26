import registry from '../registry.js'

registry.registerPath({
  method: 'get',
  path: '/health',
  summary: 'Health check',
  tags: ['Health'],
  responses: {
    200: {
      description: 'API is healthy',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthStatus' } } },
    },
    503: {
      description: 'API is degraded',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthStatus' } } },
    },
  },
})
