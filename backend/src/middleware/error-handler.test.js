import { describe, it, expect, vi } from 'vitest'
import { notFound, errorHandler } from './error-handler.js'

vi.mock('../config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
  },
}))

function mockReq(path = '/api/test') {
  return { method: 'GET', path, id: 'req-123', headers: {} }
}

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  }
}

describe('error-handler', () => {
  describe('notFound', () => {
    it('returns 404 with route not found message', () => {
      const req = mockReq()
      const res = mockRes()
      notFound(req, res)
      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ ok: false, message: 'Route not found' })
    })
  })

  describe('errorHandler', () => {
    it('returns 500 for unexpected errors', () => {
      const req = mockReq()
      const res = mockRes()
      const err = new Error('Something broke')
      errorHandler(err, req, res)
      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ ok: false, message: 'Something broke' })
    })

    it('returns operational error status and message for 4xx errors', () => {
      const req = mockReq()
      const res = mockRes()
      const err = Object.assign(new Error('Validation failed'), { status: 400, errors: { field: ['required'] } })
      errorHandler(err, req, res)
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ ok: false, message: 'Validation failed', errors: { field: ['required'] } })
    })

    it('does not leak internal error details in production', async () => {
      vi.resetModules()
      vi.doMock('../config/env.js', () => ({
        env: { NODE_ENV: 'production' },
      }))
      const { errorHandler: prodHandler } = await import('./error-handler.js')
      const req = mockReq()
      const res = mockRes()
      const err = new Error('Secret internal failure')
      prodHandler(err, req, res)
      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ ok: false, message: 'Internal server error' })
    })

    it('returns errors array in non-production', () => {
      const req = mockReq()
      const res = mockRes()
      const validationErr = Object.assign(new Error('Bad request'), {
        status: 422,
        errors: { email: ['invalid format'] },
      })
      errorHandler(validationErr, req, res)
      expect(res.status).toHaveBeenCalledWith(422)
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        message: 'Bad request',
        errors: { email: ['invalid format'] },
      })
    })

    it('handles error without status as 500', () => {
      const req = mockReq()
      const res = mockRes()
      errorHandler(new Error('No status'), req, res)
      expect(res.status).toHaveBeenCalledWith(500)
    })
  })
})
