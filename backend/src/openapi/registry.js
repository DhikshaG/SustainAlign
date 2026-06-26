import { OpenApiRegistry } from '@asteasolutions/zod-to-openapi'

const registry = new OpenApiRegistry()

export function generateSpec() {
  return registry.generateSpec({
    openapi: '3.0.3',
    info: {
      title: 'SustainAlign API',
      version: '0.1.0',
      description:
        'REST API for SustainAlign — CSR compliance, ESG reporting, NGO discovery, and impact management platform.',
    },
    servers: [{ url: '/api/v1', description: 'Current API version' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token from /auth/*/login or /auth/*/signup',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  })
}

export default registry
