import { Router } from 'express'
import { authenticate, requireRole } from '../../middleware/authenticate.js'
import { requirePermission } from '../../middleware/permissions.js'
import { PERMISSIONS, getPermissionMatrix } from '../../lib/permissions.js'
import { ok } from '../../lib/response.js'
import { db } from '../../db/index.js'
import { findEntitiesByTags, getEntityTags } from '../../services/tags/index.js'
import { tenants } from '../../db/schema.js'
import { eq } from 'drizzle-orm'
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
  let ngos = filterNgos(req.query)
  if (req.query.tags) {
    const slugs = String(req.query.tags).split(',').map((s) => s.trim())
    const entityIds = findEntitiesByTags('ngo', slugs)
    const matchedSlugs = new Set()
    for (const tenantId of entityIds) {
      const t = db.select().from(tenants).where(eq(tenants.id, tenantId)).get()
      if (t) matchedSlugs.add(t.slug)
    }
    ngos = ngos.filter((n) => matchedSlugs.has(n.slug))
  }
  const enriched = ngos.map((n) => {
    const t = db.select().from(tenants).where(eq(tenants.slug, n.slug)).get()
    const tags = t ? getEntityTags('ngo', t.id) : []
    return { ...n, tags: tags.map((tag) => tag.slug) }
  })
  ok(res, { ngos: enriched, total: enriched.length })
})

router.get('/ngos/:slug', (req, res) => {
  const ngo = getNgo(req.params.slug)
  if (!ngo) return res.status(404).json({ ok: false, message: 'NGO not found' })
  const t = db.select().from(tenants).where(eq(tenants.slug, req.params.slug)).get()
  const tags = t ? getEntityTags('ngo', t.id) : []
  ok(res, { ...ngo, tags: tags.map((tag) => tag.slug) })
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
