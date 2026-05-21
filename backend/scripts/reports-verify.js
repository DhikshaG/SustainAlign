#!/usr/bin/env node
import { eq } from 'drizzle-orm'
import { db } from '../src/db/index.js'
import { users, memberships, reports } from '../src/db/schema.js'
import { listReports, generateReport } from '../src/services/reports/index.js'

const errors = []

function check(label, ok, detail) {
  if (ok) console.log(`  ✓ ${label}`)
  else {
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
    errors.push(label)
  }
}

console.log('\n=== Report Generation verification ===\n')

const acmeUser = db.select().from(users).where(eq(users.email, 'admin@acme.com')).get()
const acmeMem = acmeUser
  ? db.select().from(memberships).where(eq(memberships.userId, acmeUser.id)).get()
  : null

check('Corporate tenant', !!acmeMem?.tenantId)

const existing = listReports(acmeMem.tenantId)
check('Reports list API', Array.isArray(existing))

;(async () => {
  try {
    const report = await generateReport({
      corporateTenantId: acmeMem.tenantId,
      userId: acmeUser.id,
      type: 'quarterly',
      periodStart: '2025-04-01',
      periodEnd: '2026-03-31',
      req: null,
    })
    check('Generate quarterly PDF', !!report.fileId && report.status === 'generated')
    check('Download URL present', !!report.downloadUrl)

    const all = listReports(acmeMem.tenantId)
    check('Report persisted', all.length >= 1, `count=${all.length}`)

    const row = db.select().from(reports).where(eq(reports.id, report.id)).get()
    check('Report has title', !!row?.title)
  } catch (err) {
    check('Generate quarterly PDF', false, err.message)
  }

  console.log('')
  if (errors.length) {
    console.log(`FAILED: ${errors.length} check(s)\n`)
    process.exit(1)
  }
  console.log('All report checks passed.\n')
})()
