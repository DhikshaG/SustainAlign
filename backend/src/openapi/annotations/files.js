import registry from '../registry.js'
import { okSchema } from '../components.js'

function ok200() {
  return { 200: { description: 'OK', content: { 'application/json': { schema: okSchema } } } }
}
const auth = [{ bearerAuth: [] }]

registry.registerPath({
  method: 'post',
  path: '/files/upload',
  summary: 'Upload a file',
  security: auth,
  tags: ['Files'],
  requestBody: {
    content: {
      'multipart/form-data': {
        schema: {
          type: 'object',
          required: ['file', 'category'],
          properties: {
            file: { type: 'string', format: 'binary' },
            category: { type: 'string' },
            entityType: { type: 'string' },
            entityId: { type: 'string' },
          },
        },
      },
    },
  },
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/files',
  summary: 'List files',
  security: auth,
  tags: ['Files'],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/files/{id}',
  summary: 'Get file metadata',
  security: auth,
  tags: ['Files'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/files/{id}/download',
  summary: 'Download file',
  security: auth,
  tags: ['Files'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: {
    200: {
      description: 'File binary',
      content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } },
    },
  },
})
