const okResponse = {
  type: 'object',
  properties: {
    ok: { type: 'boolean', enum: [true] },
    message: { type: 'string' },
    data: { nullable: true },
  },
}

const createdResponse = {
  type: 'object',
  properties: {
    ok: { type: 'boolean', enum: [true] },
    message: { type: 'string' },
    data: { nullable: true },
  },
}

const errorResponse = {
  type: 'object',
  properties: {
    ok: { type: 'boolean', enum: [false] },
    message: { type: 'string' },
    errors: { type: 'object', nullable: true },
  },
}

const paginatedResponse = {
  type: 'object',
  properties: {
    ok: { type: 'boolean', enum: [true] },
    message: { type: 'string' },
    data: {
      type: 'object',
      properties: {
        items: { type: 'array' },
        total: { type: 'integer' },
        page: { type: 'integer' },
        limit: { type: 'integer' },
      },
    },
  },
}

const healthStatus = {
  type: 'object',
  properties: {
    ok: { type: 'boolean' },
    status: { type: 'string', enum: ['healthy', 'degraded'] },
    checks: { type: 'object' },
    timestamp: { type: 'string', format: 'date-time' },
  },
}

export function registerCommonComponents(registry) {
  registry.registerComponent('schemas', 'OkResponse', okResponse)
  registry.registerComponent('schemas', 'CreatedResponse', createdResponse)
  registry.registerComponent('schemas', 'ErrorResponse', errorResponse)
  registry.registerComponent('schemas', 'PaginatedResponse', paginatedResponse)
  registry.registerComponent('schemas', 'HealthStatus', healthStatus)
}
