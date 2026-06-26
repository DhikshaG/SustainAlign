import registry from '../registry.js'
import { okSchema } from '../components.js'

const auth = [{ bearerAuth: [] }]
function ok200() {
  return { 200: { description: 'OK', content: { 'application/json': { schema: okSchema } } } }
}

registry.registerPath({
  method: 'get',
  path: '/corporate/dashboard/summary',
  summary: 'Corporate dashboard summary',
  security: auth,
  tags: ['Corporate'],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/corporate/discovery/filters',
  summary: 'Discovery filter options',
  security: auth,
  tags: ['Corporate', 'Discovery'],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/corporate/discovery/match-defaults',
  summary: 'AI matching defaults from projects',
  security: auth,
  tags: ['Corporate', 'Discovery'],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/corporate/discovery/ngos',
  summary: 'Search/discover NGOs',
  security: auth,
  tags: ['Corporate', 'Discovery'],
  parameters: [
    { name: 'q', in: 'query', schema: { type: 'string' } },
    { name: 'sector', in: 'query', schema: { type: 'string' } },
    { name: 'region', in: 'query', schema: { type: 'string' } },
    { name: 'focusAreas', in: 'query', schema: { type: 'string' }, description: 'Comma-separated' },
    { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
    { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
  ],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/corporate/saved-ngos',
  summary: 'List saved NGOs',
  security: auth,
  tags: ['Corporate', 'Discovery'],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/corporate/saved-ngos/{slug}',
  summary: 'Save an NGO',
  security: auth,
  tags: ['Corporate', 'Discovery'],
  parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
registry.registerPath({
  method: 'delete',
  path: '/corporate/saved-ngos/{slug}',
  summary: 'Unsave an NGO',
  security: auth,
  tags: ['Corporate', 'Discovery'],
  parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/corporate/ngos/{slug}/contact',
  summary: 'Contact an NGO',
  security: auth,
  tags: ['Corporate', 'Discovery'],
  parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['subject', 'message'],
          properties: { subject: { type: 'string' }, message: { type: 'string' } },
        },
      },
    },
  },
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/corporate/ngos/{slug}',
  summary: 'Get NGO profile details',
  security: auth,
  tags: ['Corporate', 'Discovery'],
  parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})

registry.registerPath({
  method: 'get',
  path: '/corporate/projects',
  summary: 'List corporate projects',
  security: auth,
  tags: ['Corporate', 'Projects'],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/corporate/projects',
  summary: 'Create a project',
  security: auth,
  tags: ['Corporate', 'Projects'],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            budget: { type: 'number' },
            ngoSlug: { type: 'string' },
            focusArea: { type: 'string' },
          },
        },
      },
    },
  },
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/corporate/projects/{id}',
  summary: 'Get project details',
  security: auth,
  tags: ['Corporate', 'Projects'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
registry.registerPath({
  method: 'patch',
  path: '/corporate/projects/{id}',
  summary: 'Update project',
  security: auth,
  tags: ['Corporate', 'Projects'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
registry.registerPath({
  method: 'delete',
  path: '/corporate/projects/{id}',
  summary: 'Archive project',
  security: auth,
  tags: ['Corporate', 'Projects'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})

registry.registerPath({
  method: 'post',
  path: '/corporate/projects/{id}/milestones',
  summary: 'Add project milestone',
  security: auth,
  tags: ['Corporate', 'Projects'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
registry.registerPath({
  method: 'patch',
  path: '/corporate/projects/{id}/milestones/{mid}',
  summary: 'Update milestone',
  security: auth,
  tags: ['Corporate', 'Projects'],
  parameters: [
    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
    { name: 'mid', in: 'path', required: true, schema: { type: 'string' } },
  ],
  responses: ok200(),
})
registry.registerPath({
  method: 'delete',
  path: '/corporate/projects/{id}/milestones/{mid}',
  summary: 'Delete milestone',
  security: auth,
  tags: ['Corporate', 'Projects'],
  parameters: [
    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
    { name: 'mid', in: 'path', required: true, schema: { type: 'string' } },
  ],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/corporate/projects/{id}/updates',
  summary: 'Post project update',
  security: auth,
  tags: ['Corporate', 'Projects'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/corporate/projects/{id}/updates/{uid}/files',
  summary: 'Attach files to update',
  security: auth,
  tags: ['Corporate', 'Projects'],
  parameters: [
    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
    { name: 'uid', in: 'path', required: true, schema: { type: 'string' } },
  ],
  responses: ok200(),
})

registry.registerPath({
  method: 'post',
  path: '/corporate/projects/{id}/kpis',
  summary: 'Record KPI for project',
  security: auth,
  tags: ['Corporate', 'Impact'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/corporate/projects/{id}/beneficiaries',
  summary: 'Log beneficiary data',
  security: auth,
  tags: ['Corporate', 'Impact'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/corporate/projects/{id}/geo',
  summary: 'Add geo update to project',
  security: auth,
  tags: ['Corporate', 'Impact'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
registry.registerPath({
  method: 'patch',
  path: '/corporate/projects/{id}/spent',
  summary: 'Update project spend',
  security: auth,
  tags: ['Corporate', 'Projects'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})

registry.registerPath({
  method: 'get',
  path: '/corporate/compliance/summary',
  summary: 'Compliance summary',
  security: auth,
  tags: ['Corporate', 'Compliance'],
  responses: ok200(),
})
registry.registerPath({
  method: 'patch',
  path: '/corporate/compliance/profile',
  summary: 'Update CSR profile',
  security: auth,
  tags: ['Corporate', 'Compliance'],
  responses: ok200(),
})
registry.registerPath({
  method: 'patch',
  path: '/corporate/compliance/alerts/{id}/acknowledge',
  summary: 'Acknowledge compliance alert',
  security: auth,
  tags: ['Corporate', 'Compliance'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/corporate/compliance/run-check',
  summary: 'Run compliance check',
  security: auth,
  tags: ['Corporate', 'Compliance'],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/corporate/compliance/mca-export',
  summary: 'Export MCA CSR-2 data',
  security: auth,
  tags: ['Corporate', 'Compliance'],
  responses: ok200(),
})

registry.registerPath({
  method: 'get',
  path: '/corporate/reporting/overview',
  summary: 'Reporting overview',
  security: auth,
  tags: ['Corporate', 'Reporting'],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/corporate/reports',
  summary: 'List generated reports',
  security: auth,
  tags: ['Corporate', 'Reporting'],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/corporate/reports/generate',
  summary: 'Generate a report',
  security: auth,
  tags: ['Corporate', 'Reporting'],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/corporate/reports/preview',
  summary: 'Preview a report',
  security: auth,
  tags: ['Corporate', 'Reporting'],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/corporate/reports/{id}',
  summary: 'Get report details',
  security: auth,
  tags: ['Corporate', 'Reporting'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/corporate/reports/{id}/submit',
  summary: 'Submit report for review',
  security: auth,
  tags: ['Corporate', 'Reporting'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/corporate/esg/unified',
  summary: 'Unified ESG dashboard',
  security: auth,
  tags: ['Corporate', 'ESG'],
  responses: ok200(),
})

registry.registerPath({
  method: 'get',
  path: '/corporate/funds/allocation',
  summary: 'Fund allocation data',
  security: auth,
  tags: ['Corporate', 'Funds'],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/corporate/funds/intelligence',
  summary: 'AI fund allocation intelligence',
  security: auth,
  tags: ['Corporate', 'Funds'],
  responses: ok200(),
})

registry.registerPath({
  method: 'get',
  path: '/corporate/volunteers/summary',
  summary: 'Volunteer program summary',
  security: auth,
  tags: ['Corporate', 'Volunteers'],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/corporate/volunteers/events',
  summary: 'List volunteer events',
  security: auth,
  tags: ['Corporate', 'Volunteers'],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/corporate/volunteers/events',
  summary: 'Create volunteer event',
  security: auth,
  tags: ['Corporate', 'Volunteers'],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/corporate/volunteers/events/{id}',
  summary: 'Get volunteer event',
  security: auth,
  tags: ['Corporate', 'Volunteers'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
registry.registerPath({
  method: 'patch',
  path: '/corporate/volunteers/events/{id}',
  summary: 'Update volunteer event',
  security: auth,
  tags: ['Corporate', 'Volunteers'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/corporate/volunteers/signups',
  summary: 'List volunteer signups',
  security: auth,
  tags: ['Corporate', 'Volunteers'],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/corporate/volunteers/calendar',
  summary: 'Volunteer calendar events',
  security: auth,
  tags: ['Corporate', 'Volunteers'],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/corporate/volunteers/events/{id}/register',
  summary: 'Register for event',
  security: auth,
  tags: ['Corporate', 'Volunteers'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
registry.registerPath({
  method: 'delete',
  path: '/corporate/volunteers/events/{id}/register',
  summary: 'Cancel event registration',
  security: auth,
  tags: ['Corporate', 'Volunteers'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/corporate/volunteers/events/{id}/qr',
  summary: 'Generate QR code for event',
  security: auth,
  tags: ['Corporate', 'Volunteers'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/corporate/volunteers/events/{id}/qr',
  summary: 'Get QR payload for event',
  security: auth,
  tags: ['Corporate', 'Volunteers'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/corporate/volunteers/check-in',
  summary: 'Check in with QR token',
  security: auth,
  tags: ['Corporate', 'Volunteers'],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/corporate/volunteers/events/{id}/attendance/manual',
  summary: 'Record manual attendance',
  security: auth,
  tags: ['Corporate', 'Volunteers'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/corporate/volunteers/signups/{id}/certificate',
  summary: 'Issue volunteer certificate',
  security: auth,
  tags: ['Corporate', 'Volunteers'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/corporate/volunteers/certificates/{id}',
  summary: 'Get volunteer certificate',
  security: auth,
  tags: ['Corporate', 'Volunteers'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})

registry.registerPath({
  method: 'get',
  path: '/corporate/audit/trail',
  summary: 'Corporate audit trail',
  security: auth,
  tags: ['Corporate', 'Audit'],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/corporate/audit/folders',
  summary: 'Audit folder tree',
  security: auth,
  tags: ['Corporate', 'Audit'],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/corporate/audit/export',
  summary: 'Export audit package (ZIP)',
  security: auth,
  tags: ['Corporate', 'Audit'],
  responses: {
    200: {
      description: 'ZIP file download',
      content: { 'application/zip': { schema: { type: 'string', format: 'binary' } } },
    },
  },
})

registry.registerPath({
  method: 'get',
  path: '/corporate/documents',
  summary: 'List grouped documents',
  security: auth,
  tags: ['Corporate', 'Documents'],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/corporate/files/{id}/versions',
  summary: 'List file versions',
  security: auth,
  tags: ['Corporate', 'Documents'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/corporate/files/{id}/versions',
  summary: 'Create file version',
  security: auth,
  tags: ['Corporate', 'Documents'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})

registry.registerPath({
  method: 'get',
  path: '/corporate/settings/permission-matrix',
  summary: 'Get permission matrix',
  security: auth,
  tags: ['Corporate', 'Settings'],
  responses: ok200(),
})

registry.registerPath({
  method: 'get',
  path: '/corporate/communications/threads',
  summary: 'List communication threads',
  security: auth,
  tags: ['Corporate', 'Communications'],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/corporate/communications/threads',
  summary: 'Create thread',
  security: auth,
  tags: ['Corporate', 'Communications'],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/corporate/communications/threads/{id}',
  summary: 'Get thread with messages',
  security: auth,
  tags: ['Corporate', 'Communications'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/corporate/communications/threads/{id}/messages',
  summary: 'Post message to thread',
  security: auth,
  tags: ['Corporate', 'Communications'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})

registry.registerPath({
  method: 'get',
  path: '/corporate/projects/{id}/crm/thread',
  summary: 'Get or create project CRM thread',
  security: auth,
  tags: ['Corporate', 'Communications'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/corporate/projects/{id}/tasks',
  summary: 'List project tasks',
  security: auth,
  tags: ['Corporate', 'Projects'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/corporate/projects/{id}/tasks',
  summary: 'Create project task',
  security: auth,
  tags: ['Corporate', 'Projects'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})
registry.registerPath({
  method: 'patch',
  path: '/corporate/projects/{id}/tasks/{taskId}',
  summary: 'Update task status',
  security: auth,
  tags: ['Corporate', 'Projects'],
  parameters: [
    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
    { name: 'taskId', in: 'path', required: true, schema: { type: 'string' } },
  ],
  responses: ok200(),
})
registry.registerPath({
  method: 'get',
  path: '/corporate/projects/{id}/timeline',
  summary: 'Get project timeline',
  security: auth,
  tags: ['Corporate', 'Projects'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: ok200(),
})

registry.registerPath({
  method: 'get',
  path: '/corporate/copilot/suggestions',
  summary: 'Get AI copilot suggestions',
  security: auth,
  tags: ['Corporate', 'AI'],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/corporate/copilot/chat',
  summary: 'Chat with RAG copilot',
  security: auth,
  tags: ['Corporate', 'AI'],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/corporate/ai/rag/recommend',
  summary: 'RAG NGO recommendations',
  security: auth,
  tags: ['Corporate', 'AI'],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/corporate/ai/rag/reindex',
  summary: 'Reindex all vectors',
  security: auth,
  tags: ['Corporate', 'AI'],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/corporate/ai/match-ngos',
  summary: 'Match NGOs using AI',
  security: auth,
  tags: ['Corporate', 'AI'],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/corporate/ai/search',
  summary: 'AI-powered search',
  security: auth,
  tags: ['Corporate', 'AI'],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/corporate/ai/narrative',
  summary: 'Generate narrative text',
  security: auth,
  tags: ['Corporate', 'AI'],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/corporate/ai/impact-summary',
  summary: 'Generate impact summary',
  security: auth,
  tags: ['Corporate', 'AI'],
  responses: ok200(),
})
registry.registerPath({
  method: 'post',
  path: '/corporate/ai/esg-summary',
  summary: 'Generate ESG summary',
  security: auth,
  tags: ['Corporate', 'ESG'],
  responses: ok200(),
})

registry.registerPath({
  method: 'get',
  path: '/corporate/impact/live',
  summary: 'Live impact snapshot',
  security: auth,
  tags: ['Corporate', 'Impact'],
  responses: ok200(),
})
