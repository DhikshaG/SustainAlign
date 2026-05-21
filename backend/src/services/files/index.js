import { eq, and } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { files } from '../../db/schema.js'
import { newId } from '../../lib/ids.js'
import { getStorage, isAllowedMime } from '../../lib/storage/index.js'
import { logActivity } from '../activity-log/index.js'

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
    const err = new Error(`File type not allowed for category ${category}`)
    err.status = 400
    throw err
  }

  const storage = getStorage()
  const stored = await storage.upload(buffer, {
    tenantType,
    tenantId,
    category,
    originalName,
  })

  const now = new Date()
  const id = newId()

  db.insert(files).values({
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
    createdAt: now,
  }).run()

  await logActivity({
    req,
    action: 'file.upload',
    entityType: 'file',
    entityId: id,
    metadata: { category, originalName, sizeBytes: stored.size },
  })

  return {
    id,
    tenantId,
    category,
    originalName,
    mime,
    sizeBytes: stored.size,
    downloadUrl: `/api/files/${id}/download`,
    createdAt: now,
  }
}

export function getFileById(id, tenantId) {
  const row = db.select().from(files).where(eq(files.id, id)).get()
  if (!row || row.tenantId !== tenantId) return null
  return row
}

export function listFiles({ tenantId, category, entityType, entityId, limit = 50 }) {
  const conditions = [eq(files.tenantId, tenantId)]
  if (category) conditions.push(eq(files.category, category))
  if (entityType) conditions.push(eq(files.entityType, entityType))
  if (entityId) conditions.push(eq(files.entityId, entityId))

  let query = db.select().from(files).limit(limit)
  if (conditions.length === 1) {
    query = query.where(conditions[0])
  } else {
    query = query.where(and(...conditions))
  }
  return query.all()
}
