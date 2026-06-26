import registry from '../registry.js'

const auth = [{ bearerAuth: [] }]

function okRef() {
  return {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } },
    },
  }
}

registry.registerPath({
  method: 'get',
  path: '/ngo/dashboard/summary',
  summary: 'NGO dashboard summary',
  security: auth,
  tags: ['NGO'],
  responses: okRef(),
})
registry.registerPath({
  method: 'get',
  path: '/ngo/projects',
  summary: 'List NGO projects',
  security: auth,
  tags: ['NGO', 'Projects'],
  responses: okRef(),
})
registry.registerPath({
  method: 'get',
  path: '/ngo/projects/{id}',
  summary: 'Get NGO project details',
  security: auth,
  tags: ['NGO', 'Projects'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: okRef(),
})
registry.registerPath({
  method: 'patch',
  path: '/ngo/projects/{id}/milestones/{mid}',
  summary: 'Update milestone as NGO',
  security: auth,
  tags: ['NGO', 'Projects'],
  parameters: [
    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
    { name: 'mid', in: 'path', required: true, schema: { type: 'string' } },
  ],
  responses: okRef(),
})
registry.registerPath({
  method: 'post',
  path: '/ngo/projects/{id}/updates',
  summary: 'Post project update as NGO',
  security: auth,
  tags: ['NGO', 'Projects'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: okRef(),
})
registry.registerPath({
  method: 'get',
  path: '/ngo/beneficiaries',
  summary: 'List NGO beneficiary logs',
  security: auth,
  tags: ['NGO', 'Impact'],
  responses: okRef(),
})
registry.registerPath({
  method: 'post',
  path: '/ngo/projects/{id}/kpis',
  summary: 'Record KPI as NGO',
  security: auth,
  tags: ['NGO', 'Impact'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: okRef(),
})
registry.registerPath({
  method: 'post',
  path: '/ngo/projects/{id}/beneficiaries',
  summary: 'Log beneficiaries as NGO',
  security: auth,
  tags: ['NGO', 'Impact'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: okRef(),
})
registry.registerPath({
  method: 'post',
  path: '/ngo/projects/{id}/geo',
  summary: 'Add geo update as NGO',
  security: auth,
  tags: ['NGO', 'Impact'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: okRef(),
})
registry.registerPath({
  method: 'post',
  path: '/ngo/projects/{id}/updates/{uid}/files',
  summary: 'Attach files to update as NGO',
  security: auth,
  tags: ['NGO', 'Projects'],
  parameters: [
    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
    { name: 'uid', in: 'path', required: true, schema: { type: 'string' } },
  ],
  responses: okRef(),
})
registry.registerPath({
  method: 'get',
  path: '/ngo/finance/summary',
  summary: 'NGO finance summary',
  security: auth,
  tags: ['NGO'],
  responses: okRef(),
})
registry.registerPath({
  method: 'get',
  path: '/ngo/profile',
  summary: 'Get NGO profile',
  security: auth,
  tags: ['NGO', 'Profile'],
  responses: okRef(),
})
registry.registerPath({
  method: 'patch',
  path: '/ngo/profile',
  summary: 'Update NGO profile',
  security: auth,
  tags: ['NGO', 'Profile'],
  responses: okRef(),
})
registry.registerPath({
  method: 'get',
  path: '/ngo/profile/team',
  summary: 'Get NGO team members',
  security: auth,
  tags: ['NGO', 'Profile'],
  responses: okRef(),
})
registry.registerPath({
  method: 'put',
  path: '/ngo/profile/team',
  summary: 'Replace NGO team',
  security: auth,
  tags: ['NGO', 'Profile'],
  responses: okRef(),
})
registry.registerPath({
  method: 'get',
  path: '/ngo/profile/past-projects',
  summary: 'Get past projects',
  security: auth,
  tags: ['NGO', 'Profile'],
  responses: okRef(),
})
registry.registerPath({
  method: 'put',
  path: '/ngo/profile/past-projects',
  summary: 'Replace past projects',
  security: auth,
  tags: ['NGO', 'Profile'],
  responses: okRef(),
})
registry.registerPath({
  method: 'get',
  path: '/ngo/profile/impact-metrics',
  summary: 'Get impact metrics',
  security: auth,
  tags: ['NGO', 'Profile'],
  responses: okRef(),
})
registry.registerPath({
  method: 'put',
  path: '/ngo/profile/impact-metrics',
  summary: 'Replace impact metrics',
  security: auth,
  tags: ['NGO', 'Profile'],
  responses: okRef(),
})
registry.registerPath({
  method: 'get',
  path: '/ngo/profile/stories',
  summary: 'List impact stories',
  security: auth,
  tags: ['NGO', 'Profile'],
  responses: okRef(),
})
registry.registerPath({
  method: 'post',
  path: '/ngo/profile/stories',
  summary: 'Add impact story',
  security: auth,
  tags: ['NGO', 'Profile'],
  responses: okRef(),
})
registry.registerPath({
  method: 'patch',
  path: '/ngo/profile/stories/{id}',
  summary: 'Update impact story',
  security: auth,
  tags: ['NGO', 'Profile'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: okRef(),
})
registry.registerPath({
  method: 'delete',
  path: '/ngo/profile/stories/{id}',
  summary: 'Delete impact story',
  security: auth,
  tags: ['NGO', 'Profile'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: okRef(),
})
registry.registerPath({
  method: 'get',
  path: '/ngo/profile/certifications',
  summary: 'List certifications',
  security: auth,
  tags: ['NGO', 'Profile'],
  responses: okRef(),
})
registry.registerPath({
  method: 'post',
  path: '/ngo/profile/certifications',
  summary: 'Add certification',
  security: auth,
  tags: ['NGO', 'Profile'],
  responses: okRef(),
})
registry.registerPath({
  method: 'patch',
  path: '/ngo/profile/certifications/{id}',
  summary: 'Update certification',
  security: auth,
  tags: ['NGO', 'Profile'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: okRef(),
})
registry.registerPath({
  method: 'delete',
  path: '/ngo/profile/certifications/{id}',
  summary: 'Delete certification',
  security: auth,
  tags: ['NGO', 'Profile'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: okRef(),
})
registry.registerPath({
  method: 'get',
  path: '/ngo/profile/documents',
  summary: 'List verification documents',
  security: auth,
  tags: ['NGO', 'Profile'],
  responses: okRef(),
})
registry.registerPath({
  method: 'get',
  path: '/ngo/profile/media',
  summary: 'List media files',
  security: auth,
  tags: ['NGO', 'Profile'],
  responses: okRef(),
})
registry.registerPath({
  method: 'post',
  path: '/ngo/profile/media',
  summary: 'Upload media file',
  security: auth,
  tags: ['NGO', 'Profile'],
  responses: okRef(),
})
registry.registerPath({
  method: 'delete',
  path: '/ngo/profile/media/{id}',
  summary: 'Delete media file',
  security: auth,
  tags: ['NGO', 'Profile'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: okRef(),
})
registry.registerPath({
  method: 'get',
  path: '/ngo/partnership-requests',
  summary: 'List partnership requests',
  security: auth,
  tags: ['NGO', 'Partnerships'],
  responses: okRef(),
})
registry.registerPath({
  method: 'post',
  path: '/ngo/projects/{id}/partnership/respond',
  summary: 'Respond to partnership request',
  security: auth,
  tags: ['NGO', 'Partnerships'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: okRef(),
})

registry.registerPath({
  method: 'get',
  path: '/ngo/communications/threads',
  summary: 'List NGO communication threads',
  security: auth,
  tags: ['NGO', 'Communications'],
  responses: okRef(),
})
registry.registerPath({
  method: 'get',
  path: '/ngo/communications/threads/{id}',
  summary: 'Get NGO thread',
  security: auth,
  tags: ['NGO', 'Communications'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: okRef(),
})
registry.registerPath({
  method: 'post',
  path: '/ngo/communications/threads/{id}/messages',
  summary: 'Post message in NGO thread',
  security: auth,
  tags: ['NGO', 'Communications'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: okRef(),
})
registry.registerPath({
  method: 'get',
  path: '/ngo/projects/{id}/crm/thread',
  summary: 'Get project CRM thread',
  security: auth,
  tags: ['NGO', 'Communications'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: okRef(),
})
registry.registerPath({
  method: 'get',
  path: '/ngo/projects/{id}/tasks',
  summary: 'List project tasks',
  security: auth,
  tags: ['NGO', 'Tasks'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: okRef(),
})
registry.registerPath({
  method: 'post',
  path: '/ngo/projects/{id}/tasks',
  summary: 'Create project task',
  security: auth,
  tags: ['NGO', 'Tasks'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: okRef(),
})
registry.registerPath({
  method: 'patch',
  path: '/ngo/projects/{id}/tasks/{taskId}',
  summary: 'Update task status',
  security: auth,
  tags: ['NGO', 'Tasks'],
  parameters: [
    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
    { name: 'taskId', in: 'path', required: true, schema: { type: 'string' } },
  ],
  responses: okRef(),
})
registry.registerPath({
  method: 'post',
  path: '/ngo/projects/{id}/milestones/{mid}/submit',
  summary: 'Submit milestone for review',
  security: auth,
  tags: ['NGO', 'Workflows'],
  parameters: [
    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
    { name: 'mid', in: 'path', required: true, schema: { type: 'string' } },
  ],
  responses: okRef(),
})
registry.registerPath({
  method: 'get',
  path: '/ngo/projects/{id}/timeline',
  summary: 'Get project timeline',
  security: auth,
  tags: ['NGO', 'Projects'],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: okRef(),
})
registry.registerPath({
  method: 'get',
  path: '/ngo/submissions',
  summary: 'List NGO submissions/inbox',
  security: auth,
  tags: ['NGO', 'Workflows'],
  responses: okRef(),
})
