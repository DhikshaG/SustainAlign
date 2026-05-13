/**
 * Canonical authenticated fetch client.
 *
 * Features:
 *   - Auto-attaches Authorization: Bearer <access_token> when present.
 *   - On 401 it calls refreshAccessToken() once and retries the request.
 *     If refresh fails or the retry still 401s, the user is logged out
 *     locally and the caller receives an error.
 *   - Resolves relative paths against VITE_API_BASE_URL when set; otherwise
 *     leaves them as-is so Vite's dev proxy forwards them.
 *
 * Other lib/*Api.js modules should migrate to this client over time. While
 * they migrate, they can keep their own fetch calls; just ensure those send
 * the Authorization header (use getToken() from lib/auth.js).
 */

import {
  buildAuthUrl,
  clearToken,
  getToken,
  refreshAccessToken,
} from './auth.js'

class ApiError extends Error {
  constructor(message, { status, data } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

function withAuthHeader(init = {}) {
  const token = getToken()
  const headers = new Headers(init.headers || {})
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  return { ...init, headers }
}

async function readError(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

/**
 * Low-level authenticated fetch. Handles token refresh on 401.
 *
 * @param {string} path  - URL or path (resolved via buildAuthUrl)
 * @param {RequestInit} init
 * @returns {Promise<Response>}
 */
export async function authedFetch(path, init = {}) {
  const url = path.startsWith('http') ? path : buildAuthUrl(path)

  let res = await fetch(url, withAuthHeader(init))
  if (res.status !== 401) return res

  const newAccess = await refreshAccessToken()
  if (!newAccess) {
    clearToken()
    return res
  }

  res = await fetch(url, withAuthHeader(init))
  if (res.status === 401) {
    clearToken()
  }
  return res
}

async function request(method, path, body) {
  const init = { method }
  if (body !== undefined) {
    init.body = JSON.stringify(body)
  }
  const res = await authedFetch(path, init)
  if (!res.ok) {
    const data = await readError(res)
    const message = (data && (data.error || data.message)) || `Request failed (${res.status})`
    throw new ApiError(message, { status: res.status, data })
  }
  if (res.status === 204) return null
  try {
    return await res.json()
  } catch {
    return null
  }
}

export function apiGet(path) {
  return request('GET', path)
}

export function apiPost(path, body) {
  return request('POST', path, body)
}

export function apiPut(path, body) {
  return request('PUT', path, body)
}

export function apiPatch(path, body) {
  return request('PATCH', path, body)
}

export function apiDelete(path) {
  return request('DELETE', path)
}

export { ApiError }
