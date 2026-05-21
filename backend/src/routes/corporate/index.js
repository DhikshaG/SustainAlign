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
  copilotSuggestions,
  complianceSummary,
  reportingOverview,
  fundAllocation,
} from '../../data/corporate-sample.js'
import { getDashboardSummary, getReportingOverview } from '../../services/dashboard/index.js'
import {
  addKpi,
  addBeneficiaryLog,
  addGeoUpdate,
  attachFilesToUpdate,
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

router.get('/compliance/summary', requirePermission(PERMISSIONS.COMPLIANCE_READ), (_req, res) => ok(res, complianceSummary))

router.get('/reporting/overview', requirePermission(PERMISSIONS.REPORTING_READ), (req, res, next) => {
  try {
    ok(res, getReportingOverview(req.user.tenantId))
  } catch (err) {
    next(err)
  }
})

router.get('/funds/allocation', (_req, res) => ok(res, fundAllocation))

router.get('/volunteers/campaigns', (_req, res) => ok(res, volunteerCampaigns))

router.get('/documents', requirePermission(PERMISSIONS.DOCUMENTS_READ), (_req, res) => ok(res, documents))

router.get('/settings/permission-matrix', requirePermission(PERMISSIONS.SETTINGS_MANAGE), (_req, res) => {
  ok(res, { matrix: getPermissionMatrix() })
})

router.get('/communications/threads', (_req, res) => ok(res, communications))

router.get('/copilot/suggestions', (_req, res) => ok(res, { suggestions: copilotSuggestions }))

export default router
