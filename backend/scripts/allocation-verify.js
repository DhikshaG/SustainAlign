#!/usr/bin/env node
import { eq } from 'drizzle-orm'
import { db } from '../src/db/index.js'
import { users, memberships } from '../src/db/schema.js'
import {
  buildAllocationContext,
  scoreDistrictNeeds,
  recommendThemeSplit,
  runAllocationIntelligence,
} from '../src/services/allocation/index.js'
import { scoreDistrictFit } from '../src/services/matching/scoring.js'

const errors = []

function check(label, ok, detail) {
  if (ok) console.log(`  ✓ ${label}`)
  else {
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
    errors.push(label)
  }
}

console.log('\n=== Fund Allocation Intelligence verification ===\n')

const acmeUser = db.select().from(users).where(eq(users.email, 'admin@acme.com')).get()
const acmeMem = acmeUser
  ? db.select().from(memberships).where(eq(memberships.userId, acmeUser.id)).get()
  : null

check('Corporate tenant', !!acmeMem?.tenantId)

const ctx = buildAllocationContext(acmeMem.tenantId)
check('Allocation context', ctx.obligation > 0)
check('Unallocated computed', typeof ctx.unallocated === 'number')

const districts = scoreDistrictNeeds(ctx)
check('District needs ranked', districts.length >= 1 && districts[0].rank === 1)
check('District priority labels', districts.every((d) => ['high', 'medium', 'low'].includes(d.priority)))

const budget = ctx.unallocated || 1_000_000
const themes = recommendThemeSplit(ctx, { budgetToAllocate: budget, scenario: 'balanced' })
const themeSum = themes.reduce((s, t) => s + t.recommended, 0)
check('Theme split sums to budget', Math.abs(themeSum - budget) <= themes.length + 100, `sum=${themeSum} budget=${budget}`)

check('District fit scoring', scoreDistrictFit('Pune', { districtsServed: ['Pune, Maharashtra'] }) === 100)

;(async () => {
  try {
    const intel = await runAllocationIntelligence(acmeMem.tenantId, {
      includeAi: false,
      limit: 5,
    })
    check('Intelligence DTO', !!intel.input && Array.isArray(intel.themeSplit))
    check('Intelligence districts', intel.districts.length >= 1)
    check('Intelligence NGOs', Array.isArray(intel.ngos))
    check('NGO match fields', intel.ngos.length === 0 || intel.ngos[0].matchPercent != null)
  } catch (err) {
    check('Intelligence DTO', false, err.message)
  }

  console.log('')
  if (errors.length) {
    console.log(`FAILED: ${errors.length} check(s)\n`)
    process.exit(1)
  }
  console.log('All allocation checks passed.\n')
})()
