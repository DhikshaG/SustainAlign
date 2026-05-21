import { api } from './api'

export async function fetchMatchDefaults() {
  const res = await api.get('/api/corporate/discovery/match-defaults')
  return res.data ?? {}
}

export async function runNgoMatch(criteria) {
  const res = await api.post('/api/corporate/ai/match-ngos', criteria)
  return res.data
}

/** @deprecated use runNgoMatch */
export async function matchNgos(payload) {
  return runNgoMatch(payload)
}

export function riskBand(score) {
  if (score == null) return { label: 'Unknown', variant: 'default' }
  if (score <= 25) return { label: 'Low', variant: 'verified' }
  if (score <= 50) return { label: 'Medium', variant: 'warning' }
  return { label: 'High', variant: 'warning' }
}
