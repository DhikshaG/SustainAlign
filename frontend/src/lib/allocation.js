import { api } from './api'

export async function fetchFundIntelligence(payload = {}) {
  const res = await api.post('/api/corporate/funds/intelligence', payload)
  return res.data
}

export const ALLOCATION_SCENARIOS = [
  { id: 'baseline', label: 'Baseline' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'aggressive', label: 'Aggressive' },
]

export const SDG_FOCUS_OPTIONS = [
  { sdg: 1, label: 'SDG 1 — No Poverty' },
  { sdg: 3, label: 'SDG 3 — Good Health' },
  { sdg: 4, label: 'SDG 4 — Quality Education' },
  { sdg: 5, label: 'SDG 5 — Gender Equality' },
  { sdg: 6, label: 'SDG 6 — Clean Water' },
  { sdg: 8, label: 'SDG 8 — Decent Work' },
  { sdg: 13, label: 'SDG 13 — Climate Action' },
]
