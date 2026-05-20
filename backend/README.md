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
npm run db:seed       # dev accounts (password printed to stdout)
```

SQLite file: `./data/sustainalign.db` (configurable via `DATABASE_PATH`).

### Seeded dev accounts

| Email | Role | Password |
|-------|------|----------|
| admin@acme.com | super_admin (corporate) | Demo@12345 |
| admin@greenearth.org | ngo_admin | Demo@12345 |
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
