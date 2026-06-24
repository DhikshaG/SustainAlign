import { getAccessToken, refreshAccessToken, clearTokens } from './auth'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

async function parseResponse(res) {
  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { message: text }
  }
  if (!res.ok) {
    throw new ApiError(
      data?.message || data?.error || `Request failed (${res.status})`,
      res.status,
      data,
    )
  }
  return data
}

export async function apiFetch(path, options = {}, retried = false) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`
  const headers = { ...options.headers }
  const token = getAccessToken()
  if (token) headers.Authorization = `Bearer ${token}`

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json'
    options.body = JSON.stringify(options.body)
  }

  const res = await fetch(url, { ...options, headers })

  if (res.status === 401 && !retried && getAccessToken()) {
    try {
      await refreshAccessToken()
      return apiFetch(path, options, true)
    } catch {
      clearTokens()
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login/corporate'
      }
      throw new ApiError('Session expired', 401, null)
    }
  }

  return parseResponse(res)
}

export async function apiDownload(path) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`
  const headers = {}
  const token = getAccessToken()
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(url, { headers })
  if (res.status === 401 && getAccessToken()) {
    await refreshAccessToken()
    return apiDownload(path)
  }
  if (!res.ok) {
    throw new ApiError(`Download failed (${res.status})`, res.status, null)
  }
  return res.blob()
}

export const api = {
  get: (path) => apiFetch(path),
  post: (path, body) => apiFetch(path, { method: 'POST', body }),
  put: (path, body) => apiFetch(path, { method: 'PUT', body }),
  patch: (path, body) => apiFetch(path, { method: 'PATCH', body }),
  delete: (path) => apiFetch(path, { method: 'DELETE' }),
  download: apiDownload,
}
