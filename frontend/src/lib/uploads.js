import { apiFetch } from './api'

export async function uploadFile(file, { category, entityType, entityId } = {}) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('category', category)
  if (entityType) formData.append('entityType', entityType)
  if (entityId) formData.append('entityId', entityId)

  return apiFetch('/api/files/upload', { method: 'POST', body: formData })
}

export async function listFiles(params = {}) {
  const qs = new URLSearchParams(params).toString()
  return apiFetch(`/api/files${qs ? `?${qs}` : ''}`)
}
