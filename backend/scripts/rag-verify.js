#!/usr/bin/env node
import { eq } from 'drizzle-orm'
import { db } from '../src/db/index.js'
import { users, memberships, vectorDocuments } from '../src/db/schema.js'
import {
  reindexAllVectors,
  semanticSearch,
  ragRecommendNgos,
} from '../src/services/ai/rag.js'

const errors = []

function check(label, ok, detail) {
  if (ok) console.log(`  ✓ ${label}`)
  else {
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
    errors.push(label)
  }
}

console.log('\n=== AI CSR Copilot RAG verification ===\n')

const acmeUser = db.select().from(users).where(eq(users.email, 'admin@acme.com')).get()
const acmeMem = acmeUser
  ? db.select().from(memberships).where(eq(memberships.userId, acmeUser.id)).get()
  : null

check('Corporate tenant', !!acmeMem?.tenantId)
if (!acmeMem?.tenantId) {
  console.log('\nFAILED: no tenant\n')
  process.exit(1)
}

const tenantId = acmeMem.tenantId

const reindex = await reindexAllVectors()
check('Vector reindex', reindex.chunksIndexed >= 1, `chunks=${reindex.chunksIndexed}`)

const vectorRows = db.select().from(vectorDocuments).all()
check('Vector documents in DB', vectorRows.length >= 1, `count=${vectorRows.length}`)

const semantic = await semanticSearch('healthcare Karnataka', { limit: 5 })
check('Semantic search results', semantic.length >= 1, `hits=${semantic.length}`)

const rag = await ragRecommendNgos(tenantId, 'Suggest NGOs for healthcare in Karnataka')
check('RAG recommend reply', !!rag.reply && rag.reply.length > 5)
check('RAG recommendations', rag.recommendations?.length >= 1, `count=${rag.recommendations?.length}`)
check('RAG citations shape', Array.isArray(rag.citations))

console.log('')
if (errors.length) {
  console.log(`FAILED: ${errors.length} check(s)\n`)
  process.exit(1)
}
console.log('All RAG checks passed.\n')
