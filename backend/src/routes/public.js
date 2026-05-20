import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { ok, created } from '../lib/response.js'
import { contactSchema, demoBookingSchema } from '../schemas/auth.corporate.js'
import { blogPosts, ngos, caseStudies, jobs } from '../data/sample.js'

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

router.get('/ngos', (_req, res) => ok(res, ngos))
router.get('/ngos/:slug', (req, res) => {
  const ngo = ngos.find((n) => n.slug === req.params.slug)
  if (!ngo) return res.status(404).json({ ok: false, message: 'NGO not found' })
  return ok(res, ngo)
})

router.get('/case-studies', (_req, res) => ok(res, caseStudies))
router.get('/case-studies/:slug', (req, res) => {
  const cs = caseStudies.find((c) => c.slug === req.params.slug)
  if (!cs) return res.status(404).json({ ok: false, message: 'Case study not found' })
  return ok(res, cs)
})

router.get('/jobs', (_req, res) => ok(res, jobs))

router.get('/health', (_req, res) => ok(res, { status: 'healthy' }))

export default router
