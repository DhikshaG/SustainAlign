import registry from '../registry.js'
import { okSchema, createdSchema } from '../components.js'

function ok200() {
  return { 200: { description: 'OK', content: { 'application/json': { schema: okSchema } } } }
}
function created201() {
  return { 201: { description: 'Created', content: { 'application/json': { schema: createdSchema } } } }
}

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
  responses: created201(),
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
  responses: created201(),
})
registry.registerPath({
  method: 'get',
  path: '/blog',
  summary: 'List blog posts',
  tags: ['Public'],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/blog/{slug}',
  summary: 'Get blog post by slug',
  tags: ['Public'],
  parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/ngos',
  summary: 'List public NGO profiles',
  tags: ['Public'],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/ngos/{slug}',
  summary: 'Get public NGO profile by slug',
  tags: ['Public'],
  parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/case-studies',
  summary: 'List case studies',
  tags: ['Public'],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/case-studies/{slug}',
  summary: 'Get case study by slug',
  tags: ['Public'],
  parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/jobs',
  summary: 'List job openings',
  tags: ['Public'],
  responses: ok200(),
})
