import { eq } from 'drizzle-orm'
import { newId } from '../lib/ids.js'

export async function seedUser(db, schema, overrides = {}) {
  const id = overrides.id || newId()
  const tenantId = overrides.tenantId || 'test-corp-tenant'
  const now = new Date()
  const user = {
    id,
    email: overrides.email || 'test@example.com',
    passwordHash: overrides.passwordHash || 'argon2-hash-placeholder',
    fullName: overrides.fullName || 'Test User',
    tenantType: overrides.tenantType || 'corporate',
    mfaEnabled: 0,
    createdAt: now,
    updatedAt: now,
  }
  await db.insert(schema.users).values(user).run()
  return await db.select().from(schema.users).where(eq(schema.users.id, id)).get()
}

export async function seedTenant(db, schema, overrides = {}) {
  const id = overrides.id || overrides.tenantId || 'test-corp-tenant'
  const now = new Date()
  const tenant = {
    id,
    type: overrides.type || 'corporate',
    name: overrides.name || 'Test Corp',
    slug: overrides.slug || 'test-corp',
    createdAt: now,
  }
  await db.insert(schema.tenants).values(tenant).run()
  return await db.select().from(schema.tenants).where(eq(schema.tenants.id, id)).get()
}

export async function seedMembership(db, schema, overrides = {}) {
  const id = overrides.id || newId()
  const now = new Date()
  const membership = {
    id,
    userId: overrides.userId || 'test-user-id',
    tenantId: overrides.tenantId || 'test-corp-tenant',
    role: overrides.role || 'super_admin',
    status: 'active',
    createdAt: now,
  }
  await db.insert(schema.memberships).values(membership).run()
  return membership
}

export function seedCorporateWithUser(db, schema, overrides = {}) {
  const tenantId = overrides.tenantId || 'test-corp-tenant'
  const userId = overrides.userId || 'test-user-id'
  seedTenant(db, schema, { id: tenantId, type: 'corporate', name: 'Test Corp', slug: 'test-corp', ...overrides })
  seedUser(db, schema, { id: userId, tenantId, email: 'admin@testcorp.com', ...overrides })
  seedMembership(db, schema, { userId, tenantId, role: 'super_admin', ...overrides })
}

export function seedNgoWithUser(db, schema, overrides = {}) {
  const tenantId = overrides.tenantId || 'test-ngo-tenant'
  const userId = overrides.userId || 'test-ngo-user-id'
  seedTenant(db, schema, { id: tenantId, type: 'ngo', name: 'Test NGO', slug: 'test-ngo', ...overrides })
  seedUser(db, schema, { id: userId, tenantId, email: 'admin@testngo.org', tenantType: 'ngo', ...overrides })
  seedMembership(db, schema, { userId, tenantId, role: 'ngo_admin', ...overrides })
}
