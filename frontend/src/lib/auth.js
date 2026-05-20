const TOKEN_KEY = 'token'
const REFRESH_KEY = 'refresh_token'
const USER_KEY = 'user'
const MFA_SESSION_KEY = 'mfa_session_id'

let refreshPromise = null

export function setTokens(data) {
  if (data.access_token) localStorage.setItem(TOKEN_KEY, data.access_token)
  if (data.refresh_token) localStorage.setItem(REFRESH_KEY, data.refresh_token)
  if (data.user) localStorage.setItem(USER_KEY, JSON.stringify(data.user))
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY)
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY)
  try {
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
}

export function setMfaSessionId(id) {
  sessionStorage.setItem(MFA_SESSION_KEY, id)
}

export function getMfaSessionId() {
  return sessionStorage.getItem(MFA_SESSION_KEY)
}

export function clearMfaSessionId() {
  sessionStorage.removeItem(MFA_SESSION_KEY)
}

export function parseJwt(token) {
  if (!token) return null
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

export function getRole() {
  return getStoredUser()?.role || parseJwt(getAccessToken())?.role
}

export function isAuthenticated() {
  return Boolean(getAccessToken())
}

export async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) throw new Error('No refresh token')

    const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    const data = await res.json()
    if (!res.ok) {
      clearTokens()
      throw new Error(data.message || 'Session expired')
    }

    setTokens(data.data)
    return data.data
  })().finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

export async function logout() {
  const refreshToken = getRefreshToken()
  const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
  try {
    if (refreshToken) {
      await fetch(`${BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
    }
  } finally {
    clearTokens()
    clearMfaSessionId()
  }
}
