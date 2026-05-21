import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name'),
  tenantType: text('tenant_type').notNull(),
  mfaEnabled: integer('mfa_enabled', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const tenants = sqliteTable('tenants', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const memberships = sqliteTable('memberships', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  role: text('role').notNull(),
  status: text('status').notNull().default('active'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => [
  uniqueIndex('memberships_user_tenant_idx').on(table.userId, table.tenantId),
])

export const refreshTokens = sqliteTable('refresh_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  jti: text('jti').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  revokedAt: integer('revoked_at', { mode: 'timestamp' }),
  replacedByJti: text('replaced_by_jti'),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  tokenHash: text('token_hash').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  usedAt: integer('used_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const mfaChallenges = sqliteTable('mfa_challenges', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  codeHash: text('code_hash').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  consumedAt: integer('consumed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const invitations = sqliteTable('invitations', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  email: text('email').notNull(),
  role: text('role').notNull(),
  tokenHash: text('token_hash').notNull(),
  invitedBy: text('invited_by').references(() => users.id),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  acceptedAt: integer('accepted_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const ngoProfiles = sqliteTable('ngo_profiles', {
  tenantId: text('tenant_id').primaryKey().references(() => tenants.id),
  registrationNumber: text('registration_number').notNull(),
  sectors: text('sectors').notNull(),
  verificationStatus: text('verification_status').notNull().default('pending'),
  contactPerson: text('contact_person'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const ngoDocuments = sqliteTable('ngo_documents', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  docType: text('doc_type').notNull(),
  filePath: text('file_path').notNull(),
  originalName: text('original_name').notNull(),
  mime: text('mime').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  uploadedAt: integer('uploaded_at', { mode: 'timestamp' }).notNull(),
})

export const files = sqliteTable('files', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  uploadedBy: text('uploaded_by').notNull().references(() => users.id),
  category: text('category').notNull(),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  storageKey: text('storage_key').notNull(),
  originalName: text('original_name').notNull(),
  mime: text('mime').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  link: text('link'),
  readAt: integer('read_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const activityLogs = sqliteTable('activity_logs', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => tenants.id),
  userId: text('user_id').references(() => users.id),
  action: text('action').notNull(),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  metadata: text('metadata'),
  previousValue: text('previous_value'),
  reason: text('reason'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const searchDocuments = sqliteTable('search_documents', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id'),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  title: text('title').notNull(),
  body: text('body'),
  keywords: text('keywords'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})
