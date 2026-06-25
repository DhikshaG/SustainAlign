# Phase 2 — Test Foundation Implementation Plan

## Files to create

### Backend test infrastructure (3 files)

1. **`backend/src/test-utils/db.js`** — In-memory SQLite test database setup
   - `createTestDb()` → returns `{ sqlite, db }` with fresh schema
   - Runs Drizzle migrations on `:memory:` database
   - Each call creates an isolated database

2. **`backend/src/test-utils/auth.js`** — Fake auth for integration tests
   - `fakeAuth(userOverrides?)` → Express middleware that sets `req.user`
   - `createTestToken(userOverrides?)` → Creates real JWT for auth tests
   - Default test user: `{ sub: 'test-user-id', tenantId: 'test-tenant', role: 'super_admin', tenantType: 'corporate' }`

3. **`backend/src/test-utils/fixtures.js`** — Test seed data helpers
   - `seedUser(db, overrides?)` → inserts user + membership
   - `seedTenant(db, overrides?)` → inserts tenant
   - `seedProject(db, overrides?)` → inserts project

### Backend unit tests (11 files)

4. **`backend/src/lib/tokens.test.js`** — JWT utility tests
   - `createAccessToken()` / `decodeAccessToken()` roundtrip
   - `createRefreshToken()` returns token + jti + expiresAt
   - `hashToken()` produces deterministic SHA-256
   - `generateOtp()` returns 6-digit string
   - `generateResetToken()` returns hex string
   - Invalid/malformed tokens throw errors
   - Wrong token type (access vs refresh) detection

5. **`backend/src/lib/password.test.js`** — Argon2 password tests
   - `hashPassword()` returns a string
   - `verifyPassword()` works with correct password
   - `verifyPassword()` fails with wrong password

6. **`backend/src/lib/response.test.js`** — Response helper tests
   - `ok()` returns `{ ok: true }` with 200 status
   - `created()` returns 201 status
   - `fail()` returns correct status + message + errors

7. **`backend/src/lib/permissions.test.js`** — RBAC tests
   - `PERMISSIONS` object has all expected keys
   - `getPermissionsForRole('super_admin')` includes all permissions
   - `getPermissionsForRole('volunteer')` has limited permissions
   - `hasPermission()` / `hasAnyPermission()` work correctly
   - `getPermissionMatrix()` returns full mapping

8. **`backend/src/services/auth/index.test.js`** — Auth service tests
   - `corporateSignup()` creates user + tenant + membership
   - `loginUser()` with correct credentials returns tokens
   - `loginUser()` with wrong password throws
   - `verifyMfa()` with correct code works
   - `forgotPassword()` / `resetPassword()` flow works
   - `refreshSession()` rotates tokens
   - `logout()` revokes refresh token
   - `inviteTeam()` creates pending invitations

9. **`backend/src/services/projects/index.test.js`** — Project service tests
   - `createProject()` inserts and returns project
   - `getProject()` returns project with milestones
   - `updateProject()` patches fields
   - `addMilestone()` / `updateMilestone()` / `deleteMilestone()`
   - `addProjectUpdate()` appends update
   - `archiveProject()` sets archived status
   - `computeProjectProgress()` derives percentage from milestones

10. **`backend/src/services/ngo/index.test.js`** — NGO service tests
    - `getProfileBySlug()` returns formatted profile
    - `updateProfile()` patches fields
    - `replaceTeam()` replaces team members
    - `addImpactStory()` / `updateImpactStory()` / `deleteImpactStory()`
    - `addCertification()` / `updateCertification()` / `deleteCertification()`
    - `listProfiles()` returns paginated results
    - `attachMedia()` / `listMedia()` / `removeMedia()`

11. **`backend/src/services/matching/scoring.test.js`** — Matching engine tests
    - `scoreBudgetFit()` returns 0-1 score
    - `scoreDistrictFit()` matches exact/similar/none
    - `scoreGeography()` handles state/district
    - `computeCredibilityScore()` factors verification + past projects
    - `scoreNgo()` combines all sub-scores
    - `buildGenericReason()` returns human-readable string

12. **`backend/src/services/compliance/rules.test.js`** — Compliance rules tests
    - `computeSection135()` calculates 2% obligation correctly
    - `computeSpendBreakdown()` categorizes by Schedule VII
    - `validateScheduleVii()` flags invalid activities
    - `evaluateAlerts()` fires alerts for underspend
    - `getComplianceDueDates()` returns fiscal year dates
    - `formatInrShort()` formats currency strings

13. **`backend/src/services/notifications/index.test.js`** — Notification service tests
    - `createNotification()` inserts notification
    - `listNotifications()` returns user's notifications
    - `countUnread()` returns correct count
    - `markRead()` sets readAt timestamp
    - `markAllRead()` updates all for user

14. **`backend/src/services/discovery/index.test.js`** — NGO discovery tests
    - `saveNgo()` creates save entry
    - `unsaveNgo()` removes save entry
    - `listSavedNgos()` returns saved NGOs
    - `createNgoInquiry()` creates inquiry record

### Backend integration tests (4 files)

15. **`backend/src/routes/auth.test.js`** — Auth endpoint integration tests (supertest)
    - `POST /api/auth/corporate/signup` — creates account
    - `POST /api/auth/corporate/login` — returns tokens
    - `POST /api/auth/shared/refresh` — rotates tokens
    - `POST /api/auth/shared/logout` — revokes session
    - `POST /api/auth/ngo/register` — creates NGO account
    - `POST /api/auth/ngo/login` — returns NGO tokens
    - Validation errors return 400 with field errors
    - Wrong credentials return 401

16. **`backend/src/routes/corporate.test.js`** — Corporate endpoint integration tests
    - `GET /api/corporate/dashboard/summary` — returns dashboard data
    - `GET /api/corporate/discovery/ngos` — returns NGO list
    - `POST /api/corporate/projects` — creates project
    - `GET /api/corporate/projects` — lists projects
    - `GET /api/corporate/projects/:id` — gets project detail
    - `POST /api/corporate/compliance/run-check` — runs compliance check
    - `GET /api/corporate/impact/live` — returns impact snapshot

17. **`backend/src/routes/ngo.test.js`** — NGO endpoint integration tests
    - `GET /api/ngo/dashboard/summary` — NGO dashboard
    - `GET /api/ngo/profile` — returns profile
    - `PATCH /api/ngo/profile` — updates profile
    - `GET /api/ngo/projects` — lists NGO projects
    - `GET /api/ngo/partnership-requests` — lists requests

18. **`backend/src/middleware/authenticate.test.js`** — Middleware tests
    - Missing auth header returns 401
    - Invalid token returns 401
    - Valid token sets `req.user`
    - `requireRole()` allows matching roles
    - `requireRole()` blocks non-matching roles with 403

### Frontend tests (5 files)

19. **`frontend/src/lib/api.test.js`** — API client tests (vitest + msw)
    - `api.get()` sends GET with auth header
    - `api.post()` sends POST with JSON body
    - Auto-refreshes on 401 and retries
    - `apiFetch()` handles FormData correctly
    - `ApiError` class carries status + data
    - Handles network errors gracefully

20. **`frontend/src/context/AuthContext.test.jsx`** — Auth context tests
    - Hydrates user from localStorage on mount
    - `login()` sets tokens and user in state
    - `logout()` clears tokens and redirects
    - `refreshUser()` fetches updated user profile
    - Shows loading state during initial hydration

21. **`frontend/src/hooks/usePermissions.test.js`** — Permission hooks tests
    - Returns permissions for given role
    - `hasPermission()` checks correctly
    - `hasAnyPermission()` checks correctly
    - Works with both `user.permissions` and `user.role`

22. **`frontend/src/components/ui/Button.test.jsx`** — UI component tests
    - Renders children
    - Applies variant classes (primary/secondary/ghost)
    - Applies size classes (sm/md/lg)
    - Supports `as` prop polymorphism
    - Disabled state prevents click
    - Forwards className prop

23. **`frontend/src/components/ui/Input.test.jsx`** — Input component tests
    - Renders with placeholder
    - Shows error state with red border
    - Forwards ref
    - Calls onChange handler
    - Disabled state prevents input

24. **`frontend/src/components/layout/PublicLayout.test.jsx`** — Layout smoke tests
    - Renders PublicHeader + Outlet + PublicFooter
    - Header contains navigation links

### CI gate update (1 file)

25. **`.github/workflows/ci.yml`** — Add coverage thresholds
    - Uncomment or add coverage step after tests
    - Set minimum 30% line coverage
    - Show coverage report in CI output

---

## Full commit list (20 commits)

```
 1. chore: add backend test utilities (in-memory db, fake auth, fixtures)
 2. test: add JWT token and password utility tests
 3. test: add response helper and permission/RBAC tests
 4. test: add auth service unit tests (signup, login, MFA, refresh)
 5. test: add auth route integration tests with supertest
 6. test: add project service unit tests (CRUD, milestones, updates)
 7. test: add corporate route integration tests
 8. test: add NGO service unit tests (profile, team, certifications)
 9. test: add NGO route integration tests
10. test: add matching/scoring engine unit tests
11. test: add compliance rules unit tests (Section 135, alerts)
12. test: add notification and discovery service tests
13. test: add middleware integration tests (auth, validation)
14. test: add frontend API client tests (auth headers, refresh, errors)
15. test: add frontend AuthContext tests
16. test: add frontend usePermissions hook tests
17. test: add frontend UI component tests (Button, Input variants)
18. test: add frontend PublicLayout smoke test
19. test: add frontend page smoke tests (Home, Login, Dashboard)
20. ci: add coverage thresholds and test gating to CI workflow
```
