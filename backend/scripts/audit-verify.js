#!/usr/bin/env node
import { eq } from 'drizzle-orm'
import { db } from '../src/db/index.js'
import { users, memberships, activityLogs } from '../src/db/schema.js'
import { storeFile, logFileDownload, deriveAuditPath, deriveFiscalYear } from '../src/services/files/index.js'
import { getAuditFolderTree, buildAuditPackage, testImmutabilityTrigger } from '../src/services/audit/index.js'
import { updateProjectSpent } from '../src/services/projects/index.js'
import { listActivity } from '../src/services/activity-log/index.js'

const errors = []

function check(label, ok, detail) {
  if (ok) console.log(`  ✓ ${label}`)
  else {
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
    errors.push(label)
  }
}

console.log('\n=== Audit & Transparency verification ===\n')

const acmeUser = db.select().from(users).where(eq(users.email, 'admin@acme.com')).get()
const acmeMem = acmeUser
  ? db.select().from(memberships).where(eq(memberships.userId, acmeUser.id)).get()
  : null

check('Corporate tenant', !!acmeMem?.tenantId)

const mockReq = { user: { sub: acmeUser?.id, tenantId: acmeMem?.tenantId, role: 'csr_head' }, headers: { 'user-agent': 'audit-verify' } }

try {
  const buffer = Buffer.from('audit verify test content')
  const stored = await storeFile({
    req: mockReq,
    buffer,
    tenantId: acmeMem.tenantId,
    tenantType: 'corporate',
    uploadedBy: acmeUser.id,
    category: 'invoice',
    originalName: 'verify-invoice.pdf',
    mime: 'application/pdf',
    entityType: 'project',
    entityId: 'proj-001',
  })

  check('Upload has checksum', !!stored.checksum)
  check('Upload has auditPath', !!stored.auditPath)
  check('Upload has fiscalYear', !!stored.fiscalYear)
  check('deriveAuditPath', deriveAuditPath({ category: 'invoice', entityType: 'project', entityId: 'proj-001', originalName: 'test.pdf', fiscalYear: deriveFiscalYear() }).includes('Invoices'))

  await logFileDownload(stored.id, mockReq)
  const downloadLog = listActivity({ tenantId: acmeMem.tenantId, action: 'file.download', limit: 5 })
  check('Download logged', downloadLog.some((a) => a.entityId === stored.id))

  updateProjectSpent('proj-001', 3300000, { corporateTenantId: acmeMem.tenantId, req: mockReq })
  const disburseLog = listActivity({ tenantId: acmeMem.tenantId, limit: 20 })
    .find((a) => a.action === 'finance.disbursement.record')
  check('Disbursement logged with before', disburseLog?.previousValue != null)

  const immut = testImmutabilityTrigger()
  check('Immutability trigger blocks delete', immut.blocked === true)

  const tree = getAuditFolderTree(acmeMem.tenantId)
  check('Folder tree non-empty', tree.length > 0)

  const pkg = await buildAuditPackage(acmeMem.tenantId, { projectId: 'proj-001' }, mockReq)
  check('Export produces ZIP', pkg.buffer?.length > 100 && pkg.fileName.endsWith('.zip'))
} catch (err) {
  check('Audit round-trip', false, err.message)
}

if (errors.length) {
  console.log(`\nFAILED: ${errors.length} check(s)\n`)
  process.exit(1)
}

console.log('\nAll audit checks passed.\n')
