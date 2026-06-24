import { api } from './api'

export async function fetchProjects() {
  const res = await api.get('/api/corporate/projects')
  return res.data?.projects ?? []
}

export async function fetchProject(id) {
  const res = await api.get(`/api/corporate/projects/${id}`)
  return res.data
}

export async function createProject(payload) {
  const res = await api.post('/api/corporate/projects', payload)
  return res.data
}

export async function updateProject(id, payload) {
  const res = await api.patch(`/api/corporate/projects/${id}`, payload)
  return res.data
}

export async function addMilestone(projectId, payload) {
  const res = await api.post(`/api/corporate/projects/${projectId}/milestones`, payload)
  return res.data
}

export async function updateMilestone(projectId, milestoneId, payload) {
  const res = await api.patch(`/api/corporate/projects/${projectId}/milestones/${milestoneId}`, payload)
  return res.data
}

export async function deleteMilestone(projectId, milestoneId) {
  const res = await api.delete(`/api/corporate/projects/${projectId}/milestones/${milestoneId}`)
  return res.data
}

export async function postProjectUpdate(projectId, body) {
  const res = await api.post(`/api/corporate/projects/${projectId}/updates`, { body })
  return res.data
}

export async function fetchNgoProjects() {
  const res = await api.get('/api/ngo/projects')
  return res.data?.projects ?? []
}

export async function fetchNgoProject(id) {
  const res = await api.get(`/api/ngo/projects/${id}`)
  return res.data
}

export async function updateNgoMilestone(projectId, milestoneId, payload) {
  const res = await api.patch(`/api/ngo/projects/${projectId}/milestones/${milestoneId}`, payload)
  return res.data
}

export async function postNgoProjectUpdate(projectId, body) {
  const res = await api.post(`/api/ngo/projects/${projectId}/updates`, { body })
  return res.data
}

export const SCHEDULE_VII_OPTIONS = [
  'Promoting education',
  'Promoting health care',
  'Ensuring environmental sustainability',
  'Eradicating hunger, poverty and malnutrition',
  'Promoting gender equality and empowering women',
  'Ensuring availability of safe drinking water',
]

export const THEME_FROM_SCHEDULE = {
  'Promoting education': 'Education',
  'Promoting health care': 'Healthcare',
  'Ensuring environmental sustainability': 'Environment',
  'Eradicating hunger, poverty and malnutrition': 'Rural Development',
  'Promoting gender equality and empowering women': 'Women Empowerment',
  'Ensuring availability of safe drinking water': 'Environment',
}
