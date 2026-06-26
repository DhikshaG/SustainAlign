# Penetration Test Plan

> OWASP Top 10 (2021) + API-specific threats for SustainAlign.
> Target: `https://<deployed-host>/api/v1/*`

---

## 1. Broken Access Control (OWASP #1)

### 1.1 IDOR — Corporate user accessing NGO data

- **Test:** `GET /api/v1/ngo/profiles/{ngoId}` as corporate user, try other tenants' IDs
- **Expected:** 403 or data scoped to own tenant
- **Tool:** Burp Suite / Postman with token replay

### 1.2 IDOR — NGO user accessing corporate data

- **Test:** `GET /api/v1/corporate/projects/{projectId}` as NGO user
- **Expected:** 403 unless project is shared/public

### 1.3 Privilege escalation (user → admin)

- **Test:** `POST /api/v1/admin/users` as non-admin JWT
- **Expected:** 403

### 1.4 Vertical privilege escalation

- **Test:** Call `POST /api/v1/admin/system/config` with regular corporate JWT
- **Expected:** 403

### 1.5 BOLA (API-specific)

- **Test:** `/api/v1/projects/{projectId}`, replace projectId with UUID from different tenant
- **Expected:** 403 or empty result

---

## 2. Cryptographic Failures (OWASP #2)

### 2.1 Weak JWT algorithm

- **Test:** Submit JWT with `alg: none`, `alg: HS256` with public key
- **Expected:** 401

### 2.2 JWT expiry bypass

- **Test:** Replay an access token past its 15-min expiry
- **Expected:** 401

### 2.3 Refresh token reuse

- **Test:** Use a refresh token, then reuse it
- **Expected:** First use succeeds, second use invalidates all tokens for that session

### 2.4 Token exposure in URLs

- **Test:** Check if any endpoint accepts tokens in query params
- **Expected:** Tokens only in `Authorization: Bearer` header

### 2.5 Transport security

- **Test:** Attempt HTTP connection (should redirect to HTTPS)
- **Expected:** 301 redirect or TLS-only

---

## 3. Injection (OWASP #3)

### 3.1 SQL injection

- **Test:** `search[query]=1' OR '1'='1`, `search[query]=1; DROP TABLE users`
- **Tool:** sqlmap
- **Expected:** Error (no data leak) or sanitized query

### 3.2 NoSQL injection (if applicable)

- **Test:** Object injection in JSON bodies
- **Tool:** Custom payloads

### 3.3 Zod schema bypass

- **Test:** Oversized strings, type mismatches, prototype pollution in JSON bodies
- **Expected:** 400 validation error

### 3.4 Header injection

- **Test:** Newlines/CRLF in headers (CORS origin, referer)
- **Expected:** Rejected or sanitized

### 3.5 Mass assignment (API-specific)

- **Test:** `POST /api/v1/corporate/projects` with extra fields like `role: admin`, `isVerified: true`
- **Expected:** Extra fields silently ignored or 400

---

## 4. Insecure Design (OWASP #4)

### 4.1 Rate limit bypass

- **Test:** Exceed auth limits via distributed IPs (X-Forwarded-For rotation)
- **Expected:** Rate limits enforced on real IP behind proxy

### 4.2 Account enumeration

- **Test:** Login endpoint returns different messages for valid vs invalid email
- **Expected:** Generic message like "Invalid credentials" regardless of email validity

### 4.3 Password policy bypass

- **Test:** Register with weak password (`123456`)
- **Expected:** Zod schema rejects weak passwords

### 4.4 Missing auth on sensitive endpoints

- **Test:** Crawl all endpoints without `Authorization` header
- **Expected:** Protected endpoints return 401

---

## 5. Security Misconfiguration (OWASP #5)

### 5.1 CORS misconfiguration

- **Test:** `Origin: https://evil.com` → check `Access-Control-Allow-Origin`
- **Expected:** Not reflected (only allow-list works)

### 5.2 Verbose error messages

- **Test:** Trigger 500 errors with malformed input
- **Expected:** Generic error, no stack traces

### 5.3 Missing security headers

- **Test:** `curl -I` against all endpoints
- **Expected:** CSP, X-Content-Type-Options, X-Frame-Options, Permissions-Policy, Referrer-Policy present

### 5.4 Default/weak credentials

- **Test:** `admin@techcorp.com / admin123` (from seed)
- **Expected:** Works in dev, fails in production (or production blocks default seeds)

---

## 6. Vulnerable & Outdated Components (OWASP #6)

### 6.1 Dependency audit

- **Test:** `npm audit --audit-level=high`
- **Expected:** Zero high/critical vulnerabilities

### 6.2 Container base image audit

- **Test:** `trivy image sustainalign-backend:latest`
- **Expected:** Zero critical vulnerabilities

### 6.3 Dependabot coverage

- **Test:** Check that `.github/dependabot.yml` covers both npm and Docker
- **Expected:** Weekly scans configured

---

## 7. Identification & Authentication Failures (OWASP #7)

### 7.1 MFA bypass

- **Test:** Complete login without MFA step
- **Expected:** MFA required if configured for the account

### 7.2 Session fixation

- **Test:** Check if session ID is predictable or reusable from before login
- **Expected:** New session on login; old session invalidated

### 7.3 Brute force resistance

- **Test:** Rapid login attempts with different passwords
- **Expected:** Lockout after N failures or progressive delay

### 7.4 JWT signature validation

- **Test:** Tamper with payload (change `sub` or `role`), resign with wrong key
- **Expected:** 401

---

## 8. Software & Data Integrity Failures (OWASP #8)

### 8.1 Unsafe deserialization

- **Test:** Upload crafted JSON/YAML payloads
- **Expected:** Validated by Zod, no eval/deserialize

### 8.2 File upload validation

- **Test:** Upload `.exe`, `.html`, symlink, path traversal (`../../etc/passwd`)
- **Expected:** MIME whitelist rejection, path sanitization

### 8.3 Upload size limits

- **Test:** Upload file > limits
- **Expected:** 413 Payload Too Large

### 8.4 Dependency supply chain

- **Test:** Verify `package-lock.json` integrity (no modified registry URLs)
- **Tool:** `npm audit signatures`

---

## 9. Security Logging & Monitoring Failures (OWASP #9)

### 9.1 Audit trail completeness

- **Test:** Perform sensitive actions (login, create project, delete entity)
- **Expected:** Each action logged with userId, timestamp, action, resourceId

### 9.2 Log injection

- **Test:** Inject newlines or special chars in fields that get logged (email, name)
- **Expected:** Logged safely (Pino handles this)

### 9.3 Missing auth events logged

- **Test:** Failed login, password change, MFA enrollment
- **Expected:** All auth events logged at `info` level

---

## 10. Server-Side Request Forgery (OWASP #10)

### 10.1 SSRF via external URLs

- **Test:** Submit URLs in webhook/webhook-like fields pointing to `http://169.254.169.254/` (metadata API)
- **Expected:** Blocked or sanitized

### 10.2 SSRF via file import

- **Test:** Import from URL point to internal services
- **Expected:** URL import disabled or restricted to allow-list

### 10.3 SSRF via image URL

- **Test:** Include avatar/image URL pointing to internal network
- **Expected:** Validated or proxied through safe fetcher

---

## Appendix: Test Environment Setup

```bash
# 1. Run backend locally with production config
cp .env.example .env  # set production-like secrets
npm run dev:backend

# 2. Seed test data
npm run db:reset --workspace backend

# 3. Run automated scan
npm audit --audit-level=high
npx gitleaks detect --source .
```

## Appendix: Reporting Template

```
Vulnerability: [Title]
Severity: [Critical/High/Medium/Low]
Endpoint: [URL]
Method: [GET/POST/PUT/DELETE]
Request: [curl command or payload]
Expected: [What should happen]
Actual: [What actually happened]
Remediation: [How to fix]
CWE: [CWE-ID]
```
