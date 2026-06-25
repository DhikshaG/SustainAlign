import { describe, it, expect } from 'vitest'
import {
  newJti,
  createAccessToken,
  createRefreshToken,
  decodeAccessToken,
  decodeRefreshToken,
  hashToken,
  generateOtp,
  generateResetToken,
} from './tokens.js'

describe('tokens', () => {
  describe('newJti', () => {
    it('generates a UUID string', () => {
      const jti = newJti()
      expect(jti).toBeTypeOf('string')
      expect(jti).toMatch(/^[0-9a-f-]{36}$/)
    })

    it('generates unique values', () => {
      const a = newJti()
      const b = newJti()
      expect(a).not.toBe(b)
    })
  })

  describe('createAccessToken / decodeAccessToken', () => {
    it('creates and decodes a valid access token', async () => {
      const payload = { sub: 'user1', tenantId: 't1', role: 'super_admin', tenantType: 'corporate' }
      const token = await createAccessToken(payload)
      expect(token).toBeTypeOf('string')

      const decoded = await decodeAccessToken(token)
      expect(decoded.sub).toBe('user1')
      expect(decoded.tenantId).toBe('t1')
      expect(decoded.role).toBe('super_admin')
      expect(decoded.type).toBe('access')
    })

    it('rejects a refresh token when decoded with access secret', async () => {
      const { token } = await createRefreshToken({ sub: 'user1', tenantId: 't1', role: 'ngo_admin', tenantType: 'ngo' })
      await expect(decodeAccessToken(token)).rejects.toThrow('signature verification failed')
    })
  })

  describe('createRefreshToken', () => {
    it('returns token, jti, and expiresAt', async () => {
      const result = await createRefreshToken({ sub: 'user1', tenantId: 't1', role: 'super_admin', tenantType: 'corporate' })
      expect(result.token).toBeTypeOf('string')
      expect(result.jti).toBeTypeOf('string')
      expect(result.expiresAt).toBeInstanceOf(Date)
    })

    it('decodes successfully', async () => {
      const { token } = await createRefreshToken({ sub: 'user1', tenantId: 't1', role: 'super_admin', tenantType: 'corporate' })
      const decoded = await decodeRefreshToken(token)
      expect(decoded.type).toBe('refresh')
    })

    it('rejects an access token when decoded as refresh', async () => {
      const token = await createAccessToken({ sub: 'user1', tenantId: 't1', role: 'super_admin', tenantType: 'corporate' })
      await expect(decodeRefreshToken(token)).rejects.toThrow()
    })
  })

  describe('hashToken', () => {
    it('returns a hex string', () => {
      const hash = hashToken('some-token-value')
      expect(hash).toMatch(/^[0-9a-f]{64}$/)
    })

    it('is deterministic', () => {
      const a = hashToken('hello')
      const b = hashToken('hello')
      expect(a).toBe(b)
    })
  })

  describe('generateOtp', () => {
    it('returns a 6-digit string', () => {
      const otp = generateOtp()
      expect(otp).toMatch(/^\d{6}$/)
    })
  })

  describe('generateResetToken', () => {
    it('returns a hex string of 64 characters', () => {
      const token = generateResetToken()
      expect(token).toMatch(/^[0-9a-f]{64}$/)
    })
  })
})
