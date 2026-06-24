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

export async function fetchMcaExport() {
  const res = await api.get('/api/corporate/compliance/mca-export')
  return res.data
}

export async function runComplianceCheck() {
  const res = await api.post('/api/corporate/compliance/run-check')
  return res.data
}

/** FY 2025-26 → { periodStart, periodEnd } */
export function fyToPeriod(fyLabel = 'FY 2025-26') {
  const match = fyLabel.match(/(\d{4})-(\d{2})/)
  if (!match) return { periodStart: '2025-04-01', periodEnd: '2026-03-31' }
  const startYear = parseInt(match[1], 10)
  const endYear = match[2].length === 2 ? 2000 + parseInt(match[2], 10) : parseInt(match[2], 10)
  return {
    periodStart: `${startYear}-04-01`,
    periodEnd: `${endYear}-03-31`,
  }
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
