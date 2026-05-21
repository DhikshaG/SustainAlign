import { Router } from 'express'
import { authenticate, requireRole } from '../../middleware/authenticate.js'
import { requirePermission } from '../../middleware/permissions.js'
import { validate } from '../../middleware/validate.js'
import { PERMISSIONS, getPermissionMatrix } from '../../lib/permissions.js'
import { ok, fail } from '../../lib/response.js'
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
  volunteerCampaigns,
  documents,
  communications,
} from '../../data/corporate-sample.js'
import { getDashboardSummary, getReportingOverview } from '../../services/dashboard/index.js'
import { getComplianceSummary, getFundAllocation, updateProfile, acknowledgeAlert, exportMcaCsr2, syncComplianceForTenant } from '../../services/compliance/index.js'
import { deriveDefaultsFromProjects } from '../../services/matching/index.js'
import { listReports, generateReport, getReport, submitReport } from '../../services/reports/index.js'
import {
  getCopilotSuggestions,
  copilotChat,
  matchNgos,
  aiSearch,
  generateNarrative,
  generateImpactSummary,
} from '../../services/ai/context.js'
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
import { generateReportSchema } from '../../schemas/reports.js'
import { updateCsrProfileSchema } from '../../schemas/compliance.js'
import {
  copilotChatSchema,
  matchNgosSchema,
  aiSearchSchema,
  narrativeSchema,
} from '../../schemas/ai.js'

const CORPORATE_ROLES = ['super_admin', 'csr_head', 'esg_head', 'finance', 'compliance', 'volunteer', 'board']

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
    ok(res, updateProfile(req.user.tenantId, req.validated), 'Profile updated')
  } catch (err) {
    next(err)
  }
})

router.patch('/compliance/alerts/:id/acknowledge', requirePermission(PERMISSIONS.COMPLIANCE_READ), (req, res, next) => {
  try {
    ok(res, acknowledgeAlert(req.params.id, req.user.tenantId), 'Alert acknowledged')
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

router.get('/reports/:id', requirePermission(PERMISSIONS.REPORTING_READ), (req, res) => {
  const report = getReport(req.params.id, req.user.tenantId)
  if (!report) return fail(res, 404, 'Report not found')
  ok(res, report)
})

router.post('/reports/:id/submit', requirePermission(PERMISSIONS.REPORTS_GENERATE), (req, res, next) => {
  try {
    ok(res, submitReport(req.params.id, req.user.tenantId), 'Report submitted')
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

router.get('/volunteers/campaigns', (_req, res) => ok(res, volunteerCampaigns))

router.get('/documents', requirePermission(PERMISSIONS.DOCUMENTS_READ), (_req, res) => ok(res, documents))

router.get('/settings/permission-matrix', requirePermission(PERMISSIONS.SETTINGS_MANAGE), (_req, res) => {
  ok(res, { matrix: getPermissionMatrix() })
})

router.get('/communications/threads', (_req, res) => ok(res, communications))

router.get('/copilot/suggestions', requirePermission(PERMISSIONS.COPILOT_USE), (req, res) => {
  ok(res, { suggestions: getCopilotSuggestions(req.user.tenantId) })
})

router.post('/copilot/chat', requirePermission(PERMISSIONS.COPILOT_USE), validate(copilotChatSchema), async (req, res, next) => {
  try {
    const result = await copilotChat(req.user.tenantId, req.validated.message, req.validated.history)
    ok(res, result)
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
    ok(res, await aiSearch(req.user.tenantId, req.validated.query))
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

export default router
