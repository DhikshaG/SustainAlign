import { Router } from 'express'
import { z } from 'zod'
import { authenticate } from '../../middleware/authenticate.js'
import { requirePermission } from '../../middleware/permissions.js'
import { validate } from '../../middleware/validate.js'
import { ok, fail } from '../../lib/response.js'
import { PERMISSIONS } from '../../lib/permissions.js'
import {
  createInstance,
  getInstance,
  listInboxForUser,
  transition,
} from '../../services/workflow/index.js'
import { db } from '../../db/index.js'
import { tenants } from '../../db/schema.js'
import { eq } from 'drizzle-orm'
import { newId } from '../../lib/ids.js'

const router = Router()

router.use(authenticate)

const createSchema = z.object({
  definitionSlug: z.string().default('ngo_report_approval'),
  entityType: z.string(),
  entityId: z.string(),
  title: z.string().optional(),
  tenantId: z.string().optional(),
})

const transitionSchema = z.object({
  action: z.enum(['approve', 'reject', 'request_revision']),
  comment: z.string().optional(),
})

router.get('/inbox', requirePermission(PERMISSIONS.WORKFLOW_READ), (req, res) => {
  const items = listInboxForUser(req.user.sub, req.user.role, req.user.tenantId)
  return ok(res, { items })
})

router.post('/instances', requirePermission(PERMISSIONS.WORKFLOW_SUBMIT), validate(createSchema), (req, res, next) => {
  try {
    const instance = createInstance({
      req,
      definitionSlug: req.validated.definitionSlug,
      tenantId: req.validated.tenantId || req.user.tenantId,
      entityType: req.validated.entityType,
      entityId: req.validated.entityId,
      submittedBy: req.user.sub,
      title: req.validated.title,
    })
    return ok(res, instance, 'Workflow started')
  } catch (err) {
    next(err)
  }
})

router.get('/instances/:id', requirePermission(PERMISSIONS.WORKFLOW_READ), (req, res) => {
  const instance = getInstance(req.params.id)
  if (!instance) return fail(res, 404, 'Workflow not found')
  return ok(res, instance)
})

router.post('/instances/:id/transition', requirePermission(PERMISSIONS.WORKFLOW_REVIEW), validate(transitionSchema), async (req, res, next) => {
  try {
    const instance = await transition({
      req,
      instanceId: req.params.id,
      action: req.validated.action,
      comment: req.validated.comment,
    })
    return ok(res, instance)
  } catch (err) {
    next(err)
  }
})

export default router

export const ngoReportsRouter = Router()

ngoReportsRouter.post('/', authenticate, requirePermission(PERMISSIONS.WORKFLOW_SUBMIT), async (req, res, next) => {
  try {
    if (req.user.tenantType !== 'ngo') return fail(res, 403, 'NGO account required')
    const corporate = db.select().from(tenants).where(eq(tenants.slug, 'acme-corp')).get()
    if (!corporate) return fail(res, 500, 'Demo corporate tenant not found')
    const reportId = newId()
    const title = req.body?.title || 'Q4 Utilization Report'
    const instance = createInstance({
      req,
      definitionSlug: 'ngo_report_approval',
      tenantId: corporate.id,
      entityType: 'report',
      entityId: reportId,
      submittedBy: req.user.sub,
      title,
    })
    return ok(res, { reportId, workflow: instance }, 'Report submitted for approval')
  } catch (err) {
    next(err)
  }
})
