/**
 * Auth-token storage + refresh-rotation client.
 *
 * Storage:
 *   - access token in localStorage as 'token' (legacy key kept for callers
 *     that still read it directly during the migration)
 *   - refresh token in localStorage as 'refresh_token'
 *
 * Rotation:
 *   - On 401 the API client (lib/api.js) calls refreshAccessToken()
 *   - Single-flight: concurrent 401s share one refresh promise to avoid
 *     stampedes against /api/auth/refresh
 *   - On refresh failure we clear everything and let the caller redirect
 *     to /auth/login
 */

// ---------- Storage primitives ----------

export function getToken() {
  return localStorage.getItem('token') || ''
}

export function setToken(token) {
  if (token) localStorage.setItem('token', token)
}

export function getRefreshToken() {
  return localStorage.getItem('refresh_token') || ''
}

export function setRefreshToken(token) {
  if (token) localStorage.setItem('refresh_token', token)
}

export function setTokens({ access_token, refresh_token } = {}) {
  if (access_token) setToken(access_token)
  if (refresh_token) setRefreshToken(refresh_token)
}

export function clearToken() {
  localStorage.removeItem('token')
  localStorage.removeItem('refresh_token')
}

// ---------- JWT inspection ----------

export function parseJwt(token) {
  try {
    const [, payload] = token.split('.')
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decodeURIComponent(escape(json)))
  } catch {
    return null
  }
}

export function isAuthenticated() {
  const token = getToken()
  if (!token) return false
  const payload = parseJwt(token)
  if (!payload || !payload.exp) return false
  const now = Math.floor(Date.now() / 1000)
  return payload.exp > now
}

export function getRole() {
  const token = getToken()
  if (!token) return null
  return parseJwt(token)?.role || null
}

// ---------- Refresh rotation (single-flight) ----------

let _refreshInFlight = null

/**
 * Refresh the access token. Returns the new access_token string on success,
 * or null on failure (in which case the caller should treat the user as
 * logged out and redirect to /auth/login).
 *
 * Concurrent calls share one in-flight request to prevent stampedes.
 */
export async function refreshAccessToken() {
  if (_refreshInFlight) return _refreshInFlight

  const refresh = getRefreshToken()
  if (!refresh) return null

  _refreshInFlight = (async () => {
    try {
      const res = await fetch(buildAuthUrl('/api/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refresh }),
      })
      if (!res.ok) {
        clearToken()
        return null
      }
      const data = await res.json()
      setTokens(data)
      return data.access_token || null
    } catch {
      clearToken()
      return null
    } finally {
      _refreshInFlight = null
    }
  })()

  return _refreshInFlight
}

/**
 * Logout: revoke the refresh token server-side, then clear local storage.
 * Idempotent — never throws.
 */
export async function logout() {
  const refresh = getRefreshToken()
  try {
    if (refresh) {
      await fetch(buildAuthUrl('/api/auth/logout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refresh }),
      })
    }
  } catch {
    // ignore — clearing local state is what matters
  } finally {
    clearToken()
  }
}

// ---------- URL helpers ----------

/**
 * Resolve a path against the configured API base. Reads VITE_API_BASE_URL
 * if set, otherwise relies on the dev proxy (path stays relative) so /api/*
 * is forwarded to the backend by Vite. In production builds set
 * VITE_API_BASE_URL to your backend origin.
 */
export function buildAuthUrl(path) {
  const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || ''
  if (!base) return path
  return base.replace(/\/$/, '') + path
}
