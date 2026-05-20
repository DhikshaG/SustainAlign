import { hash, verify } from '@node-rs/argon2'

const OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
}

export async function hashPassword(password) {
  return hash(password, OPTIONS)
}

export async function verifyPassword(password, passwordHash) {
  return verify(passwordHash, password, OPTIONS)
}
