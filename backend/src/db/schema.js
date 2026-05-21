import { sqliteTable, text, integer, real, uniqueIndex, index } from 'drizzle-orm/sqlite-core'

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
  pan: text('pan'),
  csr1Number: text('csr1_number'),
  website: text('website'),
  phone: text('phone'),
  email: text('email'),
  description: text('description'),
  statesServed: text('states_served'),
  districtsServed: text('districts_served'),
  settlementType: text('settlement_type'),
  yearsActive: integer('years_active'),
  beneficiariesCount: integer('beneficiaries_count'),
  annualFundingInr: integer('annual_funding_inr'),
  teamSize: integer('team_size'),
  projectsCount: integer('projects_count'),
  budgetRange: text('budget_range'),
  orgSize: text('org_size'),
  primarySector: text('primary_sector'),
  region: text('region'),
  financialTransparencyScore: integer('financial_transparency_score'),
  riskScore: integer('risk_score'),
  rating: real('rating'),
  reviewCount: integer('review_count'),
  aiRecommended: integer('ai_recommended', { mode: 'boolean' }).notNull().default(false),
  logoFileId: text('logo_file_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
})

export const ngoTeamMembers = sqliteTable('ngo_team_members', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  role: text('role').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const ngoPastProjects = sqliteTable('ngo_past_projects', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  budgetLabel: text('budget_label'),
  outcome: text('outcome'),
  completedAt: text('completed_at'),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const ngoImpactMetrics = sqliteTable('ngo_impact_metrics', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  metricKey: text('metric_key').notNull(),
  label: text('label').notNull(),
  value: text('value').notNull(),
}, (table) => [
  uniqueIndex('ngo_impact_metrics_tenant_key_idx').on(table.tenantId, table.metricKey),
])

export const ngoImpactStories = sqliteTable('ngo_impact_stories', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  title: text('title').notNull(),
  excerpt: text('excerpt'),
  publishedAt: text('published_at'),
  coverFileId: text('cover_file_id'),
})

export const ngoCertifications = sqliteTable('ngo_certifications', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  issuedAt: text('issued_at'),
  expiresAt: text('expires_at'),
  status: text('status').notNull().default('active'),
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

export const tagCategories = sqliteTable('tag_categories', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
})

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  categoryId: text('category_id').notNull().references(() => tagCategories.id),
  slug: text('slug').notNull(),
  label: text('label').notNull(),
  metadata: text('metadata'),
}, (table) => [
  uniqueIndex('tags_category_slug_idx').on(table.categoryId, table.slug),
])

export const entityTags = sqliteTable('entity_tags', {
  id: text('id').primaryKey(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  tagId: text('tag_id').notNull().references(() => tags.id),
  tenantId: text('tenant_id').references(() => tenants.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => [
  uniqueIndex('entity_tags_unique_idx').on(table.entityType, table.entityId, table.tagId),
])

export const workflowDefinitions = sqliteTable('workflow_definitions', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  steps: text('steps').notNull(),
})

export const workflowInstances = sqliteTable('workflow_instances', {
  id: text('id').primaryKey(),
  definitionId: text('definition_id').notNull().references(() => workflowDefinitions.id),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  status: text('status').notNull().default('pending'),
  currentStepIndex: integer('current_step_index').notNull().default(0),
  submittedBy: text('submitted_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const workflowEvents = sqliteTable('workflow_events', {
  id: text('id').primaryKey(),
  instanceId: text('instance_id').notNull().references(() => workflowInstances.id),
  fromStatus: text('from_status'),
  toStatus: text('to_status').notNull(),
  stepIndex: integer('step_index'),
  actorUserId: text('actor_user_id').references(() => users.id),
  comment: text('comment'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const corporateNgoSaves = sqliteTable('corporate_ngo_saves', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  ngoTenantId: text('ngo_tenant_id').notNull().references(() => tenants.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => [
  uniqueIndex('corporate_ngo_saves_user_ngo_idx').on(table.userId, table.ngoTenantId),
])

export const corporateNgoInquiries = sqliteTable('corporate_ngo_inquiries', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  corporateTenantId: text('corporate_tenant_id').notNull().references(() => tenants.id),
  ngoTenantId: text('ngo_tenant_id').notNull().references(() => tenants.id),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const csrProjects = sqliteTable('csr_projects', {
  id: text('id').primaryKey(),
  corporateTenantId: text('corporate_tenant_id').notNull().references(() => tenants.id),
  ngoTenantId: text('ngo_tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  description: text('description'),
  scheduleVii: text('schedule_vii').notNull(),
  theme: text('theme'),
  location: text('location'),
  state: text('state'),
  status: text('status').notNull().default('pending_approval'),
  budgetInr: integer('budget_inr').notNull(),
  spentInr: integer('spent_inr').notNull().default(0),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  progress: integer('progress').notNull().default(0),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => [
  index('csr_projects_corporate_idx').on(table.corporateTenantId),
  index('csr_projects_ngo_idx').on(table.ngoTenantId),
  index('csr_projects_status_idx').on(table.status),
])

export const projectMilestones = sqliteTable('project_milestones', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => csrProjects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  dueDate: text('due_date').notNull(),
  status: text('status').notNull().default('pending'),
  progress: integer('progress').notNull().default(0),
  sortOrder: integer('sort_order').notNull().default(0),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
})

export const projectUpdates = sqliteTable('project_updates', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => csrProjects.id, { onDelete: 'cascade' }),
  authorUserId: text('author_user_id').notNull().references(() => users.id),
  body: text('body').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const projectKpis = sqliteTable('project_kpis', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => csrProjects.id, { onDelete: 'cascade' }),
  metricKey: text('metric_key').notNull(),
  label: text('label').notNull(),
  value: text('value').notNull(),
  unit: text('unit'),
  recordedAt: integer('recorded_at', { mode: 'timestamp' }).notNull(),
}, (table) => [
  index('project_kpis_project_idx').on(table.projectId),
])

export const projectBeneficiaryLogs = sqliteTable('project_beneficiary_logs', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => csrProjects.id, { onDelete: 'cascade' }),
  directCount: integer('direct_count').notNull().default(0),
  indirectCount: integer('indirect_count').notNull().default(0),
  note: text('note'),
  recordedAt: integer('recorded_at', { mode: 'timestamp' }).notNull(),
  recordedBy: text('recorded_by').references(() => users.id),
}, (table) => [
  index('project_beneficiary_logs_project_idx').on(table.projectId),
])

export const projectGeoUpdates = sqliteTable('project_geo_updates', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => csrProjects.id, { onDelete: 'cascade' }),
  state: text('state').notNull(),
  district: text('district'),
  lat: real('lat'),
  lng: real('lng'),
  note: text('note'),
  effectiveDate: text('effective_date').notNull(),
}, (table) => [
  index('project_geo_updates_project_idx').on(table.projectId),
])

export const projectUpdateFiles = sqliteTable('project_update_files', {
  id: text('id').primaryKey(),
  updateId: text('update_id').notNull().references(() => projectUpdates.id, { onDelete: 'cascade' }),
  fileId: text('file_id').notNull().references(() => files.id, { onDelete: 'cascade' }),
}, (table) => [
  uniqueIndex('project_update_files_update_file_idx').on(table.updateId, table.fileId),
])

export const reports = sqliteTable('reports', {
  id: text('id').primaryKey(),
  corporateTenantId: text('corporate_tenant_id').notNull().references(() => tenants.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  periodStart: text('period_start').notNull(),
  periodEnd: text('period_end').notNull(),
  status: text('status').notNull().default('draft'),
  fileId: text('file_id').references(() => files.id),
  metadataJson: text('metadata_json'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => [
  index('reports_corporate_idx').on(table.corporateTenantId),
])

export const corporateCsrProfile = sqliteTable('corporate_csr_profile', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  fyLabel: text('fy_label').notNull(),
  netProfitInr: integer('net_profit_inr').notNull().default(0),
  turnoverInr: integer('turnover_inr').notNull().default(0),
  netWorthInr: integer('net_worth_inr').notNull().default(0),
  adminCapPct: real('admin_cap_pct').notNull().default(5),
  localAreaTargetPct: real('local_area_target_pct').notNull().default(70),
  carryForwardInr: integer('carry_forward_inr').notNull().default(0),
  obligationThresholdInr: integer('obligation_threshold_inr').notNull().default(50000000),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => [
  uniqueIndex('corporate_csr_profile_tenant_fy_idx').on(table.tenantId, table.fyLabel),
])

export const complianceAlerts = sqliteTable('compliance_alerts', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  level: text('level').notNull(),
  ruleKey: text('rule_key').notNull(),
  message: text('message').notNull(),
  dueDate: text('due_date'),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  acknowledgedAt: integer('acknowledged_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => [
  index('compliance_alerts_tenant_idx').on(table.tenantId),
])
