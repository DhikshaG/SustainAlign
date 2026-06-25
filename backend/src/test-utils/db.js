import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import * as schema from '../db/schema.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const migrationsFolder = path.resolve(__dirname, '../../drizzle')

let dbCounter = 0

export function createTestDb() {
  dbCounter++
  const sqlite = new Database(':memory:')
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  const db = drizzle(sqlite, { schema })
  if (fs.existsSync(migrationsFolder)) {
    migrate(db, { migrationsFolder })
  }
  return { sqlite, db, schema }
}
