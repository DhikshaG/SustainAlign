-- Step 2: corporate discovery actions (saved NGOs, contact inquiries)

CREATE TABLE IF NOT EXISTS corporate_ngo_saves (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  ngo_tenant_id TEXT NOT NULL REFERENCES tenants(id),
  created_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS corporate_ngo_saves_user_ngo_idx
  ON corporate_ngo_saves(user_id, ngo_tenant_id);

CREATE TABLE IF NOT EXISTS corporate_ngo_inquiries (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  corporate_tenant_id TEXT NOT NULL REFERENCES tenants(id),
  ngo_tenant_id TEXT NOT NULL REFERENCES tenants(id),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS corporate_ngo_inquiries_ngo_idx
  ON corporate_ngo_inquiries(ngo_tenant_id);

CREATE INDEX IF NOT EXISTS corporate_ngo_inquiries_user_idx
  ON corporate_ngo_inquiries(user_id);
