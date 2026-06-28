import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { users, memberships, reports } from '../../db/schema.js'

export async function seedReports() {
  const acmeUser = await db.select().from(users).where(eq(users.email, 'admin@acme.com')).get()
  const acmeMem = acmeUser ? await db.select().from(memberships).where(eq(memberships.userId, acmeUser.id)).get() : null
  if (!acmeMem) return

  const existing = await db.select().from(reports).where(eq(reports.corporateTenantId, acmeMem.tenantId)).get()
  if (existing) {
    console.log('  reports skip (already seeded)')
    return
  }

  const { generateReport } = await import('../reports/index.js')
  await generateReport({
    corporateTenantId: acmeMem.tenantId,
    userId: acmeUser.id,
    type: 'sdg',
    periodStart: '2025-04-01',
    periodEnd: '2026-03-31',
    req: null,
  })
  console.log('  reports 1 demo SDG report')
}
