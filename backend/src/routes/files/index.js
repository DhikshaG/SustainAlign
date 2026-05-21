import { Router } from 'express'
import multer from 'multer'
import fs from 'node:fs'
import { authenticate } from '../../middleware/authenticate.js'
import { requirePermission } from '../../middleware/permissions.js'
import { validate } from '../../middleware/validate.js'
import { ok, fail } from '../../lib/response.js'
import { PERMISSIONS } from '../../lib/permissions.js'
import { env } from '../../config/env.js'
import { getStorage } from '../../lib/storage/index.js'
import { getFileById, listFiles, storeFile, logFileDownload } from '../../services/files/index.js'
import { z } from 'zod'
import { db } from '../../db/index.js'
import { tenants } from '../../db/schema.js'
import { eq } from 'drizzle-orm'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
})

const listSchema = z.object({
  category: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
})

const router = Router()

router.post(
  '/upload',
  authenticate,
  requirePermission(PERMISSIONS.FILES_UPLOAD),
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) return fail(res, 400, 'No file provided')
      const category = req.body?.category || req.query?.category
      if (!category) return fail(res, 400, 'category is required')

      const tenant = db.select().from(tenants).where(eq(tenants.id, req.user.tenantId)).get()
      const record = await storeFile({
        req,
        buffer: req.file.buffer,
        tenantId: req.user.tenantId,
        tenantType: tenant?.type || req.user.tenantType,
        uploadedBy: req.user.sub,
        category,
        originalName: req.file.originalname,
        mime: req.file.mimetype,
        entityType: req.body?.entityType || null,
        entityId: req.body?.entityId || null,
      })
      return ok(res, record, 'File uploaded')
    } catch (err) {
      next(err)
    }
  },
)

router.get('/', authenticate, requirePermission(PERMISSIONS.FILES_DOWNLOAD), validate(listSchema, 'query'), async (req, res, next) => {
  try {
    const rows = listFiles({
      tenantId: req.user.tenantId,
      ...req.validated,
    })
    return ok(res, { files: rows })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', authenticate, requirePermission(PERMISSIONS.FILES_DOWNLOAD), async (req, res, next) => {
  try {
    const row = getFileById(req.params.id, req.user.tenantId)
    if (!row) return fail(res, 404, 'File not found')
    return ok(res, {
      ...row,
      downloadUrl: `/api/files/${row.id}/download`,
    })
  } catch (err) {
    next(err)
  }
})

router.get('/:id/download', authenticate, requirePermission(PERMISSIONS.FILES_DOWNLOAD), async (req, res, next) => {
  try {
    const row = getFileById(req.params.id, req.user.tenantId)
    if (!row) return fail(res, 404, 'File not found')
    await logFileDownload(req.params.id, req)
    const storage = getStorage()
    const filePath = storage.resolvePath(row.storageKey)
    res.setHeader('Content-Type', row.mime)
    res.setHeader('Content-Disposition', `attachment; filename="${row.originalName}"`)
    fs.createReadStream(filePath).pipe(res)
  } catch (err) {
    next(err)
  }
})

export default router
