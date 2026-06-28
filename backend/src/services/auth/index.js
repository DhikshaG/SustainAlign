import { eq, and, isNull } from 'drizzle-orm'
import { db } from '../../db/index.js'
import {
  users,
  tenants,
  memberships,
  refreshTokens,
  mfaChallenges,
  passwordResetTokens,
  invitations,
  ngoProfiles,
  ngoDocuments,
} from '../../db/schema.js'
import { env } from '../../config/env.js'
import { hashPassword, verifyPassword } from '../../lib/password.js'
import {
  createAccessToken,
  createRefreshToken,
  decodeRefreshToken,
  hashToken,
  generateOtp,
  generateResetToken,
  newJti,
} from '../../lib/tokens.js'
import { newId, uniqueSlug } from '../../lib/ids.js'
import { sendMfaCode, sendPasswordReset, sendInvitation } from '../../lib/email.js'
import { authLog } from '../../lib/auth-log.js'
import { getPermissionsForRole } from '../../lib/permissions.js'
import { logActivity, logMutation } from '../activity-log/index.js'
import { storeFile } from '../files/index.js'
import { notifyPlatformAdmins } from '../notifications/index.js'

const MFA_TTL_MS = 10 * 60 * 1000
const RESET_TTL_MS = 60 * 60 * 1000
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000

async function loadUserContext(userId) {
  const user = await db.select().from(users).where(eq(users.id, userId)).get()
  if (!user) return null

  const membership = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.status, 'active')))
    .get()
  if (!membership) return null

  const tenant = await db.select().from(tenants).where(eq(tenants.id, membership.tenantId)).get()
  return { user, membership, tenant }
}

function buildUserDto({ user, membership, tenant }) {
  const role = membership.role
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    tenantType: user.tenantType,
    role,
    tenantId: tenant.id,
    tenantName: tenant.name,
    permissions: getPermissionsForRole(role),
  }
}

async function issueTokenPair(userContext, reqMeta = {}) {
  const { user, membership, tenant } = userContext
  const payload = {
    sub: user.id,
    tenantId: tenant.id,
    tenantType: user.tenantType,
    role: membership.role,
  }

  const accessToken = await createAccessToken(payload)
  const { token: refreshToken, jti, expiresAt } = await createRefreshToken({ sub: user.id })

  await db
    .insert(refreshTokens)
    .values({
      id: newId(),
      userId: user.id,
      jti,
      expiresAt,
      userAgent: reqMeta.userAgent || null,
      ipAddress: reqMeta.ipAddress || null,
      createdAt: new Date(),
    })
    .run()

  authLog('token.issued', { userId: user.id, tenantId: tenant.id })

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: 'Bearer',
    expires_in_minutes: env.ACCESS_TOKEN_TTL_MINUTES,
    refresh_expires_in_days: env.REFRESH_TOKEN_TTL_DAYS,
    user: buildUserDto(userContext),
    requiresMfa: false,
  }
}

async function createMfaChallenge(userId) {
  const code = generateOtp()
  const sessionId = newId()
  const expiresAt = new Date(Date.now() + MFA_TTL_MS)

  await db
    .insert(mfaChallenges)
    .values({
      id: sessionId,
      userId,
      codeHash: hashToken(code),
      expiresAt,
      createdAt: new Date(),
    })
    .run()

  const user = await db.select().from(users).where(eq(users.id, userId)).get()
  await sendMfaCode(user.email, code)
  authLog('mfa.sent', { userId, sessionId })

  return { requiresMfa: true, mfaSessionId: sessionId }
}

export async function corporateSignup(data, reqMeta) {
  const existing = await db.select().from(users).where(eq(users.email, data.email.toLowerCase())).get()
  if (existing) {
    const err = new Error('An account with this email already exists')
    err.status = 409
    throw err
  }

  const now = new Date()
  const userId = newId()
  const tenantId = newId()
  const slug = await uniqueSlug(data.companyName, async (s) => {
    return Boolean(await db.select().from(tenants).where(eq(tenants.slug, s)).get())
  })

  const passwordHash = await hashPassword(data.password)

  await db
    .insert(tenants)
    .values({
      id: tenantId,
      type: 'corporate',
      name: data.companyName,
      slug,
      createdAt: now,
    })
    .run()

  await db
    .insert(users)
    .values({
      id: userId,
      email: data.email.toLowerCase(),
      passwordHash,
      fullName: data.companyName,
      tenantType: 'corporate',
      mfaEnabled: Boolean(data.enableMfa),
      createdAt: now,
      updatedAt: now,
    })
    .run()

  await db
    .insert(memberships)
    .values({
      id: newId(),
      userId,
      tenantId,
      role: 'super_admin',
      status: 'active',
      createdAt: now,
    })
    .run()

  authLog('signup.corporate', { userId, tenantId })
  await logActivity({
    tenantId,
    userId,
    action: 'auth.signup.corporate',
    entityType: 'tenant',
    entityId: tenantId,
  }).catch(() => {})

  if (data.enableMfa) {
    return createMfaChallenge(userId)
  }

  const ctx = await loadUserContext(userId)
  return issueTokenPair(ctx, reqMeta)
}

export async function loginUser(email, password, reqMeta) {
  const user = await db.select().from(users).where(eq(users.email, email.toLowerCase())).get()
  if (!user) {
    const err = new Error('Invalid email or password')
    err.status = 401
    throw err
  }

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) {
    await logActivity({
      action: 'auth.login.failed',
      metadata: { email },
      ipAddress: reqMeta.ipAddress,
      userAgent: reqMeta.userAgent,
    }).catch(() => {})
    authLog('login.failed', { email })
    const err = new Error('Invalid email or password')
    err.status = 401
    throw err
  }

  if (user.mfaEnabled) {
    return createMfaChallenge(user.id)
  }

  const ctx = await loadUserContext(user.id)
  authLog('login.success', { userId: user.id })
  await logActivity({
    tenantId: ctx.tenant.id,
    userId: user.id,
    action: 'auth.login.success',
    ipAddress: reqMeta.ipAddress,
    userAgent: reqMeta.userAgent,
  }).catch(() => {})
  return issueTokenPair(ctx, reqMeta)
}

export async function verifyMfa(sessionId, code, reqMeta) {
  const challenge = await db.select().from(mfaChallenges).where(eq(mfaChallenges.id, sessionId)).get()
  if (!challenge || challenge.consumedAt || challenge.expiresAt < new Date()) {
    const err = new Error('Invalid or expired verification code')
    err.status = 400
    throw err
  }

  if (challenge.codeHash !== hashToken(code)) {
    const err = new Error('Invalid or expired verification code')
    err.status = 400
    throw err
  }

  await db.update(mfaChallenges).set({ consumedAt: new Date() }).where(eq(mfaChallenges.id, sessionId)).run()

  const ctx = await loadUserContext(challenge.userId)
  authLog('mfa.verified', { userId: challenge.userId })
  await logActivity({
    tenantId: ctx.tenant.id,
    userId: challenge.userId,
    action: 'auth.mfa.verified',
    ipAddress: reqMeta.ipAddress,
    userAgent: reqMeta.userAgent,
  }).catch(() => {})
  return issueTokenPair(ctx, reqMeta)
}

export async function forgotPassword(email) {
  const user = await db.select().from(users).where(eq(users.email, email.toLowerCase())).get()
  if (!user) return { ok: true }

  const token = generateResetToken()
  await db
    .insert(passwordResetTokens)
    .values({
      id: newId(),
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
      createdAt: new Date(),
    })
    .run()

  await sendPasswordReset(user.email, token)
  authLog('password.reset_requested', { userId: user.id })
  await logActivity({
    userId: user.id,
    action: 'auth.password.reset_requested',
    entityType: 'user',
    entityId: user.id,
  }).catch(() => {})
  return { ok: true }
}

export async function resetPassword(token, password) {
  const tokenHash = hashToken(token)
  const row = await db
    .select()
    .from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.tokenHash, tokenHash), isNull(passwordResetTokens.usedAt)))
    .get()

  if (!row || row.expiresAt < new Date()) {
    const err = new Error('Invalid or expired reset token')
    err.status = 400
    throw err
  }

  const passwordHash = await hashPassword(password)
  const now = new Date()

  await db.update(users).set({ passwordHash, updatedAt: now }).where(eq(users.id, row.userId)).run()
  await db.update(passwordResetTokens).set({ usedAt: now }).where(eq(passwordResetTokens.id, row.id)).run()
  await db
    .update(refreshTokens)
    .set({ revokedAt: now })
    .where(and(eq(refreshTokens.userId, row.userId), isNull(refreshTokens.revokedAt)))
    .run()

  authLog('password.reset_completed', { userId: row.userId })
  await logActivity({
    userId: row.userId,
    action: 'auth.password.reset_completed',
    entityType: 'user',
    entityId: row.userId,
  }).catch(() => {})
  return { ok: true }
}

export async function inviteTeam(inviter, invites) {
  const now = new Date()
  let sent = 0

  for (const invite of invites) {
    const token = generateResetToken()
    await db
      .insert(invitations)
      .values({
        id: newId(),
        tenantId: inviter.tenantId,
        email: invite.email.toLowerCase(),
        role: invite.role,
        tokenHash: hashToken(token),
        invitedBy: inviter.sub,
        expiresAt: new Date(now.getTime() + INVITE_TTL_MS),
        createdAt: now,
      })
      .run()

    await sendInvitation(invite.email, token, inviter.tenantName || 'your team')
    sent++
  }

  authLog('invite.sent', { tenantId: inviter.tenantId, count: sent })
  await logActivity({
    tenantId: inviter.tenantId,
    userId: inviter.sub,
    action: 'team.invite.sent',
    entityType: 'tenant',
    entityId: inviter.tenantId,
    metadata: { count: sent, emails: invites.map((i) => i.email) },
  }).catch(() => {})
  return { sent }
}

export async function refreshSession(refreshToken, reqMeta) {
  let payload
  try {
    payload = await decodeRefreshToken(refreshToken)
  } catch {
    const err = new Error('Invalid refresh token')
    err.status = 401
    throw err
  }

  const stored = await db.select().from(refreshTokens).where(eq(refreshTokens.jti, payload.jti)).get()

  if (!stored) {
    const err = new Error('Invalid refresh token')
    err.status = 401
    throw err
  }

  if (stored.revokedAt) {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.userId, stored.userId), isNull(refreshTokens.revokedAt)))
      .run()
    authLog('token.reuse_detected', { userId: stored.userId })
    const err = new Error('Session revoked')
    err.status = 401
    throw err
  }

  if (stored.expiresAt < new Date()) {
    const err = new Error('Refresh token expired')
    err.status = 401
    throw err
  }

  const { token: newRefresh, jti: newJti, expiresAt } = await createRefreshToken({ sub: stored.userId })
  const now = new Date()

  await db
    .update(refreshTokens)
    .set({ revokedAt: now, replacedByJti: newJti })
    .where(eq(refreshTokens.id, stored.id))
    .run()
  await db
    .insert(refreshTokens)
    .values({
      id: newId(),
      userId: stored.userId,
      jti: newJti,
      expiresAt,
      userAgent: reqMeta.userAgent || null,
      ipAddress: reqMeta.ipAddress || null,
      createdAt: now,
    })
    .run()

  const ctx = await loadUserContext(stored.userId)
  const accessToken = await createAccessToken({
    sub: ctx.user.id,
    tenantId: ctx.tenant.id,
    tenantType: ctx.user.tenantType,
    role: ctx.membership.role,
  })

  authLog('token.refreshed', { userId: stored.userId })

  return {
    access_token: accessToken,
    refresh_token: newRefresh,
    token_type: 'Bearer',
    expires_in_minutes: env.ACCESS_TOKEN_TTL_MINUTES,
    refresh_expires_in_days: env.REFRESH_TOKEN_TTL_DAYS,
    user: buildUserDto(ctx),
    requiresMfa: false,
  }
}

export async function logout(refreshToken, reqMeta = {}) {
  if (!refreshToken) return { ok: true }
  try {
    const payload = await decodeRefreshToken(refreshToken)
    await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.jti, payload.jti)).run()
    authLog('logout', { userId: payload.sub })
    const ctx = await loadUserContext(payload.sub)
    if (ctx) {
      await logActivity({
        tenantId: ctx.tenant.id,
        userId: payload.sub,
        action: 'auth.logout',
        ipAddress: reqMeta.ipAddress,
        userAgent: reqMeta.userAgent,
      }).catch(() => {})
    }
  } catch {
    // idempotent
  }
  return { ok: true }
}

export async function getMe(userId) {
  const ctx = await loadUserContext(userId)
  if (!ctx) {
    const err = new Error('User not found')
    err.status = 404
    throw err
  }
  return buildUserDto(ctx)
}

export async function ngoRegister(data, reqMeta) {
  const existing = await db.select().from(users).where(eq(users.email, data.email.toLowerCase())).get()
  if (existing) {
    const err = new Error('An account with this email already exists')
    err.status = 409
    throw err
  }

  const now = new Date()
  const userId = newId()
  const tenantId = newId()
  const slug = await uniqueSlug(data.ngoName, async (s) => {
    return Boolean(await db.select().from(tenants).where(eq(tenants.slug, s)).get())
  })

  const passwordHash = await hashPassword(data.password)

  await db
    .insert(tenants)
    .values({
      id: tenantId,
      type: 'ngo',
      name: data.ngoName,
      slug,
      createdAt: now,
    })
    .run()

  await db
    .insert(users)
    .values({
      id: userId,
      email: data.email.toLowerCase(),
      passwordHash,
      fullName: data.contactPerson,
      tenantType: 'ngo',
      mfaEnabled: false,
      createdAt: now,
      updatedAt: now,
    })
    .run()

  await db
    .insert(memberships)
    .values({
      id: newId(),
      userId,
      tenantId,
      role: 'ngo_admin',
      status: 'active',
      createdAt: now,
    })
    .run()

  await db
    .insert(ngoProfiles)
    .values({
      tenantId,
      registrationNumber: data.registrationNumber,
      sectors: JSON.stringify(data.sectors),
      verificationStatus: 'pending',
      contactPerson: data.contactPerson,
      createdAt: now,
    })
    .run()

  authLog('signup.ngo', { userId, tenantId })
  await logActivity({ tenantId, userId, action: 'auth.signup.ngo', entityType: 'ngo', entityId: tenantId }).catch(
    () => {},
  )

  const ctx = await loadUserContext(userId)
  return issueTokenPair(ctx, reqMeta)
}

export async function saveNgoDocuments(user, files, req = null) {
  const now = new Date()
  const uploaded = []

  for (const [docType, fileList] of Object.entries(files)) {
    for (const file of fileList) {
      const record = await storeFile({
        req,
        buffer: file.buffer,
        tenantId: user.tenantId,
        tenantType: user.tenantType,
        uploadedBy: user.sub,
        category: 'ngo_verification',
        originalName: file.originalname,
        mime: file.mimetype,
        entityType: 'ngo_document',
        entityId: docType,
      })

      await db
        .insert(ngoDocuments)
        .values({
          id: newId(),
          tenantId: user.tenantId,
          docType,
          filePath: record.id,
          originalName: file.originalname,
          mime: file.mimetype,
          sizeBytes: file.size,
          uploadedAt: now,
        })
        .run()
      uploaded.push(record)
    }
  }

  await db
    .update(ngoProfiles)
    .set({ verificationStatus: 'pending' })
    .where(eq(ngoProfiles.tenantId, user.tenantId))
    .run()
  authLog('ngo.verification_uploaded', { tenantId: user.tenantId })

  await notifyPlatformAdmins({
    type: 'verification.submitted',
    title: 'NGO verification documents submitted',
    body: `New verification documents were uploaded for tenant ${user.tenantId}.`,
    link: '/admin/ngo-verification',
  }).catch(() => {})

  return { status: 'pending_review', files: uploaded }
}

export { loadUserContext, buildUserDto }
