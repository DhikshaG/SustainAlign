import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { SignJWT, jwtVerify } from 'jose'
import { env } from '../config/env.js'

function secret(type) {
  const value = type === 'refresh' ? env.JWT_REFRESH_SECRET : env.JWT_SECRET
  return new TextEncoder().encode(value)
}

export function newJti() {
  return randomUUID()
}

export async function createAccessToken(payload) {
  const ttl = env.ACCESS_TOKEN_TTL_MINUTES
  return new SignJWT({ ...payload, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setJti(payload.jti || newJti())
    .setIssuedAt()
    .setExpirationTime(`${ttl}m`)
    .sign(secret('access'))
}

export async function createRefreshToken(payload) {
  const jti = payload.jti || newJti()
  const ttlDays = env.REFRESH_TOKEN_TTL_DAYS
  const token = await new SignJWT({ ...payload, type: 'refresh', jti })
    .setProtectedHeader({ alg: 'HS256' })
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(`${ttlDays}d`)
    .sign(secret('refresh'))
  return { token, jti, expiresAt: new Date(Date.now() + ttlDays * 86400000) }
}

export async function decodeAccessToken(token) {
  const { payload } = await jwtVerify(token, secret('access'))
  if (payload.type !== 'access') throw new Error('Invalid token type')
  return payload
}

export async function decodeRefreshToken(token) {
  const { payload } = await jwtVerify(token, secret('refresh'))
  if (payload.type !== 'refresh') throw new Error('Invalid token type')
  return payload
}

export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export function generateResetToken() {
  return randomBytes(32).toString('hex')
}
