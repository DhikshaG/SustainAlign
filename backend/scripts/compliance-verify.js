#!/usr/bin/env node
import { eq } from 'drizzle-orm'
import { db } from '../src/db/index.js'
import { users, memberships, corporateCsrProfile } from '../src/db/schema.js'
import { getComplianceSummary, getFundAllocation } from '../src/services/compliance/index.js'

const errors = []

function check(label, ok, detail) {
  if (ok) console.log(`  ✓ ${label}`)
  else {
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
    errors.push(label)
  }
}

console.log('\n=== Compliance Engine verification ===\n')

const acmeUser = db.select().from(users).where(eq(users.email, 'admin@acme.com')).get()
const acmeMem = acmeUser
  ? db.select().from(memberships).where(eq(memberships.userId, acmeUser.id)).get()
  : null

check('Corporate tenant', !!acmeMem?.tenantId)

const profile = db.select().from(corporateCsrProfile)
  .where(eq(corporateCsrProfile.tenantId, acmeMem.tenantId))
  .get()
check('CSR profile seeded', !!profile)

const summary = getComplianceSummary(acmeMem.tenantId)
check('2% obligation computed', summary.section135.csrObligation > 0, `₹${summary.section135.csrObligation}`)
check('Section 135 criteria', !!summary.section135.criteria)
check('Obligation breakdown', !!summary.section135.obligationBreakdown?.formula)
check('Spend breakdown', summary.spend.breakdown.length >= 1)
check('Schedule VII validation', summary.scheduleVIIValidation.length >= 4)
check('Compliance alerts', Array.isArray(summary.alerts))
check('MCA preview', !!summary.mcaReportPreview.companyName)

const { exportMcaCsr2 } = await import('../src/services/compliance/index.js')
const mcaJson = exportMcaCsr2(acmeMem.tenantId)
check('MCA JSON export', mcaJson.form === 'MCA CSR-2' && mcaJson.projects.length >= 1)

const funds = getFundAllocation(acmeMem.tenantId)
check('Fund allocation projects', funds.projects.length >= 1)
check('Fund obligation', funds.obligation > 0)

console.log('')
if (errors.length) {
  console.log(`FAILED: ${errors.length} check(s)\n`)
  process.exit(1)
}
console.log('All compliance checks passed.\n')
