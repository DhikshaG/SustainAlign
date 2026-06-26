import { pgTable, text, integer, doublePrecision, boolean, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name'),
  tenantType: text('tenant_type').notNull(),
  mfaEnabled: boolean('mfa_enabled').notNull().default(false),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull(),
})

export const tenants = pgTable('tenants', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
})

export const memberships = pgTable(
  'memberships',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id),
    role: text('role').notNull(),
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
  },
  (table) => [uniqueIndex('memberships_user_tenant_idx').on(table.userId, table.tenantId)],
)

export const refreshTokens = pgTable('refresh_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  jti: text('jti').notNull().unique(),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  revokedAt: timestamp('revoked_at', { mode: 'date' }),
  replacedByJti: text('replaced_by_jti'),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
})

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  usedAt: timestamp('used_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
})

export const mfaChallenges = pgTable('mfa_challenges', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  codeHash: text('code_hash').notNull(),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  consumedAt: timestamp('consumed_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
})

export const invitations = pgTable('invitations', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenants.id),
  email: text('email').notNull(),
  role: text('role').notNull(),
  tokenHash: text('token_hash').notNull(),
  invitedBy: text('invited_by').references(() => users.id),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  acceptedAt: timestamp('accepted_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
})

export const ngoProfiles = pgTable('ngo_profiles', {
  tenantId: text('tenant_id')
    .primaryKey()
    .references(() => tenants.id),
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
  rating: doublePrecision('rating'),
  reviewCount: integer('review_count'),
  aiRecommended: boolean('ai_recommended').notNull().default(false),
  logoFileId: text('logo_file_id'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }),
})

export const ngoTeamMembers = pgTable('ngo_team_members', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenants.id),
  name: text('name').notNull(),
  role: text('role').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const ngoPastProjects = pgTable('ngo_past_projects', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenants.id),
  name: text('name').notNull(),
  budgetLabel: text('budget_label'),
  outcome: text('outcome'),
  completedAt: text('completed_at'),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const ngoImpactMetrics = pgTable(
  'ngo_impact_metrics',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id),
    metricKey: text('metric_key').notNull(),
    label: text('label').notNull(),
    value: text('value').notNull(),
  },
  (table) => [uniqueIndex('ngo_impact_metrics_tenant_key_idx').on(table.tenantId, table.metricKey)],
)

export const ngoImpactStories = pgTable('ngo_impact_stories', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenants.id),
  title: text('title').notNull(),
  excerpt: text('excerpt'),
  publishedAt: text('published_at'),
  coverFileId: text('cover_file_id'),
})

export const ngoCertifications = pgTable('ngo_certifications', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenants.id),
  name: text('name').notNull(),
  issuedAt: text('issued_at'),
  expiresAt: text('expires_at'),
  status: text('status').notNull().default('active'),
})

export const ngoDocuments = pgTable('ngo_documents', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenants.id),
  docType: text('doc_type').notNull(),
  filePath: text('file_path').notNull(),
  originalName: text('original_name').notNull(),
  mime: text('mime').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  uploadedAt: timestamp('uploaded_at', { mode: 'date' }).notNull(),
})

export const files = pgTable('files', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenants.id),
  uploadedBy: text('uploaded_by')
    .notNull()
    .references(() => users.id),
  category: text('category').notNull(),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  storageKey: text('storage_key').notNull(),
  originalName: text('original_name').notNull(),
  mime: text('mime').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  checksum: text('checksum'),
  auditPath: text('audit_path'),
  fiscalYear: text('fiscal_year'),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
})

export const fileVersions = pgTable('file_versions', {
  id: text('id').primaryKey(),
  fileId: text('file_id')
    .notNull()
    .references(() => files.id),
  version: integer('version').notNull(),
  storageKey: text('storage_key').notNull(),
  checksum: text('checksum').notNull(),
  uploadedBy: text('uploaded_by')
    .notNull()
    .references(() => users.id),
  sizeBytes: integer('size_bytes').notNull(),
  changeNote: text('change_note'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
})

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenants.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  link: text('link'),
  readAt: timestamp('read_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
})

export const activityLogs = pgTable('activity_logs', {
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
  createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
})

export const searchDocuments = pgTable('search_documents', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id'),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  title: text('title').notNull(),
  body: text('body'),
  keywords: text('keywords'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
})

export const tagCategories = pgTable('tag_categories', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
})

export const tags = pgTable(
  'tags',
  {
    id: text('id').primaryKey(),
    categoryId: text('category_id')
      .notNull()
      .references(() => tagCategories.id),
    slug: text('slug').notNull(),
    label: text('label').notNull(),
    metadata: text('metadata'),
  },
  (table) => [uniqueIndex('tags_category_slug_idx').on(table.categoryId, table.slug)],
)

export const entityTags = pgTable(
  'entity_tags',
  {
    id: text('id').primaryKey(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id),
    tenantId: text('tenant_id').references(() => tenants.id),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
  },
  (table) => [uniqueIndex('entity_tags_unique_idx').on(table.entityType, table.entityId, table.tagId)],
)

export const workflowDefinitions = pgTable('workflow_definitions', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  steps: text('steps').notNull(),
})

export const workflowInstances = pgTable('workflow_instances', {
  id: text('id').primaryKey(),
  definitionId: text('definition_id')
    .notNull()
    .references(() => workflowDefinitions.id),
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenants.id),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  status: text('status').notNull().default('pending'),
  currentStepIndex: integer('current_step_index').notNull().default(0),
  submittedBy: text('submitted_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull(),
})

export const workflowEvents = pgTable('workflow_events', {
  id: text('id').primaryKey(),
  instanceId: text('instance_id')
    .notNull()
    .references(() => workflowInstances.id),
  fromStatus: text('from_status'),
  toStatus: text('to_status').notNull(),
  stepIndex: integer('step_index'),
  actorUserId: text('actor_user_id').references(() => users.id),
  comment: text('comment'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
})

export const corporateNgoSaves = pgTable(
  'corporate_ngo_saves',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    ngoTenantId: text('ngo_tenant_id')
      .notNull()
      .references(() => tenants.id),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
  },
  (table) => [uniqueIndex('corporate_ngo_saves_user_ngo_idx').on(table.userId, table.ngoTenantId)],
)

export const corporateNgoInquiries = pgTable('corporate_ngo_inquiries', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  corporateTenantId: text('corporate_tenant_id')
    .notNull()
    .references(() => tenants.id),
  ngoTenantId: text('ngo_tenant_id')
    .notNull()
    .references(() => tenants.id),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
})

export const csrProjects = pgTable(
  'csr_projects',
  {
    id: text('id').primaryKey(),
    corporateTenantId: text('corporate_tenant_id')
      .notNull()
      .references(() => tenants.id),
    ngoTenantId: text('ngo_tenant_id')
      .notNull()
      .references(() => tenants.id),
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
    ngoPartnershipStatus: text('ngo_partnership_status'),
    ngoRespondedAt: timestamp('ngo_responded_at', { mode: 'date' }),
    ngoResponseNote: text('ngo_response_note'),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).notNull(),
  },
  (table) => [
    index('csr_projects_corporate_idx').on(table.corporateTenantId),
    index('csr_projects_ngo_idx').on(table.ngoTenantId),
    index('csr_projects_status_idx').on(table.status),
  ],
)

export const projectMilestones = pgTable('project_milestones', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => csrProjects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  dueDate: text('due_date').notNull(),
  status: text('status').notNull().default('pending'),
  progress: integer('progress').notNull().default(0),
  sortOrder: integer('sort_order').notNull().default(0),
  completedAt: timestamp('completed_at', { mode: 'date' }),
  reviewStatus: text('review_status').notNull().default('none'),
})

export const messageThreads = pgTable(
  'message_threads',
  {
    id: text('id').primaryKey(),
    corporateTenantId: text('corporate_tenant_id')
      .notNull()
      .references(() => tenants.id),
    ngoTenantId: text('ngo_tenant_id')
      .notNull()
      .references(() => tenants.id),
    projectId: text('project_id').references(() => csrProjects.id),
    subject: text('subject').notNull(),
    lastMessageAt: timestamp('last_message_at', { mode: 'date' }).notNull(),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
  },
  (table) => [
    index('message_threads_corporate_idx').on(table.corporateTenantId),
    index('message_threads_ngo_idx').on(table.ngoTenantId),
    index('message_threads_project_idx').on(table.projectId),
  ],
)

export const messages = pgTable(
  'messages',
  {
    id: text('id').primaryKey(),
    threadId: text('thread_id')
      .notNull()
      .references(() => messageThreads.id, { onDelete: 'cascade' }),
    senderUserId: text('sender_user_id')
      .notNull()
      .references(() => users.id),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
  },
  (table) => [index('messages_thread_idx').on(table.threadId)],
)

export const projectTasks = pgTable(
  'project_tasks',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => csrProjects.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    assigneeSide: text('assignee_side').notNull(),
    assigneeUserId: text('assignee_user_id').references(() => users.id),
    status: text('status').notNull().default('open'),
    dueDate: text('due_date'),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).notNull(),
  },
  (table) => [index('project_tasks_project_idx').on(table.projectId)],
)

export const projectUpdates = pgTable('project_updates', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => csrProjects.id, { onDelete: 'cascade' }),
  authorUserId: text('author_user_id')
    .notNull()
    .references(() => users.id),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
})

export const projectKpis = pgTable(
  'project_kpis',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => csrProjects.id, { onDelete: 'cascade' }),
    metricKey: text('metric_key').notNull(),
    label: text('label').notNull(),
    value: text('value').notNull(),
    unit: text('unit'),
    recordedAt: timestamp('recorded_at', { mode: 'date' }).notNull(),
  },
  (table) => [index('project_kpis_project_idx').on(table.projectId)],
)

export const projectBeneficiaryLogs = pgTable(
  'project_beneficiary_logs',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => csrProjects.id, { onDelete: 'cascade' }),
    directCount: integer('direct_count').notNull().default(0),
    indirectCount: integer('indirect_count').notNull().default(0),
    note: text('note'),
    recordedAt: timestamp('recorded_at', { mode: 'date' }).notNull(),
    recordedBy: text('recorded_by').references(() => users.id),
  },
  (table) => [index('project_beneficiary_logs_project_idx').on(table.projectId)],
)

export const projectGeoUpdates = pgTable(
  'project_geo_updates',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => csrProjects.id, { onDelete: 'cascade' }),
    state: text('state').notNull(),
    district: text('district'),
    lat: doublePrecision('lat'),
    lng: doublePrecision('lng'),
    note: text('note'),
    effectiveDate: text('effective_date').notNull(),
  },
  (table) => [index('project_geo_updates_project_idx').on(table.projectId)],
)

export const projectUpdateFiles = pgTable(
  'project_update_files',
  {
    id: text('id').primaryKey(),
    updateId: text('update_id')
      .notNull()
      .references(() => projectUpdates.id, { onDelete: 'cascade' }),
    fileId: text('file_id')
      .notNull()
      .references(() => files.id, { onDelete: 'cascade' }),
  },
  (table) => [uniqueIndex('project_update_files_update_file_idx').on(table.updateId, table.fileId)],
)

export const reports = pgTable(
  'reports',
  {
    id: text('id').primaryKey(),
    corporateTenantId: text('corporate_tenant_id')
      .notNull()
      .references(() => tenants.id),
    type: text('type').notNull(),
    title: text('title').notNull(),
    periodStart: text('period_start').notNull(),
    periodEnd: text('period_end').notNull(),
    status: text('status').notNull().default('draft'),
    fileId: text('file_id').references(() => files.id),
    metadataJson: text('metadata_json'),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).notNull(),
  },
  (table) => [index('reports_corporate_idx').on(table.corporateTenantId)],
)

export const corporateCsrProfile = pgTable(
  'corporate_csr_profile',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id),
    fyLabel: text('fy_label').notNull(),
    netProfitInr: integer('net_profit_inr').notNull().default(0),
    turnoverInr: integer('turnover_inr').notNull().default(0),
    netWorthInr: integer('net_worth_inr').notNull().default(0),
    adminCapPct: doublePrecision('admin_cap_pct').notNull().default(5),
    localAreaTargetPct: doublePrecision('local_area_target_pct').notNull().default(70),
    carryForwardInr: integer('carry_forward_inr').notNull().default(0),
    obligationThresholdInr: integer('obligation_threshold_inr').notNull().default(50000000),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).notNull(),
  },
  (table) => [uniqueIndex('corporate_csr_profile_tenant_fy_idx').on(table.tenantId, table.fyLabel)],
)

export const complianceAlerts = pgTable(
  'compliance_alerts',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id),
    level: text('level').notNull(),
    ruleKey: text('rule_key').notNull(),
    message: text('message').notNull(),
    dueDate: text('due_date'),
    entityType: text('entity_type'),
    entityId: text('entity_id'),
    acknowledgedAt: timestamp('acknowledged_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
  },
  (table) => [index('compliance_alerts_tenant_idx').on(table.tenantId)],
)

export const volunteerEvents = pgTable(
  'volunteer_events',
  {
    id: text('id').primaryKey(),
    corporateTenantId: text('corporate_tenant_id')
      .notNull()
      .references(() => tenants.id),
    title: text('title').notNull(),
    description: text('description'),
    location: text('location').notNull(),
    startsAt: timestamp('starts_at', { mode: 'date' }).notNull(),
    endsAt: timestamp('ends_at', { mode: 'date' }).notNull(),
    slots: integer('slots').notNull(),
    status: text('status').notNull().default('draft'),
    hoursCredit: doublePrecision('hours_credit').notNull().default(4),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).notNull(),
  },
  (table) => [index('volunteer_events_tenant_starts_idx').on(table.corporateTenantId, table.startsAt)],
)

export const volunteerSignups = pgTable(
  'volunteer_signups',
  {
    id: text('id').primaryKey(),
    eventId: text('event_id')
      .notNull()
      .references(() => volunteerEvents.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    status: text('status').notNull().default('registered'),
    registeredAt: timestamp('registered_at', { mode: 'date' }).notNull(),
  },
  (table) => [
    uniqueIndex('volunteer_signups_event_user_idx').on(table.eventId, table.userId),
    index('volunteer_signups_user_idx').on(table.userId),
  ],
)

export const volunteerAttendance = pgTable(
  'volunteer_attendance',
  {
    id: text('id').primaryKey(),
    signupId: text('signup_id')
      .notNull()
      .references(() => volunteerSignups.id, { onDelete: 'cascade' }),
    checkInAt: timestamp('check_in_at', { mode: 'date' }).notNull(),
    checkOutAt: timestamp('check_out_at', { mode: 'date' }),
    method: text('method').notNull().default('qr'),
    recordedBy: text('recorded_by').references(() => users.id),
  },
  (table) => [index('volunteer_attendance_signup_idx').on(table.signupId)],
)

export const volunteerQrTokens = pgTable(
  'volunteer_qr_tokens',
  {
    id: text('id').primaryKey(),
    eventId: text('event_id')
      .notNull()
      .references(() => volunteerEvents.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
    revokedAt: timestamp('revoked_at', { mode: 'date' }),
  },
  (table) => [
    uniqueIndex('volunteer_qr_tokens_token_idx').on(table.token),
    index('volunteer_qr_tokens_event_idx').on(table.eventId),
  ],
)

export const volunteerCertificates = pgTable(
  'volunteer_certificates',
  {
    id: text('id').primaryKey(),
    signupId: text('signup_id')
      .notNull()
      .references(() => volunteerSignups.id, { onDelete: 'cascade' }),
    fileId: text('file_id')
      .notNull()
      .references(() => files.id),
    issuedAt: timestamp('issued_at', { mode: 'date' }).notNull(),
    hoursCredited: doublePrecision('hours_credited').notNull(),
  },
  (table) => [uniqueIndex('volunteer_certificates_signup_idx').on(table.signupId)],
)

export const vectorDocuments = pgTable(
  'vector_documents',
  {
    id: text('id').primaryKey(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    chunkIndex: integer('chunk_index').notNull(),
    text: text('text').notNull(),
    embedding: text('embedding').notNull(),
    metadata: text('metadata'),
    updatedAt: timestamp('updated_at', { mode: 'date' }).notNull(),
  },
  (table) => [index('vector_documents_entity_idx').on(table.entityType, table.entityId)],
)
