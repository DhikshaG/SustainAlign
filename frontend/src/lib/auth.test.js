import { describe, it, expect, beforeEach } from 'vitest'

const TOKEN_KEY = 'token'
const REFRESH_KEY = 'refresh_token'
const USER_KEY = 'user'
const MFA_SESSION_KEY = 'mfa_session_id'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('auth lib', () => {
  it('setTokens stores access token, refresh token, and user', async () => {
    const { setTokens, getAccessToken, getRefreshToken, getStoredUser } = await import('./auth.js')
    setTokens({ access_token: 'at', refresh_token: 'rt', user: { id: 'u1', name: 'Test' } })
    expect(getAccessToken()).toBe('at')
    expect(getRefreshToken()).toBe('rt')
    expect(getStoredUser()).toEqual({ id: 'u1', name: 'Test' })
  })

  it('clearTokens removes all stored tokens', async () => {
    const { setTokens, clearTokens, getAccessToken, getRefreshToken, getStoredUser } = await import('./auth.js')
    setTokens({ access_token: 'at', refresh_token: 'rt', user: { id: 'u1' } })
    clearTokens()
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
    expect(getStoredUser()).toBeNull()
  })

  it('parseJwt decodes a JWT payload', async () => {
    const { parseJwt } = await import('./auth.js')
    const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1MSIsInJvbGUiOiJhZG1pbiJ9.xxx'
    const decoded = parseJwt(token)
    expect(decoded).toMatchObject({ sub: 'u1', role: 'admin' })
  })

  it('parseJwt returns null for invalid token', async () => {
    const { parseJwt } = await import('./auth.js')
    expect(parseJwt(null)).toBeNull()
    expect(parseJwt('not-a-token')).toBeNull()
  })

  it('isAuthenticated returns true when token exists', async () => {
    const { isAuthenticated, setTokens } = await import('./auth.js')
    expect(isAuthenticated()).toBe(false)
    setTokens({ access_token: 'at' })
    expect(isAuthenticated()).toBe(true)
  })

  it('getRole returns role from stored user', async () => {
    const { setTokens, getRole } = await import('./auth.js')
    setTokens({ user: { role: 'admin' } })
    expect(getRole()).toBe('admin')
  })

  it('MFA session helpers work', async () => {
    const { setMfaSessionId, getMfaSessionId, clearMfaSessionId } = await import('./auth.js')
    expect(getMfaSessionId()).toBeNull()
    setMfaSessionId('sid-123')
    expect(getMfaSessionId()).toBe('sid-123')
    clearMfaSessionId()
    expect(getMfaSessionId()).toBeNull()
  })
})
