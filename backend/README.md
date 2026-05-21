# SustainAlign Backend API

Node.js + Express API with SQLite (better-sqlite3), Drizzle ORM, JWT auth, and refresh-token rotation.

## Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Server: `http://localhost:3001`

## Database

```bash
npm run db:generate   # after schema changes
npm run db:migrate    # apply migrations (Step 0: files, notifications, activity_logs)
npm run db:seed       # dev accounts + 10 NGO profiles (password printed to stdout)
npm run db:verify-ngo # verify NGO seed data after db:seed
```

SQLite file: `./data/sustainalign.db` (configurable via `DATABASE_PATH`).

### Seeded dev accounts

| Email | Role | Password |
|-------|------|----------|
| admin@acme.com | super_admin (corporate) | Demo@12345 |
| admin@greenearth.org | ngo_admin | Demo@12345 |
| field_officer@greenearth.org | field_officer | Demo@12345 |
| platform@sustainalign.com | platform_super_admin | Demo@12345 |

## Environment

| Variable | Required (prod) | Description |
|----------|-----------------|-------------|
| `PORT` | | Server port (default 3001) |
| `CORS_ORIGIN` | | Frontend origin |
| `NODE_ENV` | | development / production |
| `DATABASE_PATH` | yes | SQLite file path |
| `JWT_SECRET` | yes (32+ chars) | Access token signing secret |
| `JWT_REFRESH_SECRET` | yes (32+ chars) | Refresh token signing secret |
| `ACCESS_TOKEN_TTL_MINUTES` | | Default 15 |
| `REFRESH_TOKEN_TTL_DAYS` | | Default 7 |
| `APP_URL` | | Frontend URL for email links |
| `SMTP_*` | | Email (optional in dev — logs to console) |
| `STORAGE_PROVIDER` | | `local` (default) — file upload backend |
| `UPLOAD_ROOT` | | Directory for uploaded files (default `./uploads`) |
| `MAX_FILE_SIZE_MB` | | Max upload size per file (default 10) |

## Step 0 — Foundation APIs

- `GET /api/auth/me` — includes `permissions[]` for the signed-in role
- `POST /api/files/upload` — multipart `file` + `category` (requires `files:upload`)
- `GET /api/files`, `GET /api/files/:id`, `GET /api/files/:id/download`
- `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all`
- `GET /api/activity`, `GET /api/activity/export` — tenant audit log with filters
- `GET /api/admin/activity` — cross-tenant audit (`admin:audit:read`)
- `GET /api/search?q=` — universal FTS search across NGOs, projects, reports, locations, SDGs
- `GET /api/tags`, `PUT /api/entities/:type/:id/tags` — taxonomy and entity tagging
- `GET /api/workflows/inbox`, `POST /api/workflows/instances/:id/transition` — approval workflow
- `POST /api/ngo/reports` — submit demo report (starts CSR → Finance → Compliance chain)
- `POST /api/admin/ngo-verification/:tenantId/approve|reject` — demo verify flow

Seeded accounts include `field_officer@greenearth.org` (NGO field officer, projects + beneficiaries only).

Virus scanning is **not** enabled in Step 0.

## Step 1 — NGO Database + Profiles

After migrate + seed, the database includes **10 NGO tenants** with full profiles (team, past projects, impact metrics, tags, platform scores). Eight are verified and appear on the public directory; two remain pending verification.

```bash
npm run db:seed
npm run db:verify-ngo
```

### NGO API highlights

| Audience | Endpoints |
|----------|-----------|
| Public | `GET /api/ngos`, `GET /api/ngos/:slug` (verified only) |
| Corporate | `GET /api/corporate/discovery/ngos`, `GET /api/corporate/ngos/:slug` |
| NGO portal | `GET/PATCH /api/ngo/profile`, team/projects/metrics/stories/certs/media |
| Admin | `GET /api/admin/ngo-verification`, `PATCH /api/admin/ngos/:tenantId/risk` |

Search index is rebuilt during seed (`reindexAll`) so discovery filters and FTS include all NGOs.

## Auth endpoints

### Corporate
- `POST /api/auth/corporate/signup`
- `POST /api/auth/corporate/login`
- `POST /api/auth/corporate/forgot-password`
- `POST /api/auth/corporate/reset-password`
- `POST /api/auth/corporate/mfa/verify`
- `POST /api/auth/corporate/invite-team` (auth required)

### NGO
- `POST /api/auth/ngo/register`
- `POST /api/auth/ngo/login`
- `POST /api/auth/ngo/verification` (auth required, multipart)

### Shared
- `POST /api/auth/refresh` — `{ refresh_token }`
- `POST /api/auth/logout` — `{ refresh_token }`
- `GET /api/auth/me` — Bearer access token

### Public
- `POST /api/contact`, `POST /api/demo-booking`
- `GET /api/blog`, `/api/ngos`, `/api/case-studies`, `/api/jobs`
- `GET /api/health`

## Security features

- Argon2 password hashing
- Separate access/refresh JWT secrets with type claims
- Refresh token rotation + reuse detection (revokes all sessions on theft)
- Rate limiting (10 req/min) on auth routes
- Production env validation (refuses weak/missing secrets)
- NGO uploads stored on disk outside web root
