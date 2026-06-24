import { api } from './api'

function base(audience = 'corporate') {
  return audience === 'ngo' ? '/api/ngo' : '/api/corporate'
}

export async function fetchProjectTasks(projectId, audience = 'corporate') {
  const res = await api.get(`${base(audience)}/projects/${projectId}/tasks`)
  return res.data?.tasks ?? []
}

export async function createProjectTask(projectId, payload, audience = 'corporate') {
  const res = await api.post(`${base(audience)}/projects/${projectId}/tasks`, payload)
  return res.data
}

export async function updateProjectTask(projectId, taskId, payload, audience = 'corporate') {
  const res = await api.patch(`${base(audience)}/projects/${projectId}/tasks/${taskId}`, payload)
  return res.data
}
