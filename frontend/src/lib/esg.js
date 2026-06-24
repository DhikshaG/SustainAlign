import { api } from './api'

export async function fetchUnifiedEsg(options = {}) {
  const params = new URLSearchParams()
  if (options.includeAi != null) params.set('includeAi', String(options.includeAi))
  const qs = params.toString()
  const res = await api.get(`/api/corporate/esg/unified${qs ? `?${qs}` : ''}`)
  return res.data
}

export async function fetchEsgSummary() {
  const res = await api.post('/api/corporate/ai/esg-summary', { includeAi: true })
  return res.data
}

export const ESG_PILLARS = [
  { id: 'environmental', label: 'Environmental' },
  { id: 'social', label: 'Social' },
  { id: 'governance', label: 'Governance' },
]
