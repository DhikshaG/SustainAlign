import Database from 'better-sqlite3'
import { Pool } from 'pg'
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3'
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres'
import { migrate as migrateSqlite } from 'drizzle-orm/better-sqlite3/migrator'
import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { env } from '../config/env.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const migrationsFolder = path.resolve(__dirname, '../../drizzle' + (env.DB_DIALECT === 'pg' ? '-pg' : ''))

let db
let sqlite = null
let pool = null

if (env.DB_DIALECT === 'pg') {
  const schema = await import('./schema-pg.js')
  pool = new Pool({ connectionString: env.DATABASE_URL })
  db = drizzlePg(pool, { schema: schema })

  if (fs.existsSync(migrationsFolder)) {
    await migratePg(db, { migrationsFolder })
  }
} else {
  const schema = await import('./schema.js')
  const dbPath = path.resolve(env.DATABASE_PATH)
  const dbDir = path.dirname(dbPath)

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  db = drizzleSqlite(sqlite, { schema })

  if (fs.existsSync(migrationsFolder)) {
    migrateSqlite(db, { migrationsFolder })
  }
}

export { db, sqlite, pool }

export async function closeDb() {
  if (sqlite) {
    sqlite.close()
  }
  if (pool) {
    await pool.end()
  }
}
