import { eq, desc } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { reports } from '../../db/schema.js'
import { newId } from '../../lib/ids.js'
import { logMutation } from '../activity-log/index.js'
import { storeFile } from '../files/index.js'
import { buildReportContext } from './context.js'
import { composeReportContent, previewReport } from './compose.js'
import { TYPE_TITLES, FORMAT_MIME, FORMAT_EXT } from './templates.js'
import { exportPdf } from './export/pdf.js'
import { exportDocx } from './export/docx.js'
import { exportPptx } from './export/pptx.js'

function httpError(message, status) {
  const err = new Error(message)
  err.status = status
  return err
}

const LEGACY_PDF_ONLY = new Set(['sdg', 'impact', 'mca_csr2'])

async function renderBuffer(document, format) {
  if (format === 'docx') return exportDocx(document)
  if (format === 'pptx') return exportPptx(document)
  return exportPdf(document)
}

function parseMetadata(row) {
  try {
    return row.metadataJson ? JSON.parse(row.metadataJson) : {}
  } catch {
    return {}
  }
}

export function listReports(corporateTenantId) {
  return db.select().from(reports)
    .where(eq(reports.corporateTenantId, corporateTenantId))
    .orderBy(desc(reports.createdAt))
    .all()
    .map((r) => {
      const meta = parseMetadata(r)
      return {
        id: r.id,
        type: r.type,
        title: r.title,
        periodStart: r.periodStart,
        periodEnd: r.periodEnd,
        status: r.status,
        fileId: r.fileId,
        format: meta.format || 'pdf',
        downloadUrl: r.fileId ? `/api/files/${r.fileId}/download` : null,
        createdAt: r.createdAt,
      }
    })
}

export { previewReport }

export async function generateReport({
  corporateTenantId,
  userId,
  type,
  format = 'pdf',
  periodStart,
  periodEnd,
  includeAi = true,
  req,
}) {
  if (!TYPE_TITLES[type]) throw httpError('Invalid report type', 400)
  if (!FORMAT_MIME[format]) throw httpError('Invalid format', 400)
  if (LEGACY_PDF_ONLY.has(type) && format !== 'pdf') {
    throw httpError(`${type} reports support PDF only`, 400)
  }

  const context = buildReportContext(corporateTenantId, { periodStart, periodEnd })
  const document = await composeReportContent(context, type, { includeAi })
  const buffer = await renderBuffer(document, format)

  const title = TYPE_TITLES[type]
  const ext = FORMAT_EXT[format]
  const now = new Date()
  const reportId = newId()

  const stored = await storeFile({
    req,
    buffer,
    tenantId: corporateTenantId,
    tenantType: 'corporate',
    uploadedBy: userId,
    category: 'report',
    originalName: `${type}-${periodStart}-${periodEnd}.${ext}`,
    mime: FORMAT_MIME[format],
    entityType: 'report',
    entityId: reportId,
  })

  const metadata = {
    format,
    includeAi,
    aiGenerated: document.aiGenerated,
    offline: document.offline,
    sectionCount: document.sections.length,
  }

  db.insert(reports).values({
    id: reportId,
    corporateTenantId,
    type,
    title,
    periodStart,
    periodEnd,
    status: 'generated',
    fileId: stored.id,
    metadataJson: JSON.stringify(metadata),
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
  }).run()

  if (req) {
    logMutation({
      req,
      action: 'report.generate',
      entityType: 'report',
      entityId: reportId,
      after: { type, format, periodStart, periodEnd, fileId: stored.id },
    }).catch(() => {})
  }

  return {
    id: reportId,
    type,
    title,
    format,
    periodStart,
    periodEnd,
    status: 'generated',
    fileId: stored.id,
    downloadUrl: `/api/files/${stored.id}/download`,
    offline: document.offline,
    aiGenerated: document.aiGenerated,
  }
}

export function getReport(id, corporateTenantId) {
  const row = db.select().from(reports).where(eq(reports.id, id)).get()
  if (!row || row.corporateTenantId !== corporateTenantId) return null
  const meta = parseMetadata(row)
  return {
    ...row,
    format: meta.format || 'pdf',
    downloadUrl: row.fileId ? `/api/files/${row.fileId}/download` : null,
  }
}

export function submitReport(id, corporateTenantId, req) {
  const row = getReport(id, corporateTenantId)
  if (!row) throw httpError('Report not found', 404)
  db.update(reports)
    .set({ status: 'submitted', updatedAt: new Date() })
    .where(eq(reports.id, id))
    .run()
  if (req) {
    logMutation({
      req,
      action: 'report.submit',
      entityType: 'report',
      entityId: id,
      before: { status: row.status },
      after: { status: 'submitted' },
    }).catch(() => {})
  }
  return { id, status: 'submitted' }
}
