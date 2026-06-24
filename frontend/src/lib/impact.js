import { api } from './api'

export async function fetchDashboardSummary() {
  const res = await api.get('/api/corporate/dashboard/summary')
  return res.data
}

export async function fetchReportingOverview() {
  const res = await api.get('/api/corporate/reporting/overview')
  return res.data
}

export async function fetchImpactLive() {
  const res = await api.get('/api/corporate/impact/live')
  return res.data
}

export async function generateImpactSummary() {
  const res = await api.post('/api/corporate/ai/impact-summary')
  return res.data
}

export async function addProjectKpi(projectId, payload, audience = 'corporate') {
  const base = audience === 'ngo' ? '/api/ngo' : '/api/corporate'
  const res = await api.post(`${base}/projects/${projectId}/kpis`, payload)
  return res.data
}

export async function addBeneficiaryLog(projectId, payload, audience = 'corporate') {
  const base = audience === 'ngo' ? '/api/ngo' : '/api/corporate'
  const res = await api.post(`${base}/projects/${projectId}/beneficiaries`, payload)
  return res.data
}

export async function addGeoUpdate(projectId, payload, audience = 'corporate') {
  const base = audience === 'ngo' ? '/api/ngo' : '/api/corporate'
  const res = await api.post(`${base}/projects/${projectId}/geo`, payload)
  return res.data
}

export async function fetchNgoBeneficiaryLogs() {
  const res = await api.get('/api/ngo/beneficiaries')
  return res.data?.logs ?? []
}

export async function attachUpdateFiles(projectId, updateId, fileIds, audience = 'corporate') {
  const base = audience === 'ngo' ? '/api/ngo' : '/api/corporate'
  const res = await api.post(`${base}/projects/${projectId}/updates/${updateId}/files`, { fileIds })
  return res.data
}

export async function fetchNgoDashboardSummary() {
  const res = await api.get('/api/ngo/dashboard/summary')
  return res.data
}
