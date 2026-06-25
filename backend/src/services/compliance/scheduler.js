import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { tenants } from '../../db/schema.js'
import { logger } from '../../lib/logger.js'
import { syncComplianceForTenant } from './index.js'

export function syncAllCorporateTenants() {
  const corporateTenants = db.select().from(tenants).where(eq(tenants.type, 'corporate')).all()
  let synced = 0
  for (const t of corporateTenants) {
    try {
      syncComplianceForTenant(t.id)
      synced += 1
    } catch (err) {
      logger.error({ tenantId: t.id, err }, 'compliance sync failed')
    }
  }
  return { synced, total: corporateTenants.length }
}

export function startComplianceScheduler(intervalMinutes = 60) {
  const ms = Math.max(1, intervalMinutes) * 60 * 1000
  logger.info({ intervalMinutes }, 'compliance scheduler started')
  syncAllCorporateTenants()
  return setInterval(() => {
    const result = syncAllCorporateTenants()
    logger.info({ synced: result.synced, total: result.total }, 'compliance sync tick')
  }, ms)
}

export function stopComplianceScheduler(handle) {
  if (handle) clearInterval(handle)
}
