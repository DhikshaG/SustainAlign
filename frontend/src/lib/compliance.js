import { api } from './api'

export async function fetchComplianceSummary() {
  const res = await api.get('/api/corporate/compliance/summary')
  return res.data
}

export async function updateComplianceProfile(payload) {
  const res = await api.patch('/api/corporate/compliance/profile', payload)
  return res.data
}

export async function acknowledgeAlert(id) {
  const res = await api.patch(`/api/corporate/compliance/alerts/${id}/acknowledge`)
  return res.data
}

export async function fetchFundAllocation() {
  const res = await api.get('/api/corporate/funds/allocation')
  return res.data
}
