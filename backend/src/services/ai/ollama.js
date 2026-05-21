import { env } from '../../config/env.js'

const DEFAULT_TIMEOUT_MS = 60000

export function isAiEnabled() {
  return env.AI_ENABLED !== false && env.AI_ENABLED !== 'false'
}

export async function ollamaChat({ messages, model }) {
  const baseUrl = env.OLLAMA_BASE_URL || 'http://localhost:11434'
  const modelName = model || env.OLLAMA_MODEL || 'llama3.1:1b'

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        messages,
        stream: false,
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Ollama error ${res.status}: ${text.slice(0, 200)}`)
    }

    const data = await res.json()
    return data.message?.content || ''
  } finally {
    clearTimeout(timeout)
  }
}

export async function checkOllamaHealth() {
  const baseUrl = env.OLLAMA_BASE_URL || 'http://localhost:11434'
  try {
    const res = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(5000) })
    return res.ok
  } catch {
    return false
  }
}

export async function isOllamaModelAvailable(model) {
  const baseUrl = env.OLLAMA_BASE_URL || 'http://localhost:11434'
  const modelName = model || env.OLLAMA_MODEL || 'llama3.1:1b'
  try {
    const res = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return false
    const data = await res.json()
    return (data.models || []).some((m) => m.name === modelName || m.name.startsWith(`${modelName}:`))
  } catch {
    return false
  }
}

export async function chatWithSystem(systemPrompt, userMessage, history = []) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-6),
    { role: 'user', content: userMessage },
  ]
  return ollamaChat({ messages })
}
