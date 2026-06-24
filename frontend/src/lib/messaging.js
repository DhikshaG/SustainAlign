import { api } from './api'

function base(audience = 'corporate') {
  return audience === 'ngo' ? '/api/ngo' : '/api/corporate'
}

export async function fetchThreads(audience = 'corporate') {
  const res = await api.get(`${base(audience)}/communications/threads`)
  return res.data?.threads ?? []
}

export async function fetchThread(threadId, audience = 'corporate') {
  const res = await api.get(`${base(audience)}/communications/threads/${threadId}`)
  return res.data
}

export async function createThread(payload, audience = 'corporate') {
  const res = await api.post(`${base(audience)}/communications/threads`, payload)
  return res.data
}

export async function postMessage(threadId, body, audience = 'corporate') {
  const res = await api.post(`${base(audience)}/communications/threads/${threadId}/messages`, { body })
  return res.data
}

export async function fetchProjectThread(projectId, audience = 'corporate') {
  const res = await api.get(`${base(audience)}/projects/${projectId}/crm/thread`)
  return res.data
}
