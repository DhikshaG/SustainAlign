import { api } from './api'

export async function fetchReports() {
  const res = await api.get('/api/corporate/reports')
  return res.data?.reports ?? []
}

export async function previewReport(payload) {
  const res = await api.post('/api/corporate/reports/preview', payload)
  return res.data
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

export async function downloadReportFile(report, apiClient) {
  if (!report?.downloadUrl) return
  const blob = await apiClient.download(report.downloadUrl)
  const ext = report.format || 'pdf'
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${report.type}-${report.periodStart}.${ext}`
  a.click()
  URL.revokeObjectURL(url)
}

export const REPORT_TYPES = [
  { id: 'executive', label: 'Executive Summary' },
  { id: 'impact_stories', label: 'Impact Stories' },
  { id: 'quarterly', label: 'Quarterly Report' },
  { id: 'board', label: 'Board Presentation' },
]

export const REPORT_FORMATS = [
  { id: 'pdf', label: 'PDF' },
  { id: 'docx', label: 'Word (DOCX)' },
  { id: 'pptx', label: 'PowerPoint (PPTX)' },
]

export const FY_OPTIONS = ['FY 2025-26', 'FY 2024-25', 'FY 2023-24']
