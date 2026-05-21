#!/usr/bin/env node
import { eq } from 'drizzle-orm'
import { db } from '../src/db/index.js'
import { users, memberships } from '../src/db/schema.js'
import { getCopilotSuggestions, copilotChat, matchNgos } from '../src/services/ai/context.js'
import { checkOllamaHealth, isOllamaModelAvailable } from '../src/services/ai/ollama.js'

const errors = []

function check(label, ok, detail) {
  if (ok) console.log(`  ✓ ${label}`)
  else {
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
    errors.push(label)
  }
}

console.log('\n=== AI Layer verification ===\n')

const acmeUser = db.select().from(users).where(eq(users.email, 'admin@acme.com')).get()
const acmeMem = acmeUser
  ? db.select().from(memberships).where(eq(memberships.userId, acmeUser.id)).get()
  : null

check('Corporate tenant', !!acmeMem?.tenantId)

const suggestions = getCopilotSuggestions(acmeMem.tenantId)
check('Copilot suggestions', suggestions.length >= 2, `count=${suggestions.length}`)

const ollamaOnline = await checkOllamaHealth()
const modelReady = ollamaOnline && (await isOllamaModelAvailable())
if (modelReady) {
  console.log('  ℹ Ollama online with model — running LLM smoke tests')
  const chat = await copilotChat(acmeMem.tenantId, 'How many active projects do we have?', [])
  check('Copilot chat reply', !!chat.reply && chat.reply.length > 5)

  const match = await matchNgos(acmeMem.tenantId, { goals: 'environment and afforestation in Maharashtra' })
  check('NGO match results', match.matches?.length >= 1)
} else {
  const hint = ollamaOnline
    ? 'model missing — run: ollama pull llama3.1:1b'
    : 'start: ollama pull llama3.1:1b && ollama serve'
  console.log(`  ℹ Ollama not ready — skipping LLM calls (${hint})`)
  const chat = await copilotChat(acmeMem.tenantId, 'test', [])
  check('Copilot graceful offline', chat.offline === true)

  const match = await matchNgos(acmeMem.tenantId, {
    csrFocus: 'environment and afforestation in Maharashtra',
    state: 'Maharashtra',
    sdg: '15',
  })
  check('NGO match offline scoring', match.matches?.length >= 1 && typeof match.matches[0].matchPercent === 'number')
}

console.log('')
if (errors.length) {
  console.log(`FAILED: ${errors.length} check(s)\n`)
  process.exit(1)
}
console.log('All AI checks passed.\n')
