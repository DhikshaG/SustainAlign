# Rate Limits

## App-Level (express-rate-limit)

All limits are per-IP per-minute windows.

| Tier    | Rate (Prod) | Rate (Dev)   | Applied To                                          | Rationale                                                                                                                              |
| ------- | ----------- | ------------ | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Auth    | 10 req/min  | 60 req/min   | Login, signup, refresh, MFA endpoints               | Prevents credential stuffing and brute force. Low limit because these are user-initiated actions that happen infrequently per session. |
| API     | 200 req/min | 1000 req/min | All `/api` endpoints except auth                    | General-purpose ceiling — high enough for normal UX (pagination, search, dashboard loads) but low enough to prevent abuse.             |
| Uploads | 20 req/min  | 100 req/min  | File upload endpoints                               | Memory-intensive (multipart parsing, file writes). Limit prevents resource exhaustion from large concurrent uploads.                   |
| AI/RAG  | 15 req/min  | 60 req/min   | AI-powered endpoints (recommendations, RAG queries) | CPU-intensive (LLM inference, embedding generation). Strictest limit to prevent runaway costs and CPU starvation.                      |

**Source:** `backend/src/middleware/rate-limit-auth.js`

## Nginx-Level (reverse proxy)

Applied before traffic reaches Express — acts as a first line of defense.

| Zone     | Rate                          | Scope                           |
| -------- | ----------------------------- | ------------------------------- |
| `api`    | 60 req/min per IP             | All API requests                |
| `login`  | 10 req/min per IP             | Auth endpoints                  |
| `static` | 300 req/min per IP            | Static assets (CSS, JS, images) |
| `conn`   | 30 concurrent connections max | Per-IP connection limit         |

**Source:** `nginx/nginx.conf`, `nginx/conf.d/default.conf`

## Two-Layer Strategy

```
Client → Nginx (connection limit + coarse rate) → Express (fine-grained per-tier rate)
```

- **Nginx** blocks volumetric attacks (slowloris, connection floods) before they reach Node.
- **Express** applies application-aware tiers (auth vs API vs AI) that Nginx can't distinguish.

## Headers

All rate-limited responses include standard headers:

- `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` (via `standardHeaders: true`)
- `Retry-After` on 429 responses
