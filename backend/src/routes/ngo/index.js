import { Router } from 'express'
import { authenticate, requireRole } from '../../middleware/authenticate.js'
import { ok, fail } from '../../lib/response.js'
import {
  dashboardSummary,
  profile,
  projects,
  getProject,
  financeSummary,
  beneficiaries,
} from '../../data/ngo-sample.js'

const router = Router()

function requireNgoTenant(req, res, next) {
  if (req.user?.tenantType !== 'ngo') {
    return fail(res, 403, 'NGO tenant required')
  }
  next()
}

router.use(authenticate, requireRole('ngo_admin'), requireNgoTenant)

router.get('/dashboard/summary', (_req, res) => ok(res, dashboardSummary))
router.get('/profile', (_req, res) => ok(res, profile))
router.get('/projects', (_req, res) => ok(res, { projects }))
router.get('/projects/:id', (req, res) => {
  const project = getProject(req.params.id)
  if (!project) return fail(res, 404, 'Project not found')
  ok(res, project)
})
router.get('/finance/summary', (_req, res) => ok(res, financeSummary))
router.get('/beneficiaries', (_req, res) => ok(res, beneficiaries))

export default router
