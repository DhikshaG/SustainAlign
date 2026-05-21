import { api } from './api'

export async function fetchReports() {
  const res = await api.get('/api/corporate/reports')
  return res.data?.reports ?? []
}

export async function generateReport(payload) {
  const res = await api.post('/api/corporate/reports/generate', payload)
  return res.data
}

export async function submitReport(id) {
  const res = await api.post(`/api/corporate/reports/${id}/submit`)
  return res.data
}

export async function generateNarrative(payload) {
  const res = await api.post('/api/corporate/ai/narrative', payload)
  return res.data
}
