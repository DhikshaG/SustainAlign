import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import * as schema from './schema.js'
import { env } from '../config/env.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.resolve(env.DATABASE_PATH)
const dbDir = path.dirname(dbPath)

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const sqlite = new Database(dbPath)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })

export { sqlite }

const migrationsFolder = path.resolve(__dirname, '../../drizzle')
if (fs.existsSync(migrationsFolder)) {
  migrate(db, { migrationsFolder })
}

export function closeDb() {
  sqlite.close()
}
