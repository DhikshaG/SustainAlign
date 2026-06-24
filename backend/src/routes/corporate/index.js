import { Router } from 'express'
import { authenticate, requireRole } from '../../middleware/authenticate.js'
import { requirePermission } from '../../middleware/permissions.js'
import { validate } from '../../middleware/validate.js'
import { PERMISSIONS, getPermissionMatrix } from '../../lib/permissions.js'
import { ok, fail } from '../../lib/response.js'
import { safeFilename } from '../../lib/sanitize.js'
import { listProfiles, getProfileBySlug } from '../../services/ngo/index.js'
import { discoveryQuerySchema } from '../../schemas/ngo.js'
import { contactNgoSchema } from '../../schemas/discovery.js'
import { getDiscoveryFilterOptions } from '../../services/tags/index.js'
import {
  listSavedNgos,
  saveNgo,
  unsaveNgo,
  createNgoInquiry,
} from '../../services/discovery/index.js'
import {
  getVolunteerSummary,
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  listSignups,
  listCalendarEvents,
  registerForEvent,
  cancelRegistration,
  mintQrToken,
  getQrPayload,
  checkInWithToken,
  recordManualAttendance,
  issueCertificate,
  getCertificate,
} from '../../services/volunteers/index.js'
import {
  createVolunteerEventSchema,
  updateVolunteerEventSchema,
  volunteerCheckInSchema,
  manualAttendanceSchema,
  volunteerEventsQuerySchema,
} from '../../schemas/volunteers.js'
import { logMutation } from '../../services/activity-log/index.js'
import { getAuditTrail, getAuditFolderTree, buildAuditPackage, getComplianceAuditSummary } from '../../services/audit/index.js'
import { listDocumentsGrouped, listFileVersions, createFileVersion } from '../../services/files/index.js'
import { auditQuerySchema, auditExportSchema, fileVersionSchema } from '../../schemas/audit.js'
import { createUpload } from '../../middleware/upload.js'
import { env } from '../../config/env.js'
import { db } from '../../db/index.js'
import { tenants } from '../../db/schema.js'
import { eq } from 'drizzle-orm'
import { getDashboardSummary, getReportingOverview } from '../../services/dashboard/index.js'
import { getComplianceSummary, getFundAllocation, updateProfile, acknowledgeAlert, exportMcaCsr2, syncComplianceForTenant } from '../../services/compliance/index.js'
import { runAllocationIntelligence } from '../../services/allocation/index.js'
import { deriveDefaultsFromProjects } from '../../services/matching/index.js'
import { listReports, generateReport, getReport, submitReport, previewReport } from '../../services/reports/index.js'
import {
  getCopilotSuggestions,
  copilotChat,
  matchNgos,
  aiSearch,
  generateNarrative,
  generateImpactSummary,
  generateEsgSummary,
} from '../../services/ai/context.js'
import {
  ragCopilotChat,
  ragRecommendNgos,
  reindexAllVectors,
  isNgoDiscoveryQuery,
} from '../../services/ai/rag.js'
import {
  addKpi,
  addBeneficiaryLog,
  addGeoUpdate,
  attachFilesToUpdate,
  getImpactLiveSnapshot,
} from '../../services/impact/index.js'
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  archiveProject,
  updateProjectSpent,
  addMilestone,
  updateMilestone,
  deleteMilestone,
  addProjectUpdate,
} from '../../services/projects/index.js'
import {
  createProjectSchema,
  updateProjectSchema,
  milestoneInputSchema,
  updateMilestoneSchema,
  createUpdateSchema,
  updateSpentSchema,
} from '../../schemas/projects.js'
import {
  kpiInputSchema,
  beneficiaryLogSchema,
  geoUpdateSchema,
  attachUpdateFilesSchema,
} from '../../schemas/impact.js'
import { generateReportSchema, previewReportSchema } from '../../schemas/reports.js'
import { allocationIntelligenceSchema } from '../../schemas/allocation.js'
import { esgUnifiedQuerySchema, esgSummarySchema } from '../../schemas/esg.js'
import { getUnifiedEsgDashboard } from '../../services/esg/index.js'
import {
  listThreadsForCorporate,
  getThread,
  createThread,
  postMessage,
  getOrCreateProjectThread,
} from '../../services/messaging/index.js'
import { createTask, listTasksForProject, updateTaskStatus } from '../../services/tasks/index.js'
import { getProjectTimeline } from '../../services/crm/timeline.js'
import {
  createThreadSchema,
  postMessageSchema,
  createTaskSchema,
  updateTaskSchema,
} from '../../schemas/crm.js'
import { updateCsrProfileSchema } from '../../schemas/compliance.js'
import {
  copilotChatSchema,
  matchNgosSchema,
  aiSearchSchema,
  ragRecommendSchema,
  narrativeSchema,
} from '../../schemas/ai.js'

const CORPORATE_ROLES = ['super_admin', 'csr_head', 'esg_head', 'finance', 'compliance', 'volunteer', 'board']

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
})

const router = Router()

router.use(authenticate, requireRole(...CORPORATE_ROLES))

router.get('/dashboard/summary', requirePermission(PERMISSIONS.PROJECTS_READ), (req, res, next) => {
  try {
    ok(res, getDashboardSummary(req.user.tenantId))
  } catch (err) {
    next(err)
  }
})

router.get('/discovery/filters', requirePermission(PERMISSIONS.DISCOVERY_READ), (_req, res) => {
  ok(res, getDiscoveryFilterOptions())
})

router.get('/discovery/match-defaults', requirePermission(PERMISSIONS.DISCOVERY_READ), (req, res) => {
  ok(res, deriveDefaultsFromProjects(req.user.tenantId))
})

router.get('/discovery/ngos', requirePermission(PERMISSIONS.DISCOVERY_READ), validate(discoveryQuerySchema, 'query'), (req, res) => {
  const result = listProfiles({ ...req.validated, audience: 'corporate' })
  ok(res, result)
})

router.get('/saved-ngos', requirePermission(PERMISSIONS.DISCOVERY_READ), (req, res) => {
  ok(res, listSavedNgos(req.user.sub))
})

router.post('/saved-ngos/:slug', requirePermission(PERMISSIONS.DISCOVERY_READ), (req, res, next) => {
  try {
    ok(res, saveNgo(req.user.sub, req.params.slug, req))
  } catch (err) {
    next(err)
  }
})

router.delete('/saved-ngos/:slug', requirePermission(PERMISSIONS.DISCOVERY_READ), (req, res, next) => {
  try {
    ok(res, unsaveNgo(req.user.sub, req.params.slug, req))
  } catch (err) {
    next(err)
  }
})

router.post('/ngos/:slug/contact', requirePermission(PERMISSIONS.DISCOVERY_READ), validate(contactNgoSchema), (req, res, next) => {
  try {
    const result = createNgoInquiry({
      userId: req.user.sub,
      corporateTenantId: req.user.tenantId,
      slug: req.params.slug,
      subject: req.validated.subject,
      message: req.validated.message,
    }, req)
    ok(res, result, 'Inquiry submitted')
  } catch (err) {
    next(err)
  }
})

router.get('/ngos/:slug', requirePermission(PERMISSIONS.DISCOVERY_READ), (req, res) => {
  const ngo = getProfileBySlug(req.params.slug, { audience: 'corporate' })
  if (!ngo) return fail(res, 404, 'NGO not found')
  ok(res, ngo)
})

router.get('/projects', requirePermission(PERMISSIONS.PROJECTS_READ), (req, res) => {
  ok(res, listProjects({ corporateTenantId: req.user.tenantId, audience: 'corporate' }))
})

router.post('/projects', requirePermission(PERMISSIONS.PROJECTS_WRITE), validate(createProjectSchema), (req, res, next) => {
  try {
    const project = createProject({
      ...req.validated,
      corporateTenantId: req.user.tenantId,
      userId: req.user.sub,
    }, req)
    ok(res, project, 'Project created')
  } catch (err) {
    next(err)
  }
})

router.get('/projects/:id', requirePermission(PERMISSIONS.PROJECTS_READ), (req, res) => {
  const project = getProject(req.params.id, { corporateTenantId: req.user.tenantId, audience: 'corporate' })
  if (!project) return fail(res, 404, 'Project not found')
  ok(res, project)
})

router.patch('/projects/:id', requirePermission(PERMISSIONS.PROJECTS_WRITE), validate(updateProjectSchema), (req, res, next) => {
  try {
    const project = updateProject(req.params.id, req.validated, {
      corporateTenantId: req.user.tenantId,
      req,
    })
    ok(res, project, 'Project updated')
  } catch (err) {
    next(err)
  }
})

router.delete('/projects/:id', requirePermission(PERMISSIONS.PROJECTS_WRITE), (req, res, next) => {
  try {
    const project = archiveProject(req.params.id, { corporateTenantId: req.user.tenantId, req })
    ok(res, project, 'Project archived')
  } catch (err) {
    next(err)
  }
})

router.post('/projects/:id/milestones', requirePermission(PERMISSIONS.PROJECTS_WRITE), validate(milestoneInputSchema), (req, res, next) => {
  try {
    const milestone = addMilestone(req.params.id, req.validated, {
      corporateTenantId: req.user.tenantId,
      req,
    })
    ok(res, milestone, 'Milestone added')
  } catch (err) {
    next(err)
  }
})

router.patch('/projects/:id/milestones/:mid', requirePermission(PERMISSIONS.PROJECTS_WRITE), validate(updateMilestoneSchema), (req, res, next) => {
  try {
    const milestone = updateMilestone(req.params.id, req.params.mid, req.validated, {
      corporateTenantId: req.user.tenantId,
      req,
    })
    ok(res, milestone, 'Milestone updated')
  } catch (err) {
    next(err)
  }
})

router.delete('/projects/:id/milestones/:mid', requirePermission(PERMISSIONS.PROJECTS_WRITE), (req, res, next) => {
  try {
    const result = deleteMilestone(req.params.id, req.params.mid, {
      corporateTenantId: req.user.tenantId,
      req,
    })
    ok(res, result, 'Milestone deleted')
  } catch (err) {
    next(err)
  }
})

router.post('/projects/:id/updates', requirePermission(PERMISSIONS.PROJECTS_WRITE), validate(createUpdateSchema), (req, res, next) => {
  try {
    const update = addProjectUpdate(req.params.id, {
      userId: req.user.sub,
      body: req.validated.body,
    }, { corporateTenantId: req.user.tenantId, req })
    ok(res, update, 'Update posted')
  } catch (err) {
    next(err)
  }
})

router.post('/projects/:id/updates/:uid/files', requirePermission(PERMISSIONS.PROJECTS_WRITE), validate(attachUpdateFilesSchema), (req, res, next) => {
  try {
    const files = attachFilesToUpdate(req.params.uid, req.validated.fileIds, {
      corporateTenantId: req.user.tenantId,
    })
    ok(res, { files }, 'Files attached')
  } catch (err) {
    next(err)
  }
})

router.post('/projects/:id/kpis', requirePermission(PERMISSIONS.IMPACT_WRITE), validate(kpiInputSchema), (req, res, next) => {
  try {
    const kpi = addKpi(req.params.id, req.validated, { corporateTenantId: req.user.tenantId, req })
    ok(res, kpi, 'KPI recorded')
  } catch (err) {
    next(err)
  }
})

router.post('/projects/:id/beneficiaries', requirePermission(PERMISSIONS.IMPACT_WRITE), validate(beneficiaryLogSchema), (req, res, next) => {
  try {
    const result = addBeneficiaryLog(req.params.id, req.validated, {
      corporateTenantId: req.user.tenantId,
      userId: req.user.sub,
      req,
    })
    ok(res, result, 'Beneficiary log added')
  } catch (err) {
    next(err)
  }
})

router.post('/projects/:id/geo', requirePermission(PERMISSIONS.IMPACT_WRITE), validate(geoUpdateSchema), (req, res, next) => {
  try {
    const geo = addGeoUpdate(req.params.id, req.validated, { corporateTenantId: req.user.tenantId, req })
    ok(res, geo, 'Geo update added')
  } catch (err) {
    next(err)
  }
})

router.patch('/projects/:id/spent', requirePermission(PERMISSIONS.FUNDS_READ), validate(updateSpentSchema), (req, res, next) => {
  try {
    const project = updateProjectSpent(req.params.id, req.validated.spentInr, {
      corporateTenantId: req.user.tenantId,
      req,
    })
    ok(res, project, 'Spent updated')
  } catch (err) {
    next(err)
  }
})

router.get('/compliance/summary', requirePermission(PERMISSIONS.COMPLIANCE_READ), (req, res, next) => {
  try {
    ok(res, getComplianceSummary(req.user.tenantId))
  } catch (err) {
    next(err)
  }
})

router.patch('/compliance/profile', requirePermission(PERMISSIONS.COMPLIANCE_WRITE), validate(updateCsrProfileSchema), (req, res, next) => {
  try {
    ok(res, updateProfile(req.user.tenantId, req.validated, undefined, req), 'Profile updated')
  } catch (err) {
    next(err)
  }
})

router.patch('/compliance/alerts/:id/acknowledge', requirePermission(PERMISSIONS.COMPLIANCE_READ), (req, res, next) => {
  try {
    ok(res, acknowledgeAlert(req.params.id, req.user.tenantId, req), 'Alert acknowledged')
  } catch (err) {
    next(err)
  }
})

router.post('/compliance/run-check', requirePermission(PERMISSIONS.COMPLIANCE_READ), (req, res, next) => {
  try {
    ok(res, syncComplianceForTenant(req.user.tenantId), 'Compliance check completed')
  } catch (err) {
    next(err)
  }
})

router.get('/compliance/mca-export', requirePermission(PERMISSIONS.COMPLIANCE_EXPORT), (req, res, next) => {
  try {
    ok(res, exportMcaCsr2(req.user.tenantId))
  } catch (err) {
    next(err)
  }
})

router.get('/reporting/overview', requirePermission(PERMISSIONS.REPORTING_READ), (req, res, next) => {
  try {
    ok(res, getReportingOverview(req.user.tenantId))
  } catch (err) {
    next(err)
  }
})

router.get('/esg/unified', requirePermission(PERMISSIONS.REPORTING_READ), validate(esgUnifiedQuerySchema, 'query'), (req, res, next) => {
  try {
    ok(res, getUnifiedEsgDashboard(req.user.tenantId, req.validated))
  } catch (err) {
    next(err)
  }
})

router.get('/reports', requirePermission(PERMISSIONS.REPORTING_READ), (req, res) => {
  ok(res, { reports: listReports(req.user.tenantId) })
})

router.post('/reports/generate', requirePermission(PERMISSIONS.REPORTS_GENERATE), validate(generateReportSchema), async (req, res, next) => {
  try {
    const report = await generateReport({
      corporateTenantId: req.user.tenantId,
      userId: req.user.sub,
      ...req.validated,
      req,
    })
    ok(res, report, 'Report generated')
  } catch (err) {
    next(err)
  }
})

router.post('/reports/preview', requirePermission(PERMISSIONS.REPORTING_READ), validate(previewReportSchema), async (req, res, next) => {
  try {
    const document = await previewReport(req.user.tenantId, req.validated)
    ok(res, document)
  } catch (err) {
    next(err)
  }
})

router.get('/reports/:id', requirePermission(PERMISSIONS.REPORTING_READ), (req, res) => {
  const report = getReport(req.params.id, req.user.tenantId)
  if (!report) return fail(res, 404, 'Report not found')
  ok(res, report)
})

router.post('/reports/:id/submit', requirePermission(PERMISSIONS.REPORTS_GENERATE), (req, res, next) => {
  try {
    ok(res, submitReport(req.params.id, req.user.tenantId, req), 'Report submitted')
  } catch (err) {
    next(err)
  }
})

router.get('/funds/allocation', requirePermission(PERMISSIONS.FUNDS_READ), (req, res, next) => {
  try {
    ok(res, getFundAllocation(req.user.tenantId))
  } catch (err) {
    next(err)
  }
})

router.post('/funds/intelligence', requirePermission(PERMISSIONS.FUNDS_READ), validate(allocationIntelligenceSchema), async (req, res, next) => {
  try {
    ok(res, await runAllocationIntelligence(req.user.tenantId, req.validated))
  } catch (err) {
    next(err)
  }
})

router.get('/volunteers/summary', (req, res, next) => {
  try {
    ok(res, getVolunteerSummary(req.user.tenantId))
  } catch (err) {
    next(err)
  }
})

router.get('/volunteers/events', validate(volunteerEventsQuerySchema, 'query'), (req, res, next) => {
  try {
    ok(res, { events: listEvents(req.user.tenantId, req.validated) })
  } catch (err) {
    next(err)
  }
})

router.post('/volunteers/events', requirePermission(PERMISSIONS.VOLUNTEERS_MANAGE), validate(createVolunteerEventSchema), async (req, res, next) => {
  try {
    const event = createEvent(req.user.tenantId, req.user.id, req.validated)
    await logMutation({ req, action: 'volunteer.event.create', entityType: 'volunteer_event', entityId: event.id, after: event })
    ok(res, event, 201)
  } catch (err) {
    next(err)
  }
})

router.get('/volunteers/events/:id', (req, res, next) => {
  try {
    ok(res, getEvent(req.user.tenantId, req.params.id))
  } catch (err) {
    next(err)
  }
})

router.patch('/volunteers/events/:id', requirePermission(PERMISSIONS.VOLUNTEERS_MANAGE), validate(updateVolunteerEventSchema), async (req, res, next) => {
  try {
    const event = updateEvent(req.user.tenantId, req.params.id, req.validated)
    await logMutation({ req, action: 'volunteer.event.update', entityType: 'volunteer_event', entityId: event.id, after: event })
    ok(res, event)
  } catch (err) {
    next(err)
  }
})

router.get('/volunteers/signups', (req, res, next) => {
  try {
    const eventId = req.query.eventId || undefined
    ok(res, { signups: listSignups(req.user.tenantId, { eventId }) })
  } catch (err) {
    next(err)
  }
})

router.get('/volunteers/calendar', (req, res, next) => {
  try {
    ok(res, { events: listCalendarEvents(req.user.tenantId) })
  } catch (err) {
    next(err)
  }
})

router.post('/volunteers/events/:id/register', async (req, res, next) => {
  try {
    const result = registerForEvent(req.user.tenantId, req.params.id, req.user.id)
    await logMutation({ req, action: 'volunteer.signup', entityType: 'volunteer_signup', entityId: result.signupId, after: result })
    ok(res, result, 201)
  } catch (err) {
    next(err)
  }
})

router.delete('/volunteers/events/:id/register', async (req, res, next) => {
  try {
    ok(res, cancelRegistration(req.user.tenantId, req.params.id, req.user.id))
  } catch (err) {
    next(err)
  }
})

router.post('/volunteers/events/:id/qr', requirePermission(PERMISSIONS.VOLUNTEERS_MANAGE), (req, res, next) => {
  try {
    ok(res, mintQrToken(req.user.tenantId, req.params.id), 201)
  } catch (err) {
    next(err)
  }
})

router.get('/volunteers/events/:id/qr', requirePermission(PERMISSIONS.VOLUNTEERS_MANAGE), async (req, res, next) => {
  try {
    ok(res, await getQrPayload(req.user.tenantId, req.params.id))
  } catch (err) {
    next(err)
  }
})

router.post('/volunteers/check-in', validate(volunteerCheckInSchema), async (req, res, next) => {
  try {
    const result = checkInWithToken(req.user.tenantId, req.user.id, req.validated.token)
    await logMutation({ req, action: 'volunteer.checkin', entityType: 'volunteer_event', entityId: result.eventTitle, after: result })
    ok(res, result)
  } catch (err) {
    next(err)
  }
})

router.post('/volunteers/events/:id/attendance/manual', requirePermission(PERMISSIONS.VOLUNTEERS_MANAGE), validate(manualAttendanceSchema), async (req, res, next) => {
  try {
    const result = recordManualAttendance(req.user.tenantId, req.params.id, req.validated.signupIds, req.user.id)
    await logMutation({ req, action: 'volunteer.attendance.manual', entityType: 'volunteer_event', entityId: req.params.id, after: result })
    ok(res, result)
  } catch (err) {
    next(err)
  }
})

router.post('/volunteers/signups/:id/certificate', async (req, res, next) => {
  try {
    const cert = await issueCertificate(req.user.tenantId, req.params.id, req.user.id, req)
    await logMutation({ req, action: 'volunteer.certificate.issue', entityType: 'volunteer_certificate', entityId: cert.id, after: cert })
    ok(res, cert, 201)
  } catch (err) {
    next(err)
  }
})

router.get('/volunteers/certificates/:id', (req, res, next) => {
  try {
    ok(res, getCertificate(req.user.tenantId, req.params.id))
  } catch (err) {
    next(err)
  }
})

router.get('/audit/trail', requirePermission(PERMISSIONS.ACTIVITY_READ), validate(auditQuerySchema, 'query'), (req, res) => {
  ok(res, { trail: getAuditTrail(req.user.tenantId, req.validated) })
})

router.get('/audit/folders', requirePermission(PERMISSIONS.ACTIVITY_READ), validate(auditQuerySchema, 'query'), (req, res) => {
  ok(res, { folders: getAuditFolderTree(req.user.tenantId, req.validated) })
})

router.post('/audit/export', requirePermission(PERMISSIONS.ACTIVITY_EXPORT), validate(auditExportSchema), async (req, res, next) => {
  try {
    const { buffer, fileName } = await buildAuditPackage(req.user.tenantId, req.validated, req)
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename(fileName)}"`)
    res.send(buffer)
  } catch (err) {
    next(err)
  }
})

router.get('/documents', requirePermission(PERMISSIONS.DOCUMENTS_READ), (req, res) => {
  ok(res, listDocumentsGrouped(req.user.tenantId))
})

router.get('/files/:id/versions', requirePermission(PERMISSIONS.FILES_DOWNLOAD), (req, res) => {
  ok(res, { versions: listFileVersions(req.params.id, req.user.tenantId) })
})

router.post('/files/:id/versions', requirePermission(PERMISSIONS.FILES_UPLOAD), upload.single('file'), validate(fileVersionSchema), async (req, res, next) => {
  try {
    if (!req.file) return fail(res, 400, 'No file provided')
    const tenant = db.select().from(tenants).where(eq(tenants.id, req.user.tenantId)).get()
    const updated = await createFileVersion(req.params.id, {
      buffer: req.file.buffer,
      uploadedBy: req.user.sub,
      tenantId: req.user.tenantId,
      tenantType: tenant?.type || 'corporate',
      changeNote: req.validated?.changeNote,
      req,
    })
    ok(res, updated, 'Version created')
  } catch (err) {
    next(err)
  }
})

router.get('/settings/permission-matrix', requirePermission(PERMISSIONS.SETTINGS_MANAGE), (_req, res) => {
  ok(res, { matrix: getPermissionMatrix() })
})

router.get('/communications/threads', requirePermission(PERMISSIONS.COMMUNICATIONS_READ), (req, res) => {
  ok(res, { threads: listThreadsForCorporate(req.user.tenantId) })
})

router.post('/communications/threads', requirePermission(PERMISSIONS.COMMUNICATIONS_READ), validate(createThreadSchema), (req, res, next) => {
  try {
    ok(res, createThread({
      corporateTenantId: req.user.tenantId,
      ngoTenantId: req.validated.ngoTenantId,
      ngoSlug: req.validated.ngoSlug,
      projectId: req.validated.projectId,
      subject: req.validated.subject,
      createdBy: req.user.sub,
      message: req.validated.message,
    }, req))
  } catch (err) {
    next(err)
  }
})

router.get('/communications/threads/:id', requirePermission(PERMISSIONS.COMMUNICATIONS_READ), (req, res, next) => {
  try {
    ok(res, getThread(req.params.id, req.user))
  } catch (err) {
    next(err)
  }
})

router.post('/communications/threads/:id/messages', requirePermission(PERMISSIONS.COMMUNICATIONS_READ), validate(postMessageSchema), (req, res, next) => {
  try {
    ok(res, postMessage(req.params.id, req.user.sub, req.validated.body, req.user, req))
  } catch (err) {
    next(err)
  }
})

router.get('/projects/:id/crm/thread', requirePermission(PERMISSIONS.PROJECTS_READ), (req, res, next) => {
  try {
    ok(res, getOrCreateProjectThread(req.params.id, req.user, req))
  } catch (err) {
    next(err)
  }
})

router.get('/projects/:id/tasks', requirePermission(PERMISSIONS.PROJECTS_READ), (req, res) => {
  ok(res, { tasks: listTasksForProject(req.params.id) })
})

router.post('/projects/:id/tasks', requirePermission(PERMISSIONS.PROJECTS_WRITE), validate(createTaskSchema), (req, res, next) => {
  try {
    ok(res, createTask(req.params.id, req.validated, req.user.sub, req))
  } catch (err) {
    next(err)
  }
})

router.patch('/projects/:id/tasks/:taskId', requirePermission(PERMISSIONS.PROJECTS_WRITE), validate(updateTaskSchema), (req, res, next) => {
  try {
    ok(res, updateTaskStatus(req.params.taskId, req.validated, req.user, req))
  } catch (err) {
    next(err)
  }
})

router.get('/projects/:id/timeline', requirePermission(PERMISSIONS.PROJECTS_READ), (req, res) => {
  ok(res, { timeline: getProjectTimeline(req.params.id) })
})

router.get('/copilot/suggestions', requirePermission(PERMISSIONS.COPILOT_USE), (req, res) => {
  ok(res, { suggestions: getCopilotSuggestions(req.user.tenantId) })
})

router.post('/copilot/chat', requirePermission(PERMISSIONS.COPILOT_USE), validate(copilotChatSchema), async (req, res, next) => {
  try {
    const result = await ragCopilotChat(req.user.tenantId, req.validated.message, req.validated.history)
    ok(res, result)
  } catch (err) {
    next(err)
  }
})

router.post('/ai/rag/recommend', requirePermission(PERMISSIONS.COPILOT_USE), validate(ragRecommendSchema), async (req, res, next) => {
  try {
    ok(res, await ragRecommendNgos(req.user.tenantId, req.validated.query))
  } catch (err) {
    next(err)
  }
})

router.post('/ai/rag/reindex', requirePermission(PERMISSIONS.DISCOVERY_READ), async (req, res, next) => {
  try {
    ok(res, await reindexAllVectors())
  } catch (err) {
    next(err)
  }
})

router.post('/ai/match-ngos', requirePermission(PERMISSIONS.DISCOVERY_READ), validate(matchNgosSchema), async (req, res, next) => {
  try {
    ok(res, await matchNgos(req.user.tenantId, req.validated))
  } catch (err) {
    next(err)
  }
})

router.post('/ai/search', requirePermission(PERMISSIONS.SEARCH_READ), validate(aiSearchSchema), async (req, res, next) => {
  try {
    const { query } = req.validated
    if (isNgoDiscoveryQuery(query)) {
      ok(res, await ragRecommendNgos(req.user.tenantId, query))
    } else {
      ok(res, await aiSearch(req.user.tenantId, query))
    }
  } catch (err) {
    next(err)
  }
})

router.post('/ai/narrative', requirePermission(PERMISSIONS.REPORTING_READ), validate(narrativeSchema), async (req, res, next) => {
  try {
    ok(res, await generateNarrative(req.user.tenantId, req.validated))
  } catch (err) {
    next(err)
  }
})

router.get('/impact/live', requirePermission(PERMISSIONS.PROJECTS_READ), (req, res) => {
  ok(res, getImpactLiveSnapshot(req.user.tenantId))
})

router.post('/ai/impact-summary', requirePermission(PERMISSIONS.COPILOT_USE), async (req, res, next) => {
  try {
    ok(res, await generateImpactSummary(req.user.tenantId))
  } catch (err) {
    next(err)
  }
})

router.post('/ai/esg-summary', requirePermission(PERMISSIONS.REPORTING_READ), validate(esgSummarySchema), async (req, res, next) => {
  try {
    ok(res, await generateEsgSummary(req.user.tenantId))
  } catch (err) {
    next(err)
  }
})

export default router
