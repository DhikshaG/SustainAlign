/**
 * Postgres dialect compatibility layer for Drizzle ORM.
 *
 * The better-sqlite3 dialect exposes `.get()` and `.run()` on query builders.
 * The node-postgres dialect does not — queries execute via `await qb`.
 * This module wraps a Postgres Drizzle instance so that `.get()` and `.run()`
 * work identically to the SQLite dialect, enabling dual-dialect code.
 */

export function enhanceDbForPg(db) {
  function enhanceQueryBuilder(qb) {
    return new Proxy(qb, {
      get(target, prop) {
        if (prop === 'then' || prop === 'catch' || prop === 'finally') {
          return target[prop]
        }
        if (prop === 'get') {
          return async function () {
            const rows = await target
            return Array.isArray(rows) && rows.length > 0 ? rows[0] : null
          }
        }
        if (prop === 'run') {
          return async function () {
            await target
          }
        }
        const value = target[prop]
        if (typeof value === 'function') {
          return (...args) => enhanceQueryBuilder(value.apply(target, args))
        }
        return value
      },
    })
  }

  return new Proxy(db, {
    get(target, prop) {
      if (typeof prop === 'symbol') return target[prop]
      if (['select', 'insert', 'update', 'delete'].includes(prop)) {
        return (...args) => enhanceQueryBuilder(target[prop](...args))
      }
      return target[prop]
    },
  })
}
