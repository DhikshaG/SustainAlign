import { Router } from 'express'
import { z } from 'zod'
import { authenticate } from '../../middleware/authenticate.js'
import { requirePermission } from '../../middleware/permissions.js'
import { validate } from '../../middleware/validate.js'
import { ok } from '../../lib/response.js'
import { PERMISSIONS } from '../../lib/permissions.js'
import {
  listCategories,
  listTagsByCategory,
  getEntityTags,
  setEntityTags,
} from '../../services/tags/index.js'

const router = Router()

const setTagsSchema = z.object({
  tagIds: z.array(z.string()).default([]),
})

router.get('/', authenticate, requirePermission(PERMISSIONS.TAGS_READ), (_req, res) => {
  return ok(res, { categories: listCategories() })
})

router.get('/:category', authenticate, requirePermission(PERMISSIONS.TAGS_READ), (req, res) => {
  return ok(res, { tags: listTagsByCategory(req.params.category) })
})

const entityRouter = Router()

entityRouter.get('/:type/:id/tags', authenticate, requirePermission(PERMISSIONS.TAGS_READ), (req, res) => {
  const tags = getEntityTags(req.params.type, req.params.id)
  return ok(res, { tags })
})

entityRouter.put('/:type/:id/tags', authenticate, requirePermission(PERMISSIONS.TAGS_WRITE), validate(setTagsSchema), (req, res) => {
  const tags = setEntityTags({
    req,
    entityType: req.params.type,
    entityId: req.params.id,
    tenantId: req.user.tenantId,
    tagIds: req.validated.tagIds,
  })
  return ok(res, { tags })
})

export { router as tagsRouter, entityRouter as entityTagsRouter }
