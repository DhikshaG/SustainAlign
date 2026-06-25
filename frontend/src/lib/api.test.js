import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./auth', () => ({
  getAccessToken: vi.fn(),
  refreshAccessToken: vi.fn(),
  clearTokens: vi.fn(),
}))

const { getAccessToken, refreshAccessToken } = await import('./auth')

vi.stubGlobal('fetch', vi.fn())

beforeEach(() => {
  vi.clearAllMocks()
  fetch.mockReset()
})

describe('apiFetch', () => {
  it('sends GET request without auth when no token', async () => {
    getAccessToken.mockReturnValue(null)
    fetch.mockResolvedValue({ ok: true, status: 200, text: () => Promise.resolve('{"data":"ok"}') })

    const { apiFetch } = await import('./api.js')
    const result = await apiFetch('/api/test')
    expect(fetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: {},
      }),
    )
    expect(result).toEqual({ data: 'ok' })
  })

  it('attaches Bearer token when available', async () => {
    getAccessToken.mockReturnValue('test-token')
    fetch.mockResolvedValue({ ok: true, status: 200, text: () => Promise.resolve('{"data":"ok"}') })

    const { apiFetch } = await import('./api.js')
    await apiFetch('/api/test')
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: { Authorization: 'Bearer test-token' },
      }),
    )
  })

  it('auto-refreshes on 401 and retries', async () => {
    getAccessToken.mockReturnValue('expired-token')
    refreshAccessToken.mockResolvedValue()

    let callCount = 0
    fetch.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return Promise.resolve({ ok: false, status: 401, text: () => Promise.resolve('{"message":"unauthorized"}') })
      }
      return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve('{"data":"refreshed"}') })
    })

    const { apiFetch } = await import('./api.js')
    const result = await apiFetch('/api/test')
    expect(refreshAccessToken).toHaveBeenCalled()
    expect(callCount).toBe(2)
    expect(result).toEqual({ data: 'refreshed' })
  })
})

describe('api convenience methods', () => {
  it('api.get calls apiFetch with GET', async () => {
    getAccessToken.mockReturnValue(null)
    fetch.mockResolvedValue({ ok: true, status: 200, text: () => Promise.resolve('{}') })
    const { api } = await import('./api.js')
    await api.get('/api/test')
    expect(fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({ headers: {} }))
  })

  it('api.post calls apiFetch with POST and body', async () => {
    getAccessToken.mockReturnValue(null)
    fetch.mockResolvedValue({ ok: true, status: 200, text: () => Promise.resolve('{}') })
    const { api } = await import('./api.js')
    await api.post('/api/test', { foo: 'bar' })
    expect(fetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(String),
      }),
    )
  })
})
