#!/usr/bin/env node
import { eq } from 'drizzle-orm'
import { db } from '../src/db/index.js'
import { users, memberships, reports, files } from '../src/db/schema.js'
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
  const period = { periodStart: '2025-04-01', periodEnd: '2026-03-31' }

  for (const format of ['pdf', 'docx', 'pptx']) {
    try {
      const report = await generateReport({
        corporateTenantId: acmeMem.tenantId,
        userId: acmeUser.id,
        type: 'quarterly',
        format,
        includeAi: false,
        ...period,
        req: null,
      })
      check(`Generate quarterly ${format.toUpperCase()}`, !!report.fileId && report.status === 'generated')
      check(`${format} download URL`, !!report.downloadUrl)

      const file = report.fileId
        ? db.select().from(files).where(eq(files.id, report.fileId)).get()
        : null
      check(`${format} mime type`, !!file?.mime, file?.mime)
    } catch (err) {
      check(`Generate quarterly ${format.toUpperCase()}`, false, err.message)
    }
  }

  try {
    const executive = await generateReport({
      corporateTenantId: acmeMem.tenantId,
      userId: acmeUser.id,
      type: 'executive',
      format: 'pdf',
      includeAi: false,
      ...period,
      req: null,
    })
    check('Generate executive PDF', !!executive.fileId)
  } catch (err) {
    check('Generate executive PDF', false, err.message)
  }

  const all = listReports(acmeMem.tenantId)
  check('Report persisted', all.length >= 1, `count=${all.length}`)
  check('Report format in list', all.some((r) => r.format), `formats=${all.map((r) => r.format).join(',')}`)

  const row = db.select().from(reports).where(eq(reports.id, all[0]?.id)).get()
  check('Report has title', !!row?.title)

  console.log('')
  if (errors.length) {
    console.log(`FAILED: ${errors.length} check(s)\n`)
    process.exit(1)
  }
  console.log('All report checks passed.\n')
})()
