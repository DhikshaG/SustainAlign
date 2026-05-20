# SustainAlign Backend (Stub API)

Node.js + Express stub API for the SustainAlign rewrite. All endpoints validate input with Zod and return placeholder responses — no database yet.

## Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Server runs at `http://localhost:3001`.

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `CORS_ORIGIN` | `http://localhost:5173` | Frontend origin |
| `JWT_SECRET` | `dev-secret` | Placeholder for future auth |

## Endpoints

### Corporate Auth
- `POST /api/auth/corporate/signup`
- `POST /api/auth/corporate/login`
- `POST /api/auth/corporate/forgot-password`
- `POST /api/auth/corporate/reset-password`
- `POST /api/auth/corporate/mfa/verify`
- `POST /api/auth/corporate/invite-team`

### NGO Auth
- `POST /api/auth/ngo/register`
- `POST /api/auth/ngo/login`
- `POST /api/auth/ngo/verification` (multipart)

### Public
- `POST /api/contact`
- `POST /api/demo-booking`
- `GET /api/blog`, `/api/blog/:slug`
- `GET /api/ngos`, `/api/ngos/:slug`
- `GET /api/case-studies`, `/api/case-studies/:slug`
- `GET /api/jobs`
- `GET /api/health`
