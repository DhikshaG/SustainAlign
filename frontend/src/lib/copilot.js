import { api } from './api'

export async function fetchCopilotSuggestions() {
  const res = await api.get('/api/corporate/copilot/suggestions')
  return res.data?.suggestions ?? []
}

export async function sendCopilotMessage(message, history = []) {
  const res = await api.post('/api/corporate/copilot/chat', { message, history })
  return res.data
}

export { runNgoMatch, matchNgos, fetchMatchDefaults } from './matching.js'

export async function aiSearch(query) {
  const res = await api.post('/api/corporate/ai/search', { query })
  return res.data
}
