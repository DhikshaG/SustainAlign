import { api } from './api'
import { getAccessToken } from './auth'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

function qs(params) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '') q.set(k, v)
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}

export async function fetchAuditTrail(params = {}) {
  const res = await api.get(`/api/corporate/audit/trail${qs(params)}`)
  return res.data?.trail ?? []
}

export async function fetchAuditFolders(params = {}) {
  const res = await api.get(`/api/corporate/audit/folders${qs(params)}`)
  return res.data?.folders ?? []
}

export async function exportAuditPackage(scope = {}) {
  const url = `${BASE_URL}/api/corporate/audit/export`
  const headers = { 'Content-Type': 'application/json' }
  const token = getAccessToken()
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(scope) })
  if (!res.ok) throw new Error(`Export failed (${res.status})`)
  return res.blob()
}

export async function fetchDocuments() {
  const res = await api.get('/api/corporate/documents')
  return res.data ?? { files: [], groups: {} }
}

export async function fetchFileVersions(fileId) {
  const res = await api.get(`/api/corporate/files/${fileId}/versions`)
  return res.data?.versions ?? []
}

export async function fetchAdminAuditTrail(params = {}) {
  const res = await api.get(`/api/admin/audit/trail${qs(params)}`)
  return res.data?.trail ?? []
}

export const TAB_CATEGORIES = {
  Evidence: 'project_evidence',
  Invoices: 'invoice',
  'Utilization Certificates': 'compliance',
}

export const CATEGORY_TABS = Object.keys(TAB_CATEGORIES)
