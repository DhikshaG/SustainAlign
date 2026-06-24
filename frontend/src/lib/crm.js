import { api } from './api'

export async function fetchProjectTimeline(projectId, audience = 'corporate') {
  const base = audience === 'ngo' ? '/api/ngo' : '/api/corporate'
  const res = await api.get(`${base}/projects/${projectId}/timeline`)
  return res.data?.timeline ?? []
}

export async function fetchPartnershipRequests() {
  const res = await api.get('/api/ngo/partnership-requests')
  return res.data?.requests ?? []
}

export async function respondToPartnership(projectId, { action, note }) {
  const res = await api.post(`/api/ngo/projects/${projectId}/partnership/respond`, { action, note })
  return res.data
}

export async function submitMilestoneForReview(projectId, milestoneId, note) {
  const res = await api.post(`/api/ngo/projects/${projectId}/milestones/${milestoneId}/submit`, { note })
  return res.data
}

export async function fetchNgoSubmissions() {
  const res = await api.get('/api/ngo/submissions')
  return res.data?.items ?? []
}
