import { api } from './api'

export async function fetchNgoProfile() {
  const res = await api.get('/api/ngo/profile')
  return res.data
}

export async function updateNgoProfile(body) {
  const res = await api.patch('/api/ngo/profile', body)
  return res.data
}

export async function fetchPublicNgos() {
  const res = await api.get('/api/ngos')
  return res.data
}

export async function fetchPublicNgo(slug) {
  const res = await api.get(`/api/ngos/${slug}`)
  return res.data
}

export async function fetchCorporateNgos(params = {}) {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '' && v !== 'All' && v !== 'all') qs.set(k, v)
  }
  const q = qs.toString()
  const res = await api.get(`/api/corporate/discovery/ngos${q ? `?${q}` : ''}`)
  return res.data?.ngos ?? []
}

export async function fetchCorporateNgo(slug) {
  const res = await api.get(`/api/corporate/ngos/${slug}`)
  return res.data
}

export async function saveTeam(members) {
  const res = await api.put('/api/ngo/profile/team', { members })
  return res.data
}

export async function savePastProjects(projects) {
  const res = await api.put('/api/ngo/profile/past-projects', { projects })
  return res.data
}

export async function saveImpactMetrics(metrics) {
  const res = await api.put('/api/ngo/profile/impact-metrics', { metrics })
  return res.data
}

export async function addStory(story) {
  const res = await api.post('/api/ngo/profile/stories', story)
  return res.data
}

export async function addCertification(cert) {
  const res = await api.post('/api/ngo/profile/certifications', cert)
  return res.data
}

export async function uploadNgoMedia(file, category) {
  const form = new FormData()
  form.append('file', file)
  form.append('category', category)
  const res = await api.post('/api/ngo/profile/media', form)
  return res.data
}

export async function fetchVerificationQueue() {
  const res = await api.get('/api/admin/ngo-verification')
  return res.data?.queue || []
}

export async function approveNgo(tenantId) {
  return api.post(`/api/admin/ngo-verification/${tenantId}/approve`)
}

export async function rejectNgo(tenantId, reason) {
  return api.post(`/api/admin/ngo-verification/${tenantId}/reject`, { reason })
}
