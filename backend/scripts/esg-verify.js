#!/usr/bin/env node
import { eq } from 'drizzle-orm'
import { db } from '../src/db/index.js'
import { users, memberships } from '../src/db/schema.js'
import {
  getUnifiedEsgDashboard,
  buildEsgContext,
  computePillarScores,
  buildBrsrCoverage,
} from '../src/services/esg/index.js'
import { rollupCatalogKpis } from '../src/services/esg/kpi-engine.js'
import { mapProject, BRSR_PRINCIPLES } from '../src/services/esg/taxonomy.js'

const errors = []

function check(label, ok, detail) {
  if (ok) console.log(`  ✓ ${label}`)
  else {
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
    errors.push(label)
  }
}

console.log('\n=== ESG + CSR Unified Dashboard verification ===\n')

const acmeUser = db.select().from(users).where(eq(users.email, 'admin@acme.com')).get()
const acmeMem = acmeUser
  ? db.select().from(memberships).where(eq(memberships.userId, acmeUser.id)).get()
  : null

check('Corporate tenant', !!acmeMem?.tenantId)

const ctx = buildEsgContext(acmeMem.tenantId)
check('ESG context projects', ctx.projects.length >= 1)

const pillars = computePillarScores(ctx)
check('Environmental score 0-100', pillars.environmental.score >= 0 && pillars.environmental.score <= 100)
check('Social score 0-100', pillars.social.score >= 0 && pillars.social.score <= 100)
check('Governance score 0-100', pillars.governance.score >= 0 && pillars.governance.score <= 100)

const brsr = buildBrsrCoverage(ctx)
check('BRSR 9 principles', brsr.length === BRSR_PRINCIPLES.length)
check('BRSR partial coverage', brsr.some((b) => b.coverage > 0))

const catalog = rollupCatalogKpis(acmeMem.tenantId)
check('KPI catalog rollup', Object.keys(catalog).length >= 1, `keys=${Object.keys(catalog).join(',')}`)

if (ctx.projects[0]) {
  const mapped = mapProject(ctx.projects[0])
  check('Project mapping pillar+sdg', !!mapped.pillar && (mapped.sdg != null || mapped.theme === 'Other'))
}

const unified = getUnifiedEsgDashboard(acmeMem.tenantId)
check('Unified DTO shape', !!unified.pillars && Array.isArray(unified.sdgAlignment))
check('Project mappings', unified.projectMappings.length >= 1)
check('CSR summary', unified.csrSummary.obligation >= 0)
check('UpdatedAt present', !!unified.updatedAt)

console.log('')
if (errors.length) {
  console.log(`FAILED: ${errors.length} check(s)\n`)
  process.exit(1)
}
console.log('All ESG checks passed.\n')
