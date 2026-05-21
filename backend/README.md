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
npm run db:verify-discovery # verify Step 2 discovery filters and actions
npm run db:verify-projects  # verify Step 3 project management
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

## Step 2 — NGO Discovery V1 (no AI)

Classic server-side filtering for corporate users: **State**, **SDG**, **Theme**, **Budget**, **Verified**, **Impact area**, plus text search. Save, compare, contact, and profile view are wired to the API.

```bash
npm run db:migrate
npm run db:seed
npm run db:verify-discovery
```

### Discovery endpoints (corporate auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/corporate/discovery/filters` | Filter option lists from tag taxonomy |
| GET | `/api/corporate/discovery/ngos` | Filtered list (`state`, `sdg`, `theme`, `impact`, `budgetRange`, `verified`, `q`, `limit`, `offset`) |
| GET | `/api/corporate/saved-ngos` | Saved NGO profiles for current user |
| POST | `/api/corporate/saved-ngos/:slug` | Save NGO (idempotent) |
| DELETE | `/api/corporate/saved-ngos/:slug` | Remove saved NGO |
| POST | `/api/corporate/ngos/:slug/contact` | Submit contact inquiry (`subject`, `message`) |
| GET | `/api/corporate/ngos/:slug` | Full NGO profile |

Compare NGOs uses browser `sessionStorage` (no server persistence). Use **AI Match** mode on the discovery page for ranked recommendations.

## AI NGO Matching Engine

Deterministic scoring (similarity, geography, budget, past impact, credibility) with optional Ollama rerank and reasons. Pre-fills match criteria from past corporate projects.

```bash
npm run db:verify-matching
```

### Scoring dimensions

| Dimension | Weight | Notes |
|-----------|--------|-------|
| Similarity | 30% | CSR focus/keywords vs NGO profile and tags |
| Geography | 20% | State/region/states served |
| Budget fit | 15% | Adjacent budget tiers scored, not hard-filtered |
| Past impact | 20% | Partner performance or beneficiaries/projects proxy |
| Credibility | 15% | Verification, transparency, rating (also returned separately) |

### Matching endpoints (corporate auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/corporate/discovery/match-defaults` | Pre-fill from past projects |
| POST | `/api/corporate/ai/match-ngos` | Rank NGOs — body: `csrFocus`, optional `keywords`, `state`, `sdg`, `theme`, `impact`, `budgetRange` |

Response includes `matchPercent`, `credibilityScore`, `riskScore`, `scoreBreakdown`, and `reason` per match. Dashboard summary returns top 3 as `aiRecommendations`.

## Step 3 — Project Management V1

DB-backed CSR projects for corporate ↔ NGO partnerships: create with NGO assignment and budget, milestones, progress updates, evidence uploads, and approval workflow on create.

```bash
npm run db:migrate
npm run db:seed
npm run db:verify-projects
```

### Project lifecycle

| Status | Meaning |
|--------|---------|
| `pending_approval` | Created; CSR Head → Finance workflow in progress |
| `active` | Approved; NGO can update milestones and post updates |
| `on_hold` / `completed` / `archived` / `rejected` | Manual or workflow terminal states |

Progress % is computed as the average of milestone progress (completed = 100).

### Corporate project endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/corporate/projects` | `projects:read` | List tenant projects |
| POST | `/api/corporate/projects` | `projects:write` | Create project (starts workflow) |
| GET | `/api/corporate/projects/:id` | `projects:read` | Full detail + milestones + updates + files |
| PATCH | `/api/corporate/projects/:id` | `projects:write` | Update project fields |
| DELETE | `/api/corporate/projects/:id` | `projects:write` | Archive project |
| POST | `/api/corporate/projects/:id/milestones` | `projects:write` | Add milestone |
| PATCH | `/api/corporate/projects/:id/milestones/:mid` | `projects:write` | Update milestone |
| DELETE | `/api/corporate/projects/:id/milestones/:mid` | `projects:write` | Delete milestone |
| POST | `/api/corporate/projects/:id/updates` | `projects:write` | Post progress update |
| PATCH | `/api/corporate/projects/:id/spent` | `funds:read` | Update spent_inr |

### NGO project endpoints

| Method | Path | Permission |
|--------|------|------------|
| GET | `/api/ngo/projects` | `projects:read` |
| GET | `/api/ngo/projects/:id` | `projects:read` |
| PATCH | `/api/ngo/projects/:id/milestones/:mid` | `projects:write` |
| POST | `/api/ngo/projects/:id/updates` | `projects:write` |

Create project body: `name`, `scheduleVii`, `startDate`, `endDate`, `ngoSlug`, `budgetInr`, `location`, optional `description`, `theme`, `milestones[]`.

Dashboard, funds allocation, and reporting pages still use static sample data until Step 4+.

## Step 4 — Impact Tracking

Project-level KPIs, beneficiary logs, geo updates, and live dashboard/reporting aggregates.

```bash
npm run db:migrate
npm run db:seed
npm run db:verify-impact
```

### Impact endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/corporate/dashboard/summary` | Live budget, projects, impact metrics |
| GET | `/api/corporate/reporting/overview` | SDG, geo, district, category analytics |
| GET | `/api/corporate/impact/live` | Polling snapshot: time series, districts, SDG, media feed |
| POST | `/api/corporate/ai/impact-summary` | AI executive impact summary (Ollama) |
| POST | `/api/corporate/projects/:id/kpis` | Record KPI |
| POST | `/api/corporate/projects/:id/beneficiaries` | Log beneficiary counts |
| POST | `/api/corporate/projects/:id/geo` | Geo update |
| GET | `/api/ngo/dashboard/summary` | Live NGO rollup (projects, beneficiaries, milestones) |
| GET | `/api/ngo/beneficiaries` | NGO beneficiary logs across projects |

## Step 5 — Report Generation

Multi-format CSR reports from live project, KPI, update, budget, and SDG data (`pdfkit`, `docx`, `pptxgenjs`). AI narrative via Ollama when enabled.

```bash
npm run db:verify-reports
npm run db:verify-ai
```

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/corporate/reports` | List generated reports (includes format) |
| POST | `/api/corporate/reports/preview` | Preview report sections JSON (no file) |
| POST | `/api/corporate/reports/generate` | Generate report — body: `type`, `format` (`pdf`/`docx`/`pptx`), `includeAi`, `periodStart`, `periodEnd` |
| POST | `/api/corporate/reports/:id/submit` | Mark report submitted |

Report types: `executive`, `impact_stories`, `quarterly`, `board`, `sdg`, `impact`, `mca_csr2` (legacy types PDF-only).

## Step 8 — AI CSR Report Generator

Dedicated workflow: period-scoped context → Ollama executive summary + impact stories → template sections → PDF/DOCX/PPTX export.

Frontend: `/dashboard/reports/generate`

Inputs: project data, KPIs, impact updates, budgets, SDG mappings, NGO impact stories.

If Ollama is offline, reports still generate with deterministic fallback content (`metadata.offline: true`).

## Step 9 — Fund Allocation Intelligence

Recommendation engine for CSR budget splits: scores underserved districts, proposes theme/district allocations from obligation and live analytics, and ranks fund-aware NGO partners.

```bash
npm run db:verify-allocation
npm run db:verify-matching
```

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/corporate/funds/allocation` | Live obligation, allocated/spent/unallocated, theme rollup |
| POST | `/api/corporate/funds/intelligence` | Full recommendation DTO — body: `budgetToAllocate`, `scenario` (`baseline`/`balanced`/`aggressive`), `sdgFocus`, `includeAi`, `limit` |

Frontend: `/dashboard/funds/intelligence`

Scoring blends district spend gaps, beneficiary coverage, SDG under-coverage, and NGO presence. Optional Ollama rationale when online.

## Step 10 — ESG + CSR Unified Dashboard

Combines environmental, social, and governance metrics from live CSR projects, KPIs, and compliance data. Maps projects to SDGs and BRSR principles.

```bash
npm run db:verify-esg
npm run db:verify-impact
```

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/corporate/esg/unified` | Unified E/S/G pillars, SDG alignment, BRSR coverage, project mappings, CSR summary |
| POST | `/api/corporate/ai/esg-summary` | AI ESG executive summary (Ollama) |

Frontend: `/dashboard/esg`

Governance subset (audit score, Schedule VII validation) is included inline for `esg_head` without requiring full compliance module access.

## Step 11 — NGO CRM + Workflow

Partnership requests, threaded messaging, project tasks, milestone approval workflows, and unified CRM timeline.

```bash
npm run db:verify-crm
npm run db:verify-projects
```

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/ngo/partnership-requests` | NGO incoming partnership requests |
| POST | `/api/ngo/projects/:id/partnership/respond` | Accept or decline partnership |
| GET/POST | `/api/corporate/communications/threads` | Message threads (live) |
| GET/POST | `/api/*/projects/:id/tasks` | Project task list and assignment |
| POST | `/api/ngo/projects/:id/milestones/:mid/submit` | Submit milestone for corporate review |
| GET | `/api/*/projects/:id/timeline` | Unified CRM activity feed |
| GET | `/api/ngo/submissions` | NGO workflow submission tracker |

Corporate project approval → `pending_ngo` → NGO accept → `active`. Milestone submissions use `milestone_approval` workflow.

## Step 12 — Audit & Transparency

Immutable activity logs, file checksums/versioning, auto-organized audit paths, folder tree API, and audit package export.

```bash
npm run db:verify-audit
```

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/corporate/audit/trail` | Filterable audit trail (uploads, approvals, payments, edits) |
| GET | `/api/corporate/audit/folders` | FY → project → category folder tree |
| POST | `/api/corporate/audit/export` | ZIP audit package (documents + manifest + activity JSON) |
| GET | `/api/corporate/documents` | Live document list grouped by category |
| GET | `/api/audit-trail` | README alias for corporate audit trail |
| GET | `/api/admin/audit/trail` | Cross-tenant audit trail (platform admin) |

`activity_logs` and `workflow_events` are protected by SQLite triggers (no UPDATE/DELETE). File uploads store SHA-256 checksums and computed `audit_path`.

## Step 13 — Employee Volunteering

Corporate volunteer events, employee registration, QR attendance, PDF certificates, and dashboard hours rollup.

```bash
npm run db:verify-volunteers
```

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/corporate/volunteers/summary` | Hours, volunteers, active events |
| GET/POST | `/api/corporate/volunteers/events` | List / create events (`volunteers:manage` for POST) |
| GET/PATCH | `/api/corporate/volunteers/events/:id` | Event detail / update |
| POST/DELETE | `/api/corporate/volunteers/events/:id/register` | Employee signup / cancel |
| GET/POST | `/api/corporate/volunteers/events/:id/qr` | QR check-in payload (`volunteers:manage`) |
| POST | `/api/corporate/volunteers/check-in` | Check in with QR token |
| POST | `/api/corporate/volunteers/events/:id/attendance/manual` | Manual attendance |
| POST | `/api/corporate/volunteers/signups/:id/certificate` | Issue PDF certificate |
| GET | `/api/corporate/volunteers/certificates/:id` | Certificate metadata + download URL |

Dashboard summary includes `volunteering.hoursLogged`, `activeEvents`, and `volunteersCount`.

## Step 14 — AI CSR Copilot RAG

Hybrid RAG pipeline: SQLite vector store + Ollama embeddings + structured NGO filters + LLM synthesis.

```bash
ollama pull nomic-embed-text
ollama pull llama3.1:1b
npm run db:verify-rag
```

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/corporate/copilot/chat` | Chat with RAG routing for NGO discovery queries |
| POST | `/api/corporate/ai/rag/recommend` | Explicit NGO recommendation query |
| POST | `/api/corporate/ai/rag/reindex` | Rebuild vector embeddings for all NGO profiles |
| POST | `/api/corporate/ai/search` | NGO-focused queries delegate to RAG |

Copilot responses include `recommendations[]` and `citations[]` when RAG path is used. Vector index runs on seed and NGO profile updates.

## Step 6 — Compliance Automation Engine

Section 135 eligibility (net worth / turnover / net profit OR logic), 2% obligation formula, Schedule VII validation, unspent tracking, alerts, background sync, MCA JSON export.

```bash
npm run db:verify-compliance
```

Background alert sync runs on server start (`COMPLIANCE_SYNC_INTERVAL_MINUTES`, default 60).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/corporate/compliance/summary` | Full compliance DTO with obligation breakdown + criteria |
| PATCH | `/api/corporate/compliance/profile` | Update FY financials |
| PATCH | `/api/corporate/compliance/alerts/:id/acknowledge` | Acknowledge alert |
| POST | `/api/corporate/compliance/run-check` | Manual alert sync trigger |
| GET | `/api/corporate/compliance/mca-export` | Structured MCA CSR-2 JSON (`compliance:export`) |
| GET | `/api/corporate/funds/allocation` | Live fund allocation |

## Step 7 — AI Layer (Ollama)

Requires `ollama pull llama3.1:1b` and `ollama pull nomic-embed-text`, then `ollama serve`.

```bash
npm run db:verify-ai
```

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/corporate/copilot/suggestions` | Context-aware prompts |
| POST | `/api/corporate/copilot/chat` | Grounded copilot chat |
| POST | `/api/corporate/ai/match-ngos` | AI NGO matching |
| POST | `/api/corporate/ai/search` | AI-enhanced search |
| POST | `/api/corporate/ai/narrative` | Impact narrative |

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
