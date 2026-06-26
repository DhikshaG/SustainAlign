# SustainAlign — Production Readiness Plan

> Six phases to take SustainAlign from prototype to production.

---

## Phase 1 — CI/CD Pipeline

**Goal**: Every code change is automatically linted, built, tested, and deployable.

| #   | Task                | Deliverable                                                                    |
| --- | ------------------- | ------------------------------------------------------------------------------ |
| 1.1 | GitHub Actions CI   | `.github/workflows/ci.yml` — lint, build, test on PR/push to main              |
| 1.2 | GitHub Actions CD   | `.github/workflows/deploy.yml` — SSH + docker compose deploy to any VM         |
| 1.3 | Pre-commit hooks    | `husky` + `lint-staged` — eslint + prettier on commit                          |
| 1.4 | Commit convention   | `commitlint` enforcing conventional commits                                    |
| 1.5 | Deploy script       | `scripts/deploy.sh` — one-command VM deploy (pull → build → migrate → restart) |
| 1.6 | Docker compose prod | `docker-compose.prod.yml` — SSL/reverse-proxy variant                          |
| 1.7 | Test framework      | Vitest configured for backend + frontend with smoke tests                      |
| 1.8 | Makefile targets    | `make ci`, `make test`, `make deploy` targets                                  |

---

## Phase 2 — Test Foundation

**Goal**: Comprehensive test coverage to prevent regressions.

| #   | Task                      | Deliverable                                            |
| --- | ------------------------- | ------------------------------------------------------ |
| 2.1 | Backend unit tests        | Vitest — service-layer tests per domain                |
| 2.2 | Backend integration tests | Supertest — endpoint-level tests with in-memory SQLite |
| 2.3 | Frontend component tests  | Vitest + Testing Library — component + hook tests      |
| 2.4 | Frontend page tests       | Smoke tests for all lazy-loaded routes                 |
| 2.5 | CI gate                   | Tests must pass before merge; coverage thresholds      |

---

## Phase 3 — Observability & Monitoring

**Goal**: Know what's happening in production at all times.

| #   | Task               | Deliverable                                                 |
| --- | ------------------ | ----------------------------------------------------------- |
| 3.1 | Structured logging | Replace `console.log/error` with Pino (JSON logs)           |
| 3.2 | Error tracking     | Sentry integration (backend + frontend)                     |
| 3.3 | Health endpoint    | Enhance `/api/health` with deep dependency checks           |
| 3.4 | Metrics            | Prometheus metrics (request rate, latency, errors, DB)      |
| 3.5 | Dashboards         | Grafana dashboard JSON (request volume, error rate, uptime) |
| 3.6 | Log aggregation    | Docker log shipping to Loki or cloud logger                 |

---

## Phase 4 — Deployability & Infrastructure

**Goal**: Deploy to any VM with minimal friction; survive failures.

| #   | Task                 | Deliverable                                               |
| --- | -------------------- | --------------------------------------------------------- |
| 4.1 | One-command deploy   | Production `deploy.sh` script                             |
| 4.2 | Ansible provisioning | Playbook to bootstrap any Ubuntu VM (Node, Docker, certs) |
| 4.3 | Terraform modules    | Infra-as-code for DO / AWS / Hetzner (optional)           |
| 4.4 | Nginx hardening      | Rate limiting, WAF rules, HSTS, CSP tuning                |
| 4.5 | SSL automation       | Let's Encrypt via certbot in docker-compose               |
| 4.6 | Automated backups    | cron: SQLite dump + uploads tarball → S3/Backblaze B2     |
| 4.7 | API versioning       | Route prefix `/api/v1/` for all endpoints                 |
| 4.8 | Graceful degradation | Feature flags for AI/Ollama, email, optional services     |

---

## Phase 5 — Postgres Migration

**Goal**: Scale beyond single-instance SQLite.

| #   | Task                    | Deliverable                                                |
| --- | ----------------------- | ---------------------------------------------------------- |
| 5.1 | Drizzle Postgres driver | Swap `better-sqlite3` → `@neondatabase/serverless` or `pg` |
| 5.2 | Migration script        | Export SQLite data → Postgres dump + import                |
| 5.3 | Connection pooling      | PgBouncer or built-in `pg.Pool`                            |
| 5.4 | Env toggle              | `DATABASE_URL` switching between SQLite / Postgres         |
| 5.5 | Zero-downtime           | Blue-green deploy pattern for DB switch                    |

---

## Phase 6 — API Documentation

**Goal**: Self-documenting API for frontend devs and third-party integrators.

| #   | Task               | Deliverable                                                          |
| --- | ------------------ | -------------------------------------------------------------------- |
| 6.1 | OpenAPI 3.0 spec   | Auto-generated from Zod schemas via `@asteasolutions/zod-to-openapi` |
| 6.2 | Swagger UI         | Serve interactive docs at `/api/docs`                                |
| 6.3 | Postman collection | Export from OpenAPI spec for manual testing                          |
| 6.4 | API changelog      | Versioned changelog linked to releases                               |

---

## Phase 7 — Security Hardening

**Goal**: Defense-in-depth for production workloads.

| #   | Task                | Deliverable                                |
| --- | ------------------- | ------------------------------------------ |
| 7.1 | Dependency scanning | Dependabot + `npm audit` in CI             |
| 7.2 | Secret scanning     | GitGuardian / Gitleaks in CI               |
| 7.3 | Container scanning  | Trivy scan of Docker images in CI          |
| 7.4 | Rate limit audit    | Review and tune all tiered limits          |
| 7.5 | Pen test plan       | Documented test scenarios per OWASP Top 10 |

---

Status: **Phase 7 complete** ✅
Last updated: 2026-06-26

---

## Phase 7 commit log

```
 1. 63ff9c9 feat(security): phase 7 — security hardening (dependabot, gitleaks, trivy, npm audit, docs)
```

---

## Phase 1 commit log

```
 1. 8463356 docs: add production readiness plan
 2. 7a6b0bf chore: scaffold .github directory with workflows directory
 3. ec71748 build: add vitest configuration for backend tests
 4. 7899d3e test: add backend smoke test
 5. 2956a9a build: add test npm scripts and deps for backend
 6. 0c90728 build: add vitest configuration for frontend tests
 7. ee21278 test: add jest-dom matchers for frontend test setup
 8. c09ed6c test: add frontend smoke test (fixed in 41826ad)
 9. 22e9f0d build: add test npm scripts and deps for frontend
10. df2b9c3 chore: add husky, lint-staged, commitlint, prettier to root
11. 4cd961f chore: add commitlint config
12. 5b5f38f chore: add husky pre-commit hook
13. 4b78778 chore: add husky commit-msg hook
14. d39a473 ci: add github actions cd workflow for vm deploy
15. d9cc00f chore: add production deploy script
16. 81bc19e ci: add production docker-compose override
17. 06091aa chore: update Makefile with ci/cd targets
18. 7d045cd chore: add prettier config
19. 05d9b67 chore: update gitignore for coverage and test db
20. f6832e2 docs: add ci/cd badges and deploy guide to readme
    ── fixes after initial push ──
21. 41826ad test: fix frontend smoke test to use sync imports
22. 0f26024 chore: fix lint-staged config for workspace eslint
23. f854cd6 chore: add .husky/_ to gitignore
24. 91deefa ci: fix ci workflow — split lint, add notify
25. 4177742 ci: fix cd workflow — env protection, secret validation
26. f2ffe6f chore: fix deploy script — argparse, --remote flag
27. ee3d81b ci: add permissions, workflow_dispatch, notify workflow
28. c9fccb5 chore: sync package-lock.json after dep updates
```

## Phase 4 commit log

```
 1. c2b7ac1 fix: sync package-lock.json and ignore coverage dir in eslint
 2. bd5d11b feat(deploy): add rollback.sh, env config example, and deploy Makefile targets
 3. 7c0b590 feat(deploy): enhance health-check.sh with timeout, host config, and frontend check
 4. d7c819a feat(ansible): add inventory, playbook, and ansible.cfg for server provisioning
 5. 58c70ad feat(ansible): add common role — Node.js, Docker, deploy user, system packages
 6. a1bd3e4 feat(ansible): add security and deploy roles
 7. 4457f93 feat(terraform): add DO provider, droplet, and firewall resources
 8. f553a16 feat(terraform): add outputs and tfvars example
 9. 6a9bc8d feat(nginx): add hardened base config with rate limiting, ssl, gzip, json logging
10. 6e34f33 feat(nginx): add reverse proxy config with http->https redirect, api proxy, static caching
11. c74d7c9 feat(nginx): add security headers, bot blocking, attack pattern filtering, hidden file protection
12. 6d374ad feat(ssl): add Let's Encrypt setup script with HTTP-01 challenge and auto-renew cron
13. 3bc9760 feat(ssl): add nginx reverse proxy and certbot services to docker-compose production
14. 8afb307 feat(backup): add backup and restore scripts with age encryption and rclone remote sync
15. 7e543ee feat(backup): add backup cron service to docker-compose and Makefile targets
16. 7c5c3e0 feat(api): dual-mount routes on /api/v1 and /api, add /metrics endpoint
17. 6697131 feat(api): add vite proxy for /api/v1 and update env config for API versioning
18. 19d8775 feat(features): add config with env-based feature toggles
19. baaef9b feat(features): add requireFeature middleware and /features endpoint
20. 1ccec9b feat(features): add frontend feature flag lib, hook, and GracefulDisabled component
```
