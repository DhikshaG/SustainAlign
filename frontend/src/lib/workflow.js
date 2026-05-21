import { apiFetch } from './api'

export async function fetchWorkflowInbox() {
  return apiFetch('/api/workflows/inbox')
}

export async function submitNgoReport(title) {
  return apiFetch('/api/ngo/reports', { method: 'POST', body: { title } })
}

export async function transitionWorkflow(id, action, comment) {
  return apiFetch(`/api/workflows/instances/${id}/transition`, {
    method: 'POST',
    body: { action, comment },
  })
}

export async function getWorkflow(id) {
  return apiFetch(`/api/workflows/instances/${id}`)
}
