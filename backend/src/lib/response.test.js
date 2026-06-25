import { describe, it, expect, vi } from 'vitest'
import { ok, created, fail } from './response.js'

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  }
}

describe('response helpers', () => {
  describe('ok', () => {
    it('returns 200 with ok:true and message', () => {
      const res = mockRes()
      ok(res, { id: 1 })
      expect(res.json).toHaveBeenCalledWith({ ok: true, message: 'ok', data: { id: 1 } })
    })

    it('works without data', () => {
      const res = mockRes()
      ok(res)
      expect(res.json).toHaveBeenCalledWith({ ok: true, message: 'ok', data: null })
    })

    it('accepts custom message', () => {
      const res = mockRes()
      ok(res, null, 'custom')
      expect(res.json).toHaveBeenCalledWith({ ok: true, message: 'custom', data: null })
    })
  })

  describe('created', () => {
    it('returns 201 with ok:true', () => {
      const res = mockRes()
      created(res, { id: 42 })
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({ ok: true, message: 'created', data: { id: 42 } })
    })
  })

  describe('fail', () => {
    it('returns given status with ok:false', () => {
      const res = mockRes()
      fail(res, 400, 'Bad request', { field: ['required'] })
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ ok: false, message: 'Bad request', errors: { field: ['required'] } })
    })

    it('works without errors', () => {
      const res = mockRes()
      fail(res, 404, 'Not found')
      expect(res.json).toHaveBeenCalledWith({ ok: false, message: 'Not found', errors: null })
    })
  })
})
