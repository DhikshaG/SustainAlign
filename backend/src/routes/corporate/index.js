import { Router } from 'express'
import { authenticate, requireRole } from '../../middleware/authenticate.js'
import { requirePermission } from '../../middleware/permissions.js'
import { validate } from '../../middleware/validate.js'
import { PERMISSIONS, getPermissionMatrix } from '../../lib/permissions.js'
import { ok, fail } from '../../lib/response.js'
import { listProfiles, getProfileBySlug } from '../../services/ngo/index.js'
import { discoveryQuerySchema } from '../../schemas/ngo.js'
import { getDiscoveryFilterOptions } from '../../services/tags/index.js'
import {
  dashboardSummary,
  getProject,
  projects,
  complianceSummary,
  reportingOverview,
  fundAllocation,
  volunteerCampaigns,
  documents,
  communications,
  copilotSuggestions,
} from '../../data/corporate-sample.js'

const CORPORATE_ROLES = ['super_admin', 'csr_head', 'esg_head', 'finance', 'compliance', 'volunteer', 'board']

const router = Router()

router.use(authenticate, requireRole(...CORPORATE_ROLES))

router.get('/dashboard/summary', (_req, res) => ok(res, dashboardSummary))

router.get('/discovery/filters', requirePermission(PERMISSIONS.DISCOVERY_READ), (_req, res) => {
  ok(res, getDiscoveryFilterOptions())
})

router.get('/discovery/ngos', requirePermission(PERMISSIONS.DISCOVERY_READ), validate(discoveryQuerySchema, 'query'), (req, res) => {
  const result = listProfiles({ ...req.validated, audience: 'corporate' })
  ok(res, result)
})

router.get('/ngos/:slug', requirePermission(PERMISSIONS.DISCOVERY_READ), (req, res) => {
  const ngo = getProfileBySlug(req.params.slug, { audience: 'corporate' })
  if (!ngo) return fail(res, 404, 'NGO not found')
  ok(res, ngo)
})

router.get('/projects', (_req, res) => ok(res, { projects }))

router.get('/projects/:id', (req, res) => {
  const project = getProject(req.params.id)
  if (!project) return res.status(404).json({ ok: false, message: 'Project not found' })
  ok(res, project)
})

router.get('/compliance/summary', requirePermission(PERMISSIONS.COMPLIANCE_READ), (_req, res) => ok(res, complianceSummary))

router.get('/reporting/overview', (_req, res) => ok(res, reportingOverview))

router.get('/funds/allocation', (_req, res) => ok(res, fundAllocation))

router.get('/volunteers/campaigns', (_req, res) => ok(res, volunteerCampaigns))

router.get('/documents', requirePermission(PERMISSIONS.DOCUMENTS_READ), (_req, res) => ok(res, documents))

router.get('/settings/permission-matrix', requirePermission(PERMISSIONS.SETTINGS_MANAGE), (_req, res) => {
  ok(res, { matrix: getPermissionMatrix() })
})

router.get('/communications/threads', (_req, res) => ok(res, communications))

router.get('/copilot/suggestions', (_req, res) => ok(res, { suggestions: copilotSuggestions }))

export default router
