import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execSync } from 'node:child_process'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { files, csrProjects, activityLogs } from '../../db/schema.js'
import { listActivity, formatActivityForExport } from '../activity-log/index.js'
import { getStorage } from '../../lib/storage/index.js'

const ACTION_TYPE_PREFIXES = {
  upload: ['file.upload', 'file.version.create'],
  approval: ['workflow.approve', 'workflow.reject', 'workflow.request_revision', 'workflow.submit'],
  payment: ['finance.disbursement.record'],
  edit: ['compliance.profile.update', 'compliance.alert.acknowledge', 'project.update', 'report.generate', 'report.submit', 'ngo.profile.update'],
}

const ACTION_LABELS = {
  'file.upload': 'File uploaded',
  'file.download': 'File downloaded',
  'file.delete': 'File deleted',
  'file.version.create': 'New file version',
  'workflow.approve': 'Approval granted',
  'workflow.reject': 'Approval rejected',
  'workflow.request_revision': 'Revision requested',
  'workflow.submit': 'Submitted for approval',
  'finance.disbursement.record': 'Disbursement recorded',
  'compliance.profile.update': 'Compliance profile updated',
  'compliance.alert.acknowledge': 'Alert acknowledged',
  'report.generate': 'Report generated',
  'report.submit': 'Report submitted',
}

function actionsForType(actionType) {
  if (!actionType || actionType === 'all') return null
  return ACTION_TYPE_PREFIXES[actionType] || null
}

function labelForAction(action) {
  return ACTION_LABELS[action] || action.replace(/\./g, ' ')
}

function filterByActionType(rows, actionType) {
  const allowed = actionsForType(actionType)
  if (!allowed) return rows
  return rows.filter((r) => allowed.some((a) => r.action === a || r.action.startsWith(a.split('.')[0])))
}

export function getAuditTrail(tenantId, filters = {}) {
  let rows = listActivity({
    tenantId,
    crossTenant: filters.crossTenant,
    filterTenantId: filters.filterTenantId,
    entityType: filters.entityType,
    entityId: filters.entityId,
    userId: filters.userId,
    action: filters.action,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    limit: filters.limit ?? 100,
    offset: filters.offset ?? 0,
  })

  if (filters.projectId) {
    rows = rows.filter((r) => {
      if (r.entityType === 'project' && r.entityId === filters.projectId) return true
      const meta = r.metadata ? (typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata) : null
      return meta?.projectId === filters.projectId
    })
  }

  rows = filterByActionType(rows, filters.actionType)

  return formatActivityForExport(rows).map((row) => ({
    ...row,
    label: labelForAction(row.action),
    category: categorizeAction(row.action),
  }))
}

function categorizeAction(action) {
  if (action.startsWith('file.')) return 'upload'
  if (action.startsWith('workflow.')) return 'approval'
  if (action.startsWith('finance.')) return 'payment'
  return 'edit'
}

export function getAuditFolderTree(tenantId, { fiscalYear, projectId } = {}) {
  const conditions = [eq(files.tenantId, tenantId)]
  if (fiscalYear) conditions.push(eq(files.fiscalYear, fiscalYear))
  if (projectId) {
    conditions.push(and(eq(files.entityType, 'project'), eq(files.entityId, projectId)))
  }

  let query = db.select().from(files).orderBy(desc(files.createdAt))
  if (conditions.length === 1) query = query.where(conditions[0])
  else query = query.where(and(...conditions))

  const rows = query.all()
  const tree = {}

  for (const f of rows) {
    const parts = (f.auditPath || `${f.fiscalYear || 'General'}/General/${f.category}/${f.originalName}`).split('/')
    const [fy, project, category, ...rest] = parts
    const fileName = rest.join('/') || f.originalName
    if (!tree[fy]) tree[fy] = { label: fy, projects: {} }
    if (!tree[fy].projects[project]) tree[fy].projects[project] = { label: project, categories: {} }
    if (!tree[fy].projects[project].categories[category]) {
      tree[fy].projects[project].categories[category] = { label: category, files: [] }
    }
    tree[fy].projects[project].categories[category].files.push({
      id: f.id,
      name: fileName,
      originalName: f.originalName,
      category: f.category,
      version: f.version,
      checksum: f.checksum,
      auditPath: f.auditPath,
      downloadUrl: `/api/files/${f.id}/download`,
      createdAt: f.createdAt,
    })
  }

  return Object.values(tree).map((fyNode) => ({
    fiscalYear: fyNode.label,
    projects: Object.values(fyNode.projects).map((p) => ({
      name: p.label,
      categories: Object.values(p.categories).map((c) => ({
        name: c.label,
        fileCount: c.files.length,
        files: c.files,
      })),
    })),
  }))
}

export function getComplianceAuditSummary(tenantId) {
  const allFiles = db.select().from(files).where(eq(files.tenantId, tenantId)).all()
  const uploads = allFiles.length
  const byCategory = {}
  for (const f of allFiles) {
    byCategory[f.category] = (byCategory[f.category] || 0) + 1
  }

  const activity = listActivity({ tenantId, limit: 500 })
  const approvals = activity.filter((a) => a.action.startsWith('workflow.')).length
  const disbursements = activity.filter((a) => a.action === 'finance.disbursement.record').length

  const projects = db.select().from(csrProjects).where(eq(csrProjects.corporateTenantId, tenantId)).all()
  const missingEvidence = projects.filter((p) => {
    const evidence = allFiles.filter((f) => f.entityType === 'project' && f.entityId === p.id && f.category === 'project_evidence')
    return p.status === 'active' && evidence.length === 0
  }).map((p) => ({ id: p.id, name: p.name }))

  const missingCompliance = projects.filter((p) => {
    const ucs = allFiles.filter((f) => f.entityType === 'project' && f.entityId === p.id && f.category === 'compliance')
    return p.status === 'active' && ucs.length === 0
  }).map((p) => ({ id: p.id, name: p.name }))

  return {
    uploads,
    byCategory,
    approvals,
    disbursements,
    missingEvidence,
    missingCompliance,
  }
}

function collectFilesForExport(tenantId, { projectId, fiscalYear } = {}) {
  const conditions = [eq(files.tenantId, tenantId)]
  if (fiscalYear) conditions.push(eq(files.fiscalYear, fiscalYear))
  if (projectId) conditions.push(and(eq(files.entityType, 'project'), eq(files.entityId, projectId)))

  let query = db.select().from(files)
  if (conditions.length === 1) query = query.where(conditions[0])
  else query = query.where(and(...conditions))
  return query.all()
}

export async function buildAuditPackage(tenantId, scope = {}, req) {
  const fileRows = collectFilesForExport(tenantId, scope)
  const activity = getAuditTrail(tenantId, {
    ...scope,
    limit: 500,
    dateFrom: scope.dateFrom,
    dateTo: scope.dateTo,
  })

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-export-'))
  const storage = getStorage()

  const manifest = {
    exportedAt: new Date().toISOString(),
    tenantId,
    scope,
    fileCount: fileRows.length,
    activityCount: activity.length,
    files: [],
  }

  for (const f of fileRows) {
    const relPath = f.auditPath || `${f.fiscalYear || 'General'}/${f.originalName}`
    const destPath = path.join(tmpDir, 'documents', relPath)
    fs.mkdirSync(path.dirname(destPath), { recursive: true })
    try {
      const src = storage.resolvePath(f.storageKey)
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, destPath)
      }
    } catch {
      /* skip missing blobs */
    }
    manifest.files.push({
      id: f.id,
      auditPath: relPath,
      checksum: f.checksum,
      category: f.category,
      version: f.version,
    })
  }

  fs.writeFileSync(path.join(tmpDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
  fs.writeFileSync(path.join(tmpDir, 'activity-export.json'), JSON.stringify(activity, null, 2))

  const zipPath = path.join(tmpDir, 'audit-package.zip')
  const isWin = process.platform === 'win32'
  if (isWin) {
    execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${path.join(tmpDir, 'documents')}', '${path.join(tmpDir, 'manifest.json')}', '${path.join(tmpDir, 'activity-export.json')}' -DestinationPath '${zipPath}' -Force"`, { stdio: 'pipe' })
  } else {
    execSync(`cd "${tmpDir}" && zip -r audit-package.zip documents manifest.json activity-export.json`, { stdio: 'pipe' })
  }

  const buffer = fs.readFileSync(zipPath)
  fs.rmSync(tmpDir, { recursive: true, force: true })
  return { buffer, fileName: `audit-package-${Date.now()}.zip` }
}

export function testImmutabilityTrigger() {
  const row = db.select().from(activityLogs).limit(1).get()
  if (!row) return { blocked: false, reason: 'no rows to test' }
  try {
    db.delete(activityLogs).where(eq(activityLogs.id, row.id)).run()
    return { blocked: false }
  } catch (err) {
    return { blocked: true, message: err.message }
  }
}
