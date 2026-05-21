import { Router } from 'express'
import multer from 'multer'
import { authenticate, requireRole } from '../../middleware/authenticate.js'
import { requirePermission } from '../../middleware/permissions.js'
import { validate } from '../../middleware/validate.js'
import { ok, fail } from '../../lib/response.js'
import { PERMISSIONS } from '../../lib/permissions.js'
import { env } from '../../config/env.js'
import { NGO_ROLES } from '../../lib/permissions.js'
import {
  dashboardSummary,
  financeSummary,
} from '../../data/ngo-sample.js'
import {
  listProjects,
  getProject,
  updateMilestone,
  addProjectUpdate,
} from '../../services/projects/index.js'
import {
  addKpi,
  addBeneficiaryLog,
  addGeoUpdate,
  attachFilesToUpdate,
  listBeneficiaryLogsForNgo,
} from '../../services/impact/index.js'
import {
  updateMilestoneSchema,
  createUpdateSchema,
} from '../../schemas/projects.js'
import {
  kpiInputSchema,
  beneficiaryLogSchema,
  geoUpdateSchema,
  attachUpdateFilesSchema,
} from '../../schemas/impact.js'
import {
  getProfileByTenantId,
  updateProfile,
  replaceTeam,
  replacePastProjects,
  replaceImpactMetrics,
  addImpactStory,
  updateImpactStory,
  deleteImpactStory,
  addCertification,
  updateCertification,
  deleteCertification,
  attachMedia,
  listMedia,
  removeMedia,
  listDocuments,
} from '../../services/ngo/index.js'
import {
  updateNgoProfileSchema,
  replaceTeamSchema,
  replacePastProjectsSchema,
  replaceImpactMetricsSchema,
  impactStorySchema,
  certificationSchema,
} from '../../schemas/ngo.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
})

const router = Router()

function requireNgoTenant(req, res, next) {
  if (req.user?.tenantType !== 'ngo') {
    return fail(res, 403, 'NGO tenant required')
  }
  next()
}

router.use(authenticate, requireRole(...NGO_ROLES), requireNgoTenant)

router.get('/dashboard/summary', (_req, res) => ok(res, dashboardSummary))

router.get('/projects', requirePermission(PERMISSIONS.PROJECTS_READ), (req, res) => {
  ok(res, listProjects({ ngoTenantId: req.user.tenantId, audience: 'ngo' }))
})

router.get('/projects/:id', requirePermission(PERMISSIONS.PROJECTS_READ), (req, res) => {
  const project = getProject(req.params.id, { ngoTenantId: req.user.tenantId, audience: 'ngo' })
  if (!project) return fail(res, 404, 'Project not found')
  ok(res, project)
})

router.patch('/projects/:id/milestones/:mid', requirePermission(PERMISSIONS.PROJECTS_WRITE), validate(updateMilestoneSchema), (req, res, next) => {
  try {
    const milestone = updateMilestone(req.params.id, req.params.mid, req.validated, {
      ngoTenantId: req.user.tenantId,
      req,
    })
    ok(res, milestone, 'Milestone updated')
  } catch (err) {
    next(err)
  }
})

router.post('/projects/:id/updates', requirePermission(PERMISSIONS.PROJECTS_WRITE), validate(createUpdateSchema), (req, res, next) => {
  try {
    const update = addProjectUpdate(req.params.id, {
      userId: req.user.sub,
      body: req.validated.body,
    }, { ngoTenantId: req.user.tenantId, req })
    ok(res, update, 'Update posted')
  } catch (err) {
    next(err)
  }
})
router.get('/beneficiaries', requirePermission(PERMISSIONS.BENEFICIARIES_MANAGE), (req, res) => {
  ok(res, { logs: listBeneficiaryLogsForNgo(req.user.tenantId) })
})

router.post('/projects/:id/kpis', requirePermission(PERMISSIONS.PROJECTS_WRITE), validate(kpiInputSchema), (req, res, next) => {
  try {
    const kpi = addKpi(req.params.id, req.validated, { ngoTenantId: req.user.tenantId, req })
    ok(res, kpi, 'KPI recorded')
  } catch (err) {
    next(err)
  }
})

router.post('/projects/:id/beneficiaries', requirePermission(PERMISSIONS.BENEFICIARIES_MANAGE), validate(beneficiaryLogSchema), (req, res, next) => {
  try {
    const result = addBeneficiaryLog(req.params.id, req.validated, {
      ngoTenantId: req.user.tenantId,
      userId: req.user.sub,
      req,
    })
    ok(res, result, 'Beneficiary log added')
  } catch (err) {
    next(err)
  }
})

router.post('/projects/:id/geo', requirePermission(PERMISSIONS.PROJECTS_WRITE), validate(geoUpdateSchema), (req, res, next) => {
  try {
    const geo = addGeoUpdate(req.params.id, req.validated, { ngoTenantId: req.user.tenantId, req })
    ok(res, geo, 'Geo update added')
  } catch (err) {
    next(err)
  }
})

router.post('/projects/:id/updates/:uid/files', requirePermission(PERMISSIONS.PROJECTS_WRITE), validate(attachUpdateFilesSchema), (req, res, next) => {
  try {
    const files = attachFilesToUpdate(req.params.uid, req.validated.fileIds, {
      ngoTenantId: req.user.tenantId,
    })
    ok(res, { files }, 'Files attached')
  } catch (err) {
    next(err)
  }
})

router.get('/finance/summary', (_req, res) => ok(res, financeSummary))

router.get('/profile', (req, res) => {
  const profile = getProfileByTenantId(req.user.tenantId, 'ngo_admin')
  if (!profile) return fail(res, 404, 'Profile not found')
  return ok(res, profile)
})

router.patch('/profile', requirePermission(PERMISSIONS.NGO_PROFILE_WRITE), validate(updateNgoProfileSchema), async (req, res, next) => {
  try {
    const profile = await updateProfile(req.user.tenantId, req.validated, req)
    return ok(res, profile, 'Profile updated')
  } catch (err) {
    next(err)
  }
})

router.get('/profile/team', (req, res) => {
  const profile = getProfileByTenantId(req.user.tenantId, 'ngo_admin')
  return ok(res, { team: profile?.team || [] })
})

router.put('/profile/team', requirePermission(PERMISSIONS.NGO_PROFILE_WRITE), validate(replaceTeamSchema), (req, res) => {
  const team = replaceTeam(req.user.tenantId, req.validated.members, req)
  return ok(res, { team }, 'Team updated')
})

router.get('/profile/past-projects', (req, res) => {
  const profile = getProfileByTenantId(req.user.tenantId, 'ngo_admin')
  return ok(res, { projects: profile?.pastProjects || [] })
})

router.put('/profile/past-projects', requirePermission(PERMISSIONS.NGO_PROFILE_WRITE), validate(replacePastProjectsSchema), (req, res) => {
  const rows = replacePastProjects(req.user.tenantId, req.validated.projects, req)
  return ok(res, { projects: rows }, 'Past projects updated')
})

router.get('/profile/impact-metrics', (req, res) => {
  const profile = getProfileByTenantId(req.user.tenantId, 'ngo_admin')
  return ok(res, { metrics: profile?.impactMetrics || {} })
})

router.put('/profile/impact-metrics', requirePermission(PERMISSIONS.NGO_PROFILE_WRITE), validate(replaceImpactMetricsSchema), (req, res) => {
  const rows = replaceImpactMetrics(req.user.tenantId, req.validated.metrics, req)
  const metrics = {}
  for (const r of rows) metrics[r.metricKey] = r.value
  return ok(res, { metrics }, 'Impact metrics updated')
})

router.get('/profile/stories', (req, res) => {
  const profile = getProfileByTenantId(req.user.tenantId, 'ngo_admin')
  return ok(res, { stories: profile?.impactStories || [] })
})

router.post('/profile/stories', requirePermission(PERMISSIONS.NGO_PROFILE_WRITE), validate(impactStorySchema), (req, res) => {
  const story = addImpactStory(req.user.tenantId, req.validated)
  return ok(res, story, 'Story created')
})

router.patch('/profile/stories/:id', requirePermission(PERMISSIONS.NGO_PROFILE_WRITE), validate(impactStorySchema), (req, res) => {
  const story = updateImpactStory(req.user.tenantId, req.params.id, req.validated)
  if (!story) return fail(res, 404, 'Story not found')
  return ok(res, story, 'Story updated')
})

router.delete('/profile/stories/:id', requirePermission(PERMISSIONS.NGO_PROFILE_WRITE), (req, res) => {
  const removed = deleteImpactStory(req.user.tenantId, req.params.id)
  if (!removed) return fail(res, 404, 'Story not found')
  return ok(res, { id: req.params.id }, 'Story deleted')
})

router.get('/profile/certifications', (req, res) => {
  const profile = getProfileByTenantId(req.user.tenantId, 'ngo_admin')
  return ok(res, { certifications: profile?.certifications || [] })
})

router.post('/profile/certifications', requirePermission(PERMISSIONS.NGO_PROFILE_WRITE), validate(certificationSchema), (req, res) => {
  const cert = addCertification(req.user.tenantId, req.validated)
  return ok(res, cert, 'Certification added')
})

router.patch('/profile/certifications/:id', requirePermission(PERMISSIONS.NGO_PROFILE_WRITE), validate(certificationSchema), (req, res) => {
  const cert = updateCertification(req.user.tenantId, req.params.id, req.validated)
  if (!cert) return fail(res, 404, 'Certification not found')
  return ok(res, cert, 'Certification updated')
})

router.delete('/profile/certifications/:id', requirePermission(PERMISSIONS.NGO_PROFILE_WRITE), (req, res) => {
  const removed = deleteCertification(req.user.tenantId, req.params.id)
  if (!removed) return fail(res, 404, 'Certification not found')
  return ok(res, { id: req.params.id }, 'Certification deleted')
})

router.get('/profile/documents', (req, res) => {
  const docs = listDocuments(req.user.tenantId)
  const profile = getProfileByTenantId(req.user.tenantId, 'ngo_admin')
  return ok(res, {
    documents: docs,
    verificationStatus: profile?.verificationStatus,
  })
})

router.get('/profile/media', (req, res) => {
  return ok(res, { media: listMedia(req.user.tenantId) })
})

router.post(
  '/profile/media',
  requirePermission(PERMISSIONS.FILES_UPLOAD),
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) return fail(res, 400, 'No file provided')
      const category = req.body?.category
      if (!category) return fail(res, 400, 'category is required')
      const file = await attachMedia({
        req,
        tenantId: req.user.tenantId,
        tenantType: req.user.tenantType,
        uploadedBy: req.user.sub,
        buffer: req.file.buffer,
        category,
        originalName: req.file.originalname,
        mime: req.file.mimetype,
      })
      return ok(res, file, 'Media uploaded')
    } catch (err) {
      next(err)
    }
  },
)

router.delete('/profile/media/:id', requirePermission(PERMISSIONS.FILES_UPLOAD), async (req, res, next) => {
  try {
    const removed = await removeMedia(req.user.tenantId, req.params.id)
    if (!removed) return fail(res, 404, 'Media not found')
    return ok(res, { id: req.params.id }, 'Media removed')
  } catch (err) {
    next(err)
  }
})

export default router
