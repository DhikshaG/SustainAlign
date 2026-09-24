import { Pool } from 'pg'

/**
 * Ensure a PostgreSQL database exists.
 * Connects to the default 'postgres' database to CREATE DATABASE IF NOT EXISTS,
 * then closes the admin connection. Safe to call repeatedly (idempotent).
 */
export async function ensurePgDatabaseExists(connectionString) {
  const targetUrl = new URL(connectionString)
  const dbName = targetUrl.pathname.slice(1) // strip leading '/'

  // Build a connection URL to the default 'postgres' database
  const adminUrl = new URL(connectionString)
  adminUrl.pathname = '/postgres'

  const adminPool = new Pool({ connectionString: adminUrl.toString() })
  try {
    const { rows } = await adminPool.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName])
    if (rows.length === 0) {
      // Database name must be identifier-safe; reject anything with quotes/dots
      if (!/^[a-zA-Z0-9_]+$/.test(dbName)) {
        throw new Error(`Invalid database name: ${dbName}`)
      }
      await adminPool.query(`CREATE DATABASE "${dbName}"`)
    }
  } finally {
    await adminPool.end()
  }
}
