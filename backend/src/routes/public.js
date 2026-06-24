import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { ok, created, fail } from '../lib/response.js'
import { contactSchema, demoBookingSchema } from '../schemas/auth.corporate.js'
import { blogPosts, caseStudies, jobs } from '../data/sample.js'
import { listProfiles, getProfileBySlug } from '../services/ngo/index.js'

const router = Router()

router.post('/contact', validate(contactSchema), (req, res) => {
  console.log('[stub] contact:', req.validated.email)
  return created(res, req.validated, 'Message received (stub)')
})

router.post('/demo-booking', validate(demoBookingSchema), (req, res) => {
  console.log('[stub] demo booking:', req.validated.email)
  return created(res, req.validated, 'Demo request received (stub)')
})

router.get('/blog', (_req, res) => ok(res, blogPosts))
router.get('/blog/:slug', (req, res) => {
  const post = blogPosts.find((p) => p.slug === req.params.slug)
  if (!post) return res.status(404).json({ ok: false, message: 'Post not found' })
  return ok(res, post)
})

router.get('/ngos', (_req, res) => {
  const { ngos } = listProfiles({ verifiedOnly: true, audience: 'public' })
  const cards = ngos.map((n) => ({
    slug: n.slug,
    name: n.name,
    sector: n.sector,
    region: n.region,
    verified: n.verified,
    description: n.description,
    focusAreas: n.focusAreas,
    beneficiaries: n.beneficiaries,
    projects: n.projects,
  }))
  return ok(res, cards)
})

router.get('/ngos/:slug', (req, res) => {
  const ngo = getProfileBySlug(req.params.slug, { audience: 'public', verifiedOnly: true })
  if (!ngo) return fail(res, 404, 'NGO not found')
  return ok(res, ngo)
})

router.get('/case-studies', (_req, res) => ok(res, caseStudies))
router.get('/case-studies/:slug', (req, res) => {
  const cs = caseStudies.find((c) => c.slug === req.params.slug)
  if (!cs) return res.status(404).json({ ok: false, message: 'Case study not found' })
  return ok(res, cs)
})

router.get('/jobs', (_req, res) => ok(res, jobs))

export default router
