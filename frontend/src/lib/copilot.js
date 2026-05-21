import { api } from './api'

export async function fetchCopilotSuggestions() {
  const res = await api.get('/api/corporate/copilot/suggestions')
  return res.data?.suggestions ?? []
}

export async function sendCopilotMessage(message, history = []) {
  const res = await api.post('/api/corporate/copilot/chat', { message, history })
  return res.data
}

export async function matchNgos(payload) {
  const res = await api.post('/api/corporate/ai/match-ngos', payload)
  return res.data
}

export async function aiSearch(query) {
  const res = await api.post('/api/corporate/ai/search', { query })
  return res.data
}
