import { createHash } from 'node:crypto'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { files, fileVersions, csrProjects } from '../../db/schema.js'
import { newId } from '../../lib/ids.js'
import { getStorage, isAllowedMime } from '../../lib/storage/index.js'
import { logActivity } from '../activity-log/index.js'

const CATEGORY_LABELS = {
  project_evidence: 'Evidence',
  project_update: 'Updates',
  invoice: 'Invoices',
  compliance: 'Utilization Certificates',
  report: 'Reports',
  ngo_evidence: 'NGO Evidence',
  ngo_verification: 'Verification',
}

function httpError(message, status) {
  const err = new Error(message)
  err.status = status
  return err
}

export function computeChecksum(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

export function deriveFiscalYear(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  const month = d.getMonth() + 1
  const year = d.getFullYear()
  const startYear = month >= 4 ? year : year - 1
  const endYear = (startYear + 1) % 100
  return `FY${startYear}-${String(endYear).padStart(2, '0')}`
}

function sanitizeSegment(name) {
  return (
    (name || 'General')
      .replace(/[/\\?%*:|"<>]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80) || 'General'
  )
}

export async function deriveAuditPath({ category, entityType, entityId, originalName, fiscalYear }) {
  const fy = fiscalYear || deriveFiscalYear()
  const categoryLabel = CATEGORY_LABELS[category] || category
  let projectSegment = 'General'

  if (entityType === 'project' && entityId) {
    const project = await db.select().from(csrProjects).where(eq(csrProjects.id, entityId)).get()
    if (project?.name) projectSegment = sanitizeSegment(project.name)
  }

  const fileName = sanitizeSegment(originalName)
  return `${fy}/${projectSegment}/${categoryLabel}/${fileName}`
}

async function resolveFiscalYearForFile({ entityType, entityId }) {
  if (entityType === 'project' && entityId) {
    const project = await db.select().from(csrProjects).where(eq(csrProjects.id, entityId)).get()
    if (project?.startDate) return deriveFiscalYear(new Date(project.startDate))
  }
  return deriveFiscalYear()
}

function shapeFile(row) {
  return {
    ...row,
    downloadUrl: `/api/files/${row.id}/download`,
  }
}

export async function storeFile({
  req,
  buffer,
  tenantId,
  tenantType,
  uploadedBy,
  category,
  originalName,
  mime,
  entityType = null,
  entityId = null,
}) {
  if (!isAllowedMime(category, mime)) {
    throw httpError(`File type not allowed for category ${category}`, 400)
  }

  const checksum = computeChecksum(buffer)
  const fiscalYear = resolveFiscalYearForFile({ entityType, entityId })
  const auditPath = deriveAuditPath({ category, entityType, entityId, originalName, fiscalYear })

  const storage = getStorage()
  const stored = await storage.upload(buffer, {
    tenantType,
    tenantId,
    category,
    originalName,
  })

  const now = new Date()
  const id = newId()

  await db
    .insert(files)
    .values({
      id,
      tenantId,
      uploadedBy,
      category,
      entityType,
      entityId,
      storageKey: stored.key,
      originalName,
      mime,
      sizeBytes: stored.size,
      checksum,
      auditPath,
      fiscalYear,
      version: 1,
      createdAt: now,
    })
    .run()

  await db
    .insert(fileVersions)
    .values({
      id: newId(),
      fileId: id,
      version: 1,
      storageKey: stored.key,
      checksum,
      uploadedBy,
      sizeBytes: stored.size,
      changeNote: null,
      createdAt: now,
    })
    .run()

  await logActivity({
    req,
    action: 'file.upload',
    entityType: 'file',
    entityId: id,
    metadata: { category, originalName, sizeBytes: stored.size, checksum, auditPath, fiscalYear },
  })

  return shapeFile({
    id,
    tenantId,
    category,
    entityType,
    entityId,
    originalName,
    mime,
    sizeBytes: stored.size,
    checksum,
    auditPath,
    fiscalYear,
    version: 1,
    createdAt: now,
  })
}

export async function createFileVersion(fileId, { buffer, uploadedBy, tenantId, tenantType, changeNote, req }) {
  const row = await db.select().from(files).where(eq(files.id, fileId)).get()
  if (!row || row.tenantId !== tenantId) throw httpError('File not found', 404)

  const nextVersion = (row.version || 1) + 1
  const checksum = computeChecksum(buffer)
  const storage = getStorage()
  const stored = await storage.upload(buffer, {
    tenantType,
    tenantId,
    category: row.category,
    originalName: row.originalName,
  })
  const now = new Date()
  const versionId = newId()

  await db
    .insert(fileVersions)
    .values({
      id: versionId,
      fileId,
      version: nextVersion,
      storageKey: stored.key,
      checksum,
      uploadedBy,
      sizeBytes: stored.size,
      changeNote: changeNote || null,
      createdAt: now,
    })
    .run()

  await db
    .update(files)
    .set({
      storageKey: stored.key,
      checksum,
      sizeBytes: stored.size,
      version: nextVersion,
    })
    .where(eq(files.id, fileId))
    .run()

  await logActivity({
    req,
    action: 'file.version.create',
    entityType: 'file',
    entityId: fileId,
    metadata: { version: nextVersion, checksum, changeNote },
    previousValue: { version: row.version, checksum: row.checksum },
  })

  return getFileById(fileId, tenantId)
}

export async function listFileVersions(fileId, tenantId) {
  const row = await db.select().from(files).where(eq(files.id, fileId)).get()
  if (!row || row.tenantId !== tenantId) return []
  return await db
    .select()
    .from(fileVersions)
    .where(eq(fileVersions.fileId, fileId))
    .orderBy(desc(fileVersions.version))
    .all()
}

export async function logFileDownload(fileId, req) {
  const row = await db.select().from(files).where(eq(files.id, fileId)).get()
  if (!row) return
  await logActivity({
    req,
    action: 'file.download',
    entityType: 'file',
    entityId: fileId,
    metadata: { originalName: row.originalName, category: row.category, auditPath: row.auditPath },
  })
}

export async function getFileById(id, tenantId) {
  const row = await db.select().from(files).where(eq(files.id, id)).get()
  if (!row || row.tenantId !== tenantId) return null
  return shapeFile(row)
}

export async function listFiles({ tenantId, category, entityType, entityId, fiscalYear, limit = 50 }) {
  const conditions = [eq(files.tenantId, tenantId)]
  if (category) conditions.push(eq(files.category, category))
  if (entityType) conditions.push(eq(files.entityType, entityType))
  if (entityId) conditions.push(eq(files.entityId, entityId))
  if (fiscalYear) conditions.push(eq(files.fiscalYear, fiscalYear))

  let query = await db.select().from(files).orderBy(desc(files.createdAt)).limit(limit)
  if (conditions.length === 1) {
    query = query.where(conditions[0])
  } else {
    query = query.where(and(...conditions))
  }
  return query.all().map(shapeFile)
}

export function listDocumentsGrouped(tenantId) {
  const rows = listFiles({ tenantId, limit: 500 })
  const groups = {}
  for (const f of rows) {
    const key = f.category || 'other'
    if (!groups[key]) groups[key] = []
    groups[key].push(f)
  }
  return { files: rows, groups }
}
