#!/usr/bin/env node
import { eq } from 'drizzle-orm'
import { db } from '../src/db/index.js'
import { users, memberships, projectKpis, projectBeneficiaryLogs } from '../src/db/schema.js'
import {
  aggregateForTenant,
  getLatestBeneficiaries,
  addBeneficiaryLog,
} from '../src/services/impact/index.js'
import { getDashboardSummary, getReportingOverview } from '../src/services/dashboard/index.js'
import { getProject } from '../src/services/projects/index.js'

const errors = []

function check(label, ok, detail) {
  if (ok) console.log(`  ✓ ${label}`)
  else {
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
    errors.push(label)
  }
}

console.log('\n=== Impact Tracking verification ===\n')

const acmeUser = db.select().from(users).where(eq(users.email, 'admin@acme.com')).get()
const acmeMem = acmeUser
  ? db.select().from(memberships).where(eq(memberships.userId, acmeUser.id)).get()
  : null

check('Seeded corporate tenant', !!acmeMem?.tenantId)

const kpis = db.select().from(projectKpis).all()
check('Project KPIs seeded', kpis.length >= 3, `found ${kpis.length}`)

const benLogs = db.select().from(projectBeneficiaryLogs).all()
check('Beneficiary logs seeded', benLogs.length >= 3, `found ${benLogs.length}`)

const proj001Ben = getLatestBeneficiaries('proj-001')
check('proj-001 beneficiaries', proj001Ben.direct > 0, `direct=${proj001Ben.direct}`)

const detail = getProject('proj-001', { corporateTenantId: acmeMem?.tenantId })
check('Project detail includes KPIs', detail?.kpis?.length >= 1)
check('Project detail includes geo', detail?.geoUpdates?.length >= 1)

const aggregate = aggregateForTenant(acmeMem.tenantId)
check('Aggregate total beneficiaries', aggregate.impactSummary.totalBeneficiaries > 0)
check('Aggregate SDG mapping', aggregate.sdgMapping.length >= 1)
check('Aggregate geo analytics', aggregate.geoAnalytics.length >= 1)

const dashboard = getDashboardSummary(acmeMem.tenantId)
check('Dashboard summary budget', dashboard.budget?.spent > 0)
check('Dashboard active projects', dashboard.activeProjects?.count >= 1)

const reporting = getReportingOverview(acmeMem.tenantId)
check('Reporting overview', reporting.impactSummary?.projectsActive >= 1)

try {
  const before = getLatestBeneficiaries('proj-003').direct
  addBeneficiaryLog('proj-003', { directCount: before + 100, indirectCount: 0, note: 'verify' }, {
    corporateTenantId: acmeMem.tenantId,
    userId: acmeUser.id,
  })
  const after = getLatestBeneficiaries('proj-003').direct
  check('Add beneficiary log', after === before + 100)
} catch (err) {
  check('Add beneficiary log', false, err.message)
}

console.log('')
if (errors.length) {
  console.log(`FAILED: ${errors.length} check(s)\n`)
  process.exit(1)
}
console.log('All impact checks passed.\n')
