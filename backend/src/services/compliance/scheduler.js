import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { tenants } from '../../db/schema.js'
import { syncComplianceForTenant } from './index.js'

export function syncAllCorporateTenants() {
  const corporateTenants = db.select().from(tenants).where(eq(tenants.type, 'corporate')).all()
  let synced = 0
  for (const t of corporateTenants) {
    try {
      syncComplianceForTenant(t.id)
      synced += 1
    } catch (err) {
      console.error(`[compliance-sync] failed for ${t.id}:`, err.message)
    }
  }
  return { synced, total: corporateTenants.length }
}

export function startComplianceScheduler(intervalMinutes = 60) {
  const ms = Math.max(1, intervalMinutes) * 60 * 1000
  console.log(`[compliance-sync] scheduler every ${intervalMinutes} min`)
  syncAllCorporateTenants()
  return setInterval(() => {
    const result = syncAllCorporateTenants()
    console.log(`[compliance-sync] synced ${result.synced}/${result.total} tenants`)
  }, ms)
}
