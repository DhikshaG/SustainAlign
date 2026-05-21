import { apiFetch } from './api'

export async function fetchTagCategories() {
  return apiFetch('/api/tags')
}

export async function fetchEntityTags(entityType, entityId) {
  return apiFetch(`/api/entities/${entityType}/${entityId}/tags`)
}

export async function saveEntityTags(entityType, entityId, tagIds) {
  return apiFetch(`/api/entities/${entityType}/${entityId}/tags`, {
    method: 'PUT',
    body: { tagIds },
  })
}
