import Database from 'better-sqlite3'
import { Pool } from 'pg'
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3'
import { drizzle as drizzlePg } from 'drizzle-orm/pg'
import { migrate as migrateSqlite } from 'drizzle-orm/better-sqlite3/migrator'
import { migrate as migratePg } from 'drizzle-orm/pg/migrator'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const migrationsFolder = path.resolve(__dirname, '../../drizzle')

const dialect = process.env.DB_DIALECT || 'sqlite'

let dbCounter = 0

export async function createTestDb() {
  dbCounter++
  if (dialect === 'pg') {
    const schema = await import('../db/schema-pg.js')
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sustainalign_test',
    })
    const db = drizzlePg(pool, { schema })
    if (fs.existsSync(migrationsFolder)) {
      await migratePg(db, { migrationsFolder })
    }
    return { sqlite: null, db, pool, schema }
  } else {
    const schema = await import('../db/schema.js')
    const sqlite = new Database(':memory:')
    sqlite.pragma('journal_mode = WAL')
    sqlite.pragma('foreign_keys = ON')
    const db = drizzleSqlite(sqlite, { schema })
    if (fs.existsSync(migrationsFolder)) {
      migrateSqlite(db, { migrationsFolder })
    }
    return { sqlite, db, pool: null, schema }
  }
}
