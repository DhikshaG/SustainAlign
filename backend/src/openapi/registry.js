import pkg from '@asteasolutions/zod-to-openapi'
const { OpenAPIRegistry, OpenApiGeneratorV3 } = pkg

const registry = new OpenAPIRegistry()

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'JWT access token from /auth/*/login or /auth/*/signup',
})

export function generateSpec() {
  const generator = new OpenApiGeneratorV3(registry.definitions)
  return generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'SustainAlign API',
      version: '0.1.0',
      description:
        'REST API for SustainAlign - CSR compliance, ESG reporting, NGO discovery, and impact management platform.',
    },
    servers: [{ url: '/api/v1', description: 'Current API version' }],
    security: [{ bearerAuth: [] }],
    tags: [
      'Health',
      'Public',
      'Auth',
      'Corporate',
      'NGO',
      'Admin',
      'Discovery',
      'Projects',
      'Impact',
      'Compliance',
      'Reporting',
      'ESG',
      'Funds',
      'Volunteers',
      'Audit',
      'Documents',
      'Settings',
      'Communications',
      'AI',
      'Workflows',
      'Tags',
      'Search',
      'Notifications',
      'Activity',
      'Files',
      'Partnerships',
      'Tasks',
      'Profile',
    ].map((n) => ({ name: n })),
  })
}

export default registry
