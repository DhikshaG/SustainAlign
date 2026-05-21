#!/usr/bin/env node
import { eq } from 'drizzle-orm'
import { db } from '../src/db/index.js'
import { users, memberships } from '../src/db/schema.js'
import { runNgoMatch, deriveDefaultsFromProjects } from '../src/services/matching/index.js'

const errors = []

function check(label, ok, detail) {
  if (ok) console.log(`  ✓ ${label}`)
  else {
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
    errors.push(label)
  }
}

console.log('\n=== NGO Matching Engine verification ===\n')

const acmeUser = db.select().from(users).where(eq(users.email, 'admin@acme.com')).get()
const acmeMem = acmeUser
  ? db.select().from(memberships).where(eq(memberships.userId, acmeUser.id)).get()
  : null

check('Corporate tenant', !!acmeMem?.tenantId)

const defaults = deriveDefaultsFromProjects(acmeMem.tenantId)
check('Match defaults derived', typeof defaults === 'object')

const result = await runNgoMatch(acmeMem.tenantId, {
  csrFocus: 'environment and afforestation programs in Maharashtra',
  keywords: 'climate trees forest',
  state: 'Maharashtra',
  sdg: '13',
  theme: 'environment',
  budgetRange: '10L-25L',
})

check('Matches returned', result.matches?.length >= 1, `count=${result.matches?.length}`)
check('Criteria echoed', !!result.criteria?.csrFocus)

const first = result.matches[0]
check('matchPercent present', typeof first?.matchPercent === 'number', `value=${first?.matchPercent}`)
check('credibilityScore present', typeof first?.credibilityScore === 'number')
check('riskScore present', typeof first?.riskScore === 'number')
check('scoreBreakdown present', !!first?.scoreBreakdown?.similarity)
check('reason present', !!first?.reason)

const sorted = [...result.matches].every((m, i, arr) => i === 0 || arr[i - 1].matchPercent >= m.matchPercent)
check('Sorted by matchPercent desc', sorted)

if (result.offline) {
  console.log('  ℹ Ollama offline — deterministic scoring verified')
} else {
  console.log('  ℹ Ollama online — LLM overlay applied')
}

console.log('')
if (errors.length) {
  console.log(`FAILED: ${errors.length} check(s)\n`)
  process.exit(1)
}
console.log('All matching checks passed.\n')
