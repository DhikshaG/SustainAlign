import { Router } from 'express'
import { authenticate, requireRole } from '../../middleware/authenticate.js'
import { requirePermission } from '../../middleware/permissions.js'
import { PERMISSIONS, getPermissionMatrix } from '../../lib/permissions.js'
import { ok } from '../../lib/response.js'
import {
  dashboardSummary,
  filterNgos,
  getNgo,
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

router.get('/discovery/ngos', (req, res) => {
  const ngos = filterNgos(req.query)
  ok(res, { ngos, total: ngos.length })
})

router.get('/ngos/:slug', (req, res) => {
  const ngo = getNgo(req.params.slug)
  if (!ngo) return res.status(404).json({ ok: false, message: 'NGO not found' })
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
