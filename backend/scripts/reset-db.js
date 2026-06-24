#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import 'dotenv/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const backendRoot = path.resolve(__dirname, '..')
const dbPath = path.resolve(backendRoot, process.env.DATABASE_PATH || './data/sustainalign.db')

console.log('\n=== Resetting SustainAlign database ===\n')

for (const suffix of ['', '-wal', '-shm']) {
  const target = suffix ? `${dbPath}${suffix}` : dbPath
  if (fs.existsSync(target)) {
    fs.unlinkSync(target)
    console.log(`  deleted ${target}`)
  }
}

console.log('\n=== Running migrations ===\n')
execSync('npx drizzle-kit migrate', { stdio: 'inherit', cwd: backendRoot })

console.log('\n=== Seeding fresh demo data ===\n')
const { runSeed } = await import('../src/db/seed.js')
await runSeed({ fresh: true })

console.log('\n=== Database reset complete ===\n')
