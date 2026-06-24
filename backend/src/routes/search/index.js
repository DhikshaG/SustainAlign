import { Router } from 'express'
import { z } from 'zod'
import { authenticate } from '../../middleware/authenticate.js'
import { requirePermission } from '../../middleware/permissions.js'
import { validate } from '../../middleware/validate.js'
import { ok } from '../../lib/response.js'
import { PERMISSIONS } from '../../lib/permissions.js'
import { search } from '../../services/search/index.js'
import { ngos } from '../../data/sample.js'

const searchSchema = z.object({
  q: z.string().min(1),
  types: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).optional(),
})

const router = Router()

router.get('/', authenticate, requirePermission(PERMISSIONS.SEARCH_READ), validate(searchSchema, 'query'), (req, res) => {
  const types = req.validated.types ? req.validated.types.split(',').map((t) => t.trim()) : []
  const results = search({
    q: req.validated.q,
    types,
    tenantId: req.user.tenantType === 'platform' ? null : req.user.tenantId,
    limit: req.validated.limit ?? 20,
  })
  return ok(res, { results, query: req.validated.q })
})

router.get('/public', validate(searchSchema, 'query'), (req, res) => {
  const term = req.validated.q.toLowerCase()
  const results = ngos
    .filter((n) =>
      n.name.toLowerCase().includes(term)
      || n.sector.toLowerCase().includes(term)
      || n.region.toLowerCase().includes(term),
    )
    .slice(0, req.validated.limit ?? 10)
    .map((n) => ({
      type: 'ngo',
      entityId: n.slug,
      title: n.name,
      snippet: n.description?.slice(0, 120),
      href: `/ngos/${n.slug}`,
    }))
  return ok(res, { results, query: req.validated.q })
})

export default router
