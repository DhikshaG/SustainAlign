import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from './password.js'

describe('password', () => {
  describe('hashPassword', () => {
    it('returns a non-empty string', async () => {
      const hash = await hashPassword('MyP@ssw0rd!')
      expect(hash).toBeTypeOf('string')
      expect(hash.length).toBeGreaterThan(20)
    })
  })

  describe('verifyPassword', () => {
    it('returns true for the correct password', async () => {
      const hash = await hashPassword('MyP@ssw0rd!')
      const result = await verifyPassword('MyP@ssw0rd!', hash)
      expect(result).toBe(true)
    })

    it('returns false for an incorrect password', async () => {
      const hash = await hashPassword('MyP@ssw0rd!')
      const result = await verifyPassword('WrongPassword123', hash)
      expect(result).toBe(false)
    })

    it('throws for an invalid hash format', async () => {
      await expect(verifyPassword('password', 'not-a-valid-hash')).rejects.toThrow()
    })
  })
})
