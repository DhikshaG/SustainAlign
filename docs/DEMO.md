# SustainAlign Demo Guide

Unified end-to-end demo dataset for local development and role-based QA.

## Quick start

```powershell
cd backend
npm run db:reset
npm run db:verify-e2e
npm run dev
```

In a second terminal:

```powershell
cd frontend
npm run dev
```

- Backend: http://localhost:3001
- Frontend: http://localhost:5173 (proxies `/api` to backend)

**Password for all demo accounts:** `Demo@12345`

On Windows, if SQLite native bindings fail:

```powershell
cd backend
npm rebuild better-sqlite3
```

## Demo accounts

### Corporate (Acme Corp) — `/login/corporate`

| Email | Role | Use for |
|-------|------|---------|
| admin@acme.com | super_admin | Full access, settings |
| csr.head@acme.com | csr_head | Projects, discovery, copilot, volunteers |
| finance@acme.com | finance | Fund allocation, disbursements, audit trail |
| compliance@acme.com | compliance | Compliance, reports, audit export |
| esg@acme.com | esg_head | Discovery, copilot, ESG reporting |
| volunteer@acme.com | volunteer | Volunteer events (limited nav) |
| board@acme.com | board | Read-only board view |

### NGO (Green Earth Foundation) — `/login/ngo`

| Email | Role |
|-------|------|
| admin@greenearth.org | ngo_admin |
| field_officer@greenearth.org | field_officer |

### Platform admin — use `/login/corporate`

| Email | Role |
|-------|------|
| platform@sustainalign.com | platform_super_admin |

Platform users sign in through the corporate login page and are redirected to `/admin`.

## Seeded demo story

- **Projects:** `proj-001` (active, partnership accepted), `proj-002` (pending approval), `proj-003` (active), `proj-e2e-pending` (awaiting NGO partnership)
- **CRM:** Message thread + tasks on `proj-001`; milestone pending corporate review
- **Volunteers:** Upcoming "Acme Earth Day Cleanup" + completed "School Kit Packing Day" with certificate
- **Audit:** Invoice + compliance files, download log, disbursement activity
- **Discovery:** Saved NGOs + inquiry to Health For All Trust
- **NGOs:** 10 verified NGO profiles with search + vector index

## Role QA checklist

### Corporate

| Role | Must see | Must NOT see |
|------|----------|--------------|
| super_admin | All nav incl. Settings | — |
| csr_head | Projects, Discovery, Copilot, Volunteers, Communications | Fund release |
| finance | Fund Allocation, Disbursements, Audit Trail, Documents | Copilot, Volunteers |
| compliance | Compliance, Reports, Audit Trail | Copilot, Volunteers |
| esg_head | Discovery, Copilot, ESG Reporting | Fund Allocation |
| volunteer | Volunteers, minimal dashboard | Compliance, Finance, Copilot |
| board | Compliance, Impact, Reports | Settings, project write |

**Smoke pages (as super_admin):**

- `/dashboard` — stats load including volunteer hours
- `/dashboard/projects` — 4 projects
- `/dashboard/volunteers` — 2 events
- `/dashboard/copilot` — page loads
- `/dashboard/audit-trail` — activity entries

### NGO

| Account | Checks |
|---------|--------|
| admin@greenearth.org | Partnership inbox (pending request), project detail, beneficiaries, profile |
| field_officer@greenearth.org | Limited nav; evidence upload / beneficiaries |

### Platform

| Account | Checks |
|---------|--------|
| platform@sustainalign.com | Overview, NGO verification, analytics |

## Resetting demo data

```powershell
cd backend
npm run db:reset
npm run db:verify-e2e
```

`db:seed` alone skips E2E enrichment. Use `db:reset` for the full demo dataset.

## Browser QA (verified)

Last run: all 10 accounts authenticate; role nav matches expectations.

| Account | Result |
|---------|--------|
| admin@acme.com | Full nav; dashboard shows 6 volunteer hours, 2 active projects |
| finance@acme.com | Fund Allocation, Audit Trail, Documents; no Copilot/Volunteers |
| volunteer@acme.com | Dashboard + Volunteers only |
| admin@greenearth.org | NGO nav incl. Requests (partnership inbox) and projects |
| platform@sustainalign.com | Admin overview, NGO Verification, analytics nav |
