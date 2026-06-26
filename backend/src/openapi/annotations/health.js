import registry from '../registry.js'
import { okSchema } from '../components.js'

registry.registerPath({
  method: 'get',
  path: '/health',
  summary: 'Health check',
  tags: ['Health'],
  responses: {
    200: {
      description: 'API is healthy',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              ok: { type: 'boolean' },
              status: { type: 'string' },
              checks: { type: 'object' },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    503: {
      description: 'API is degraded',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              ok: { type: 'boolean' },
              status: { type: 'string' },
              checks: { type: 'object' },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
  },
})
