# MH App — Codebase Index & Reference

> **Purpose:** Single source of truth for AI agents and developers. Read this file first before searching the repo. It maps architecture, files, APIs, types, env vars, and conventions as of the latest refactor (controller–service layer, Zod validation, custom CSRF, student mobile UI).

---

## Table of Contents

1. [Project Summary](#1-project-summary)
2. [Repository Layout](#2-repository-layout)
3. [Tech Stack & Dependencies](#3-tech-stack--dependencies)
4. [Environment Variables](#4-environment-variables)
5. [Backend Index](#5-backend-index)
6. [API Reference](#6-api-reference)
7. [Data Models (MongoDB)](#7-data-models-mongodb)
8. [Authentication & Security](#8-authentication--security)
9. [Attendance Business Rules](#9-attendance-business-rules)
10. [Frontend Index](#10-frontend-index)
11. [Pages & Routing](#11-pages--routing)
12. [Components Catalog](#12-components-catalog)
13. [Hooks, Context & API Client](#13-hooks-context--api-client)
14. [Types & Shared Constants](#14-types--shared-constants)
15. [PWA & Offline](#15-pwa--offline)
16. [Scripts & Tests](#16-scripts--tests)
17. [Conventions & Where to Change What](#17-conventions--where-to-change-what)
18. [Known Issues & Future Work](#18-known-issues--future-work)

---

## 1. Project Summary

| Field | Value |
|-------|--------|
| **Name** | MH App — Mess Management Web App |
| **Org** | Men's Hostel, GEC Sreekrishnapuram (GECSKP) |
| **Roles** | `student`, `admin` |
| **Core features** | Mess cut / meal attendance calendar, admin daily summary & monthly reports, mess bills (PDF links), notifications (PDF links), user registration (admin), password reset |
| **Monorepo** | `frontend/` (Next.js 16 + TS) + `backend/` (Express + JS) |
| **Default ports** | Frontend `3000`, Backend `5000` |

**Meal model:** Each day has `{ morning, noon, night }` booleans. `true` = present (eating), `false` = absent (mess cut for that meal). Full mess cut = all three `false`.

---

## 2. Repository Layout

```
MH App/
├── README.md
├── codebase_review.md          ← this file
├── .eslintrc.json
├── backend/
│   ├── package.json
│   ├── jest.config.js
│   ├── scripts/
│   │   └── bulkUserImport.js   # One-off XLSX → users + email passwords
│   └── src/
│       ├── index.js              # Express app entry, middleware stack, route mounting
│       ├── config/index.js       # Env validation + centralized config
│       ├── constants/errors.js   # ERROR_MESSAGES, ERROR_CODES
│       ├── controllers/          # HTTP handlers (thin)
│       ├── services/             # Business logic + DB
│       ├── routes/               # Route definitions + rate limits + validators
│       ├── models/               # Mongoose schemas
│       ├── middleware/           # auth, csrf, errorHandler
│       ├── validators/           # Zod schemas → Express middleware
│       └── utils/                # dateUtils, sanitize, zodValidate
└── frontend/
    ├── package.json
    ├── next.config.ts            # Bundle analyzer wrapper
    ├── jest.config.ts
    ├── public/                   # PWA assets, sw.js, manifest, logos
    └── src/
        ├── app/                  # Next.js App Router pages
        ├── components/           # UI + admin + student/*
        ├── context/AuthContext.tsx
        ├── hooks/useApi.ts       # React Query hooks
        ├── providers/QueryProvider.tsx
        ├── types/index.ts
        ├── constants/
        └── utils/                # api.ts, attendanceStats, logger, validation
```

---

## 3. Tech Stack & Dependencies

### Backend (`backend/package.json`)

| Package | Use |
|---------|-----|
| express | HTTP server |
| mongoose | MongoDB ODM |
| jsonwebtoken + bcryptjs | Auth |
| zod | Request validation |
| date-fns | Date parsing & deadline/window logic |
| validator | Body sanitization (`utils/sanitize.js`) |
| helmet, cors, compression, cookie-parser | Security & perf |
| express-rate-limit | Per-route limits |
| nodemailer | Password reset emails |
| exceljs, xlsx | Monthly report export (service) + bulk import script |

**Note:** Backend is **JavaScript**, not TypeScript. No shared types package with frontend.

### Frontend (`frontend/package.json`)

| Package | Use |
|---------|-----|
| next 16, react 19 | App framework |
| @tanstack/react-query | Server state / caching |
| axios | Only on forgot/reset password pages (not main API) |
| framer-motion | Home splash, animations |
| react-icons | Icons (tree-shake per import path) |
| react-hot-toast | Toasts (layout) |
| react-day-picker | (available; calendar is custom in AttendanceCalendar) |
| jspdf + jspdf-autotable | Admin PDF exports on dashboard |
| tailwindcss 4 | Styling via `@import "tailwindcss"` in globals.css |

---

## 4. Environment Variables

### Backend (`backend/.env`) — validated in `config/index.js`

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `MONGODB_URI` | **Yes** | — | MongoDB connection |
| `JWT_SECRET` | **Yes** | — | Access token signing |
| `JWT_REFRESH_SECRET` | **Yes** | — | Refresh token signing |
| `PORT` | No | `5000` | Server port |
| `NODE_ENV` | No | `development` | Affects cookies, error details |
| `FRONTEND_URL` | No | `http://localhost:3000` | CORS origins (comma-separated) |
| `JWT_ACCESS_TOKEN_EXPIRY` | No | `15m` | Access JWT TTL |
| `JWT_REFRESH_TOKEN_EXPIRY` | No | `7d` | Refresh JWT TTL |
| `EMAIL_USER`, `EMAIL_PASS` | No | — | Password reset (warns on startup if missing) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | No | gmail / 465 / auto | SMTP |
| `ATTENDANCE_DEADLINE_HOUR` | No | `19` | UTC hour on **day before** target date |
| `ATTENDANCE_WINDOW_DAYS` | No | `7` | Max days ahead (+ yesterday) students can mark |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | 15 min |
| `RATE_LIMIT_MAX` | No | `100` | Global `/api` limit |
| `AUTH_RATE_LIMIT_MAX` | No | `10` | Login / forgot / reset |
| `ATTENDANCE_RATE_LIMIT_MAX` | No | `20` | POST `/mark` |
| `JSON_BODY_LIMIT` | No | `1mb` | Body size |

### Frontend (`frontend/.env.local`)

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:5000` | API base (`utils/api.ts`, some pages use raw fetch/axios) |
| `NEXT_PUBLIC_ATTENDANCE_WINDOW_DAYS` | `7` | Client-side calendar disable logic (must match backend) |
| `NEXT_PUBLIC_ATTENDANCE_DEADLINE_HOUR` | `19` | Client-side deadline UI (must match backend) |

---

## 5. Backend Index

### 5.1 Entry & Middleware Order (`backend/src/index.js`)

1. `helmet` (CSP allows `'unsafe-inline'` styles)
2. `compression`
3. `cookieParser`
4. `setCsrfToken` — sets `csrf-token` cookie if missing
5. `cors` (credentials, `X-CSRF-Token` header allowed)
6. `express.json` (size from config)
7. `sanitizeBody` — strips/escapes all `req.body` strings recursively
8. `rateLimit` on `/api/*`
9. Routes (see [API Reference](#6-api-reference))
10. `errorHandler` (last)

**Health:** `GET /` → `"Mess Management API is running!"`

### 5.2 Layer Pattern

```
Route → [rateLimit] → [auth] → [adminOnly] → [csrfProtection] → Zod validate → Controller → Service → Model
```

- **Validated data:** `req.validated` (set by `utils/zodValidate.js`)
- **User from JWT:** `req.user` (`userId`, `role`, `name`, `email`, optional `yearOfStudy`, `roomNumber`)
- **Services throw** string errors like `'DEADLINE_PASSED'` → mapped in `errorHandler.js`

### 5.3 File Map

| Path | Responsibility |
|------|----------------|
| `config/index.js` | All env; exits process if required vars missing |
| `constants/errors.js` | `ERROR_MESSAGES`, `ERROR_CODES` for consistent API codes |
| `middleware/auth.js` | `auth`, `adminOnly` |
| `middleware/csrf.js` | Double Submit Cookie: `csrf-token` cookie + `X-CSRF-Token` header |
| `middleware/errorHandler.js` | Maps service errors, JWT, Mongo 11000, CORS, CSRF |
| `utils/dateUtils.js` | `parseDate`, `calculateDeadline`, `isBeforeDeadline`, `isWithinWindow` |
| `utils/zodValidate.js` | `validate(schema, 'body' \| 'query')` middleware factory |
| `utils/sanitize.js` | `sanitizeBody` global middleware |
| `controllers/authController.js` | register, login, forgot/reset, refresh, me, logout, users |
| `controllers/attendanceController.js` | mark, month, admin summary, monthly reports |
| `controllers/messBillController.js` | CRUD mess bills |
| `controllers/notificationController.js` | CRUD notifications |
| `services/authService.js` | Users, tokens, email reset, `formatPublicUser` |
| `services/attendanceService.js` | Mark/get/summary/reports |
| `services/messBillService.js` | Mess bill persistence |
| `services/notificationService.js` | Notification persistence |
| `routes/auth.js` | `/api/auth/*` |
| `routes/attendance.js` | `/api/attendance/*` |
| `routes/messBill.js` | `/api/mess-bill/*` |
| `routes/notification.js` | `/api/notifications/*` |
| `validators/*.js` | Zod schemas per domain |

---

## 6. API Reference

Base URL: `{API}/api` (e.g. `http://localhost:5000/api`)

### CSRF

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/csrf-token` | No | Returns `{ csrfToken }`; sets cookie |

**CSRF required:** All non-GET state-changing routes **except** `/api/auth/*`. Header: `X-CSRF-Token` must match `csrf-token` cookie.

### Auth (`/api/auth`)

| Method | Path | Middleware | Body / Query | Response (success) |
|--------|------|------------|--------------|---------------------|
| POST | `/register` | auth, adminOnly, validateRegister | `{ name, email, password, role?, yearOfStudy?, roomNumber? }` | `201` `{ message }` |
| POST | `/login` | authLimiter, validateLogin | `{ email, password }` | `{ token, user }` + `refreshToken` httpOnly cookie |
| POST | `/forgot-password` | authLimiter | `{ email }` | `{ message }` (no enumeration) |
| POST | `/reset-password/:token` | authLimiter | `{ password }` | `{ message }` |
| POST | `/refresh` | — | cookie `refreshToken` | `{ token }` |
| GET | `/me` | auth | — | `{ user }` |
| POST | `/logout` | — | — | `{ message }` (clears refresh cookie) |
| GET | `/users` | auth, adminOnly | — | `{ users: User[] }` |

**Public user shape** (`formatPublicUser`): `{ userId, name, email, role, yearOfStudy?, roomNumber? }`

### Attendance (`/api/attendance`)

| Method | Path | Middleware | Body / Query | Response |
|--------|------|------------|--------------|----------|
| POST | `/mark` | attendanceLimiter, auth, csrf, validate | `{ date: YYYY-MM-DD, meals: { morning, noon, night } }` | `{ message, attendance }` |
| GET | `/month` | auth, validate query | `?month=YYYY-MM` | `{ attendance: AttendanceRecord[] }` |
| GET | `/admin/summary` | auth, adminOnly | `?date=YYYY-MM-DD` | `{ date, summary: { morning, noon, night }, details: [...] }` |
| GET | `/admin/monthly-report` | auth, adminOnly | `?startDate&endDate` | Excel/blob (controller) |
| POST | `/admin/monthly-report` | auth, adminOnly | `{ dates: string[] }` | Excel/blob |

**Admin summary `details` item:** `{ name, email, morning, noon, night, morningAbsent, noonAbsent, nightAbsent }` (booleans for UI/PDF).

**Common errors:** `400` + `DEADLINE_PASSED`, `OUTSIDE_WINDOW`, `INVALID_DATE`; `409` `DUPLICATE_ENTRY`

### Mess Bill (`/api/mess-bill`)

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | `/` | admin | `{ month, year, previewUrl, url }` | `201` `{ message, bill }` |
| GET | `/` | **Public** | — | `{ bills }` |
| DELETE | `/:id` | admin | — | `{ message }` |

### Notifications (`/api/notifications`)

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | `/` | admin | `{ title, message?, pdfUrl, type? }` | `201` `{ message, notification }` |
| GET | `/` | **Public** | — | `{ notifications }` |
| DELETE | `/:id` | admin | — | `{ message }` |

### Standard Error JSON

```json
{ "error": "Human message", "code": "ERROR_CODE", "details": [] }
```

`details` only in development for some errors. Validation: `code: "VALIDATION_ERROR"`, `details: [{ field, message }]`.

---

## 7. Data Models (MongoDB)

### User (`models/User.js`)

| Field | Type | Notes |
|-------|------|-------|
| name | String | required |
| email | String | required, unique |
| password | String | required, bcrypt pre-save hook |
| role | enum | `student` \| `admin`, default `student` |
| yearOfStudy | String | default `''` |
| roomNumber | String | default `''` |
| resetPasswordToken | String | hashed token |
| resetPasswordExpires | Date | |
| timestamps | | createdAt, updatedAt |

**Indexes:** `role`, `role+yearOfStudy`, `role+roomNumber`, `resetPasswordToken`

### Attendance (`models/Attendance.js`)

| Field | Type | Notes |
|-------|------|-------|
| userId | ObjectId → User | required |
| date | String | `YYYY-MM-DD` |
| meals | `{ morning, noon, night }` | Boolean, default `true` each |

**Index:** unique `{ userId: 1, date: 1 }`

### MessBill (`models/MessBill.js`)

| Field | Type |
|-------|------|
| month | String |
| year | Number |
| previewUrl, url | String (external links) |
| createdAt | Date |

**Indexes:** `{ year: -1, month: -1 }`, `{ createdAt: -1 }`

### Notification (`models/Notification.js`)

| Field | Type |
|-------|------|
| title | String required |
| message | String optional |
| pdfUrl | String required |
| type | String optional |
| createdAt | Date |

**Indexes:** `{ createdAt: -1 }`, `{ type: 1 }`

---

## 8. Authentication & Security

### Token flow

1. **Login:** Access token in JSON `token` → frontend stores in `localStorage`. Refresh token in **httpOnly** cookie `refreshToken`.
2. **API calls:** `Authorization: Bearer {token}` via `frontend/src/utils/api.ts`.
3. **401:** Client calls `POST /api/auth/refresh` with cookies → updates `localStorage` token → retries once.
4. **Logout:** `POST /api/auth/logout` + clear `localStorage` + dispatch `authStateChanged`.

### JWT access payload

`{ userId, role, name, email, yearOfStudy?, roomNumber? }` — signed with `JWT_SECRET`.

### CSRF (replaced deprecated `csurf`)

- Implementation: `backend/src/middleware/csrf.js` — **Double Submit Cookie**
- Cookie `csrf-token` (not httpOnly; JS-readable)
- Protected routes compare header `X-CSRF-Token` to cookie
- Frontend `ApiClient` fetches `/api/csrf-token` before mutating requests; retries once on `403`

### Other security

- `helmet` CSP, `sanitizeBody` on all JSON bodies
- Rate limits: global + auth + attendance
- CORS whitelist from `FRONTEND_URL`
- Admin routes: `adminOnly` middleware
- Password reset tokens hashed (SHA-256) in DB

---

## 9. Attendance Business Rules

**Source of truth (server):** `services/attendanceService.js` + `utils/dateUtils.js` + `config/index.js`

| Rule | Implementation |
|------|----------------|
| Date format | `YYYY-MM-DD`, parsed as UTC midnight |
| Deadline | `ATTENDANCE_DEADLINE_HOUR` UTC on the **calendar day before** the attendance date |
| Window | From **yesterday** through **today + ATTENDANCE_WINDOW_DAYS** (inclusive, UTC day boundaries) |
| Upsert | `findOneAndUpdate` with `upsert`; handles Mongo `11000` race |
| Full mess cut | All three meals `false` (used in monthly report counting) |

**Client mirror:** `AttendanceCalendar.tsx` uses `NEXT_PUBLIC_ATTENDANCE_*` for disabling dates (keep in sync with backend env).

**Frontend status derivation:** `utils/attendanceStats.ts` → `getDayStatus`: all false = `messcut`, all true = `full`, else `partial`.

---

## 10. Frontend Index

### 10.1 App shell (`app/layout.tsx`)

- Font: Manrope (`--font-manrope`)
- Providers: `QueryProvider` → `AuthProvider`
- Global: `Header`, `MainContent`, `Toaster`, `PWARegistration`, `ClientInserts`

### 10.2 Role-based UI (`Header.tsx` + `MainContent.tsx`)

| Role | Mobile | Desktop |
|------|--------|---------|
| **student** | `StudentTopBar`, `BottomNav`, `StudentDrawer` | `Topbar` + `Sidebar` (`studentMode`) |
| **admin / guest** | `Topbar` + `Sidebar` | same |

**Student bottom nav:** `/dashboard`, `/mess-bill`, `/notifications`, `/profile`

### 10.3 Design tokens (`app/globals.css`)

| CSS variable | Typical use |
|--------------|-------------|
| `--mh-primary` | `#4441CC` — buttons, active nav |
| `--mh-primary-soft` | Active nav background |
| `--mh-surface` | Page background `#f8f9fb` |
| `--mh-text-secondary`, `--mh-text-muted` | Secondary text |

Utility classes: `.mh-app-title`, `.mh-welcome`, `.mh-display-name`, `.mh-section-title`, `.mh-badge`, `.mh-nav-label`

---

## 11. Pages & Routing

| Route | File | Who | Purpose |
|-------|------|-----|---------|
| `/` | `app/page.tsx` | Public | Hostel info landing + splash |
| `/login` | `app/login/page.tsx` | Public | Login |
| `/forgot-password` | `app/forgot-password/page.tsx` | Public | Uses **axios** directly |
| `/reset-password/[token]` | `app/reset-password/[token]/page.tsx` | Public | Uses **axios** |
| `/dashboard` | `app/dashboard/page.tsx` | Auth | **Student:** `StudentDashboard`; **Admin:** summary, user count, PDF export |
| `/dashboard/create-user` | `app/dashboard/create-user/page.tsx` | Admin | Register students |
| `/dashboard/monthly-report` | `app/dashboard/monthly-report/page.tsx` | Admin | Report download (raw fetch + blob) |
| `/mess-bill` | `app/mess-bill/page.tsx` | All | List bills (public GET) |
| `/notifications` | `app/notifications/page.tsx` | All | List notifications |
| `/rules` | `app/rules/page.tsx` | All | Mess rules static content |
| `/profile` | `app/profile/page.tsx` | Student | Profile / room / year |

**No route-level middleware file** — auth gating is per-page (`useAuth`, redirects in components).

---

## 12. Components Catalog

### Shared / Admin

| Component | Path | Role |
|-----------|------|------|
| `Header` | `components/Header.tsx` | Shell switcher student vs admin |
| `MainContent` | `components/MainContent.tsx` | Padding for bottom nav / sidebar |
| `Sidebar` | `components/Sidebar.tsx` | Nav links; `studentMode` prop |
| `Topbar` | `components/Topbar.tsx` | Hamburger + title |
| `AttendanceCalendar` | `components/AttendanceCalendar.tsx` | Calendar + mark modal; `variant: 'default' \| 'student'` |
| `ui.tsx` | `components/ui.tsx` | Shared buttons, inputs, cards |
| `Spinner` | `components/Spinner.tsx` | Loading |
| `RoutePrefetcher` | `components/RoutePrefetcher.tsx` | Link prefetch |
| `KeepAlivePing` | `components/KeepAlivePing.tsx` | Periodic API ping (cold start) |
| `PWARegistration` | `components/PWARegistration.tsx` | SW register |
| `ClientInserts` | `components/ClientInserts.tsx` | Client-only inserts |

### Student (`components/student/`)

| Component | Purpose |
|-----------|---------|
| `StudentDashboard.tsx` | Main student home: calendar, stats, pull-to-refresh |
| `StudentMonthDetails.tsx` | List view of month records |
| `AttendanceSummaryCard.tsx` | Present / mess cut / partial counts |
| `AttendanceLegend.tsx` | Color legend |
| `BottomNav.tsx` | Mobile tab bar |
| `StudentTopBar.tsx` | Mobile header + menu |
| `StudentDrawer.tsx` | Slide-out links |
| `StudentPageWrap.tsx` | Consistent page padding/title |
| `PullToRefresh.tsx` | PTR wrapper |
| `Skeleton.tsx` | `CalendarSkeleton`, etc. |

---

## 13. Hooks, Context & API Client

### `context/AuthContext.tsx`

| Export | Purpose |
|--------|---------|
| `AuthProvider` | `isLoggedIn`, `user`, `loading`, `logout`, `refreshUser`, `updateUserFromToken` |
| `useAuth()` | Full context |
| `useCurrentUser()` | `user` only |

Init: `GET /api/auth/me` if token in `localStorage`. Listens `storage` + `authStateChanged`.

### `hooks/useApi.ts` — React Query

| Hook | Query key | Endpoint |
|------|-----------|----------|
| `useUser` | `['user']` | GET `/api/auth/me` |
| `useAttendance(month)` | `['attendance', month]` | GET `/api/attendance/month?month=` |
| `useAttendanceSummary(date)` | `['attendanceSummary', date]` | GET admin summary |
| `useMessBills` | `['messBills']` | GET `/api/mess-bill` |
| `useNotifications` | `['notifications']` | GET `/api/notifications` |
| `useUsers(enabled)` | `['users']` | GET `/api/auth/users` |
| `useMarkAttendance` | mutation | POST `/api/attendance/mark` |
| `useCreateUser` | mutation | POST `/api/auth/register` |
| `useCreateMessBill` / `useDeleteMessBill` | mutation | mess-bill CRUD |
| `useCreateNotification` / `useDeleteNotification` | mutation | notifications CRUD |

### `utils/api.ts` — `ApiClient`

- Singleton: `export const api`
- Methods: `get`, `post`, `put`, `delete`, `download` (blob)
- Skips CSRF for `/api/auth/*`
- Auto refresh on 401, CSRF retry on 403

### Other utils

| File | Purpose |
|------|---------|
| `utils/attendanceStats.ts` | `getDayStatus`, `computeMonthStats` |
| `utils/logger.ts` | Dev logging wrapper |
| `utils/validation.ts` | Frontend form validation helpers |
| `utils/useForm.ts` | Form state helper |
| `constants/attendanceStatus.ts` | Colors, `getStudentDayAppearance` |
| `constants/months.ts` | Month labels for selects |

---

## 14. Types & Shared Constants

**File:** `frontend/src/types/index.ts`

```ts
User { userId, name, email, role, yearOfStudy?, roomNumber? }
AttendanceRecord { date, meals: { morning, noon, night } }
AttendanceSummary { date?, summary, details }
AttendanceSummaryDetail { name, email?, morning?, noon?, night?, morningAbsent?, ... }
MessBill { _id, month, year, previewUrl, url }
Notification { _id, title, message?, pdfUrl, type?, createdAt }
```

Backend has no TypeScript — keep these interfaces aligned manually with controllers/services.

---

## 15. PWA & Offline

| Asset | Path |
|-------|------|
| Service worker | `frontend/public/sw.js` (cache `mh-app-v3`) |
| Manifest | `frontend/public/manifest.json` |
| Offline fallback | `frontend/public/offline.html` |
| Registration | `components/PWARegistration.tsx` |

SW caches: `/`, `/login`, manifest, logos. API requests use network-first strategy (see full `sw.js`).

---

## 16. Scripts & Tests

| Item | Path | Command |
|------|------|---------|
| Backend dev | — | `cd backend && npm run dev` |
| Frontend dev | — | `cd frontend && npm run dev` |
| Bulk user import | `backend/scripts/bulkUserImport.js` | Run with `.env`; reads XLSX, emails passwords |
| Backend tests | `backend/src/routes/attendance.test.js` | Jest (limited) |
| Frontend tests | `components/AttendanceCalendar.test.tsx` | `npm test` in frontend |
| Bundle analyze | — | `cd frontend && npm run analyze` |

---

## 17. Conventions & Where to Change What

| Task | Go to |
|------|--------|
| New API endpoint | `routes/*.js` → `validators/*.js` → `controllers/*.js` → `services/*.js` |
| Change attendance rules | `config/index.js`, `utils/dateUtils.js`, `services/attendanceService.js`, mirror `NEXT_PUBLIC_*` in frontend calendar |
| Change auth / tokens | `services/authService.js`, `middleware/auth.js`, `AuthContext.tsx`, `api.ts` |
| Add admin page | `frontend/src/app/dashboard/...`, link in `Sidebar.tsx` |
| Add student tab | `BottomNav.tsx`, `StudentDrawer.tsx`, `Sidebar.tsx` (`studentDesktopLinks`) |
| New React Query hook | `hooks/useApi.ts` + `queryKeys` |
| Error messages | `constants/errors.js` (backend), map in `errorHandler.js` |
| Env documentation | `README.md` + this file §4 |
| Styling / theme | `globals.css` CSS variables |
| Public content (rules, home) | `app/rules/page.tsx`, `app/page.tsx` |

**Import aliases (frontend):** `@/` → `src/` (tsconfig paths)

**Admin vs student on dashboard:** `app/dashboard/page.tsx` branches on `user?.role === 'student'` → renders `StudentDashboard`.

---

## 18. Known Issues & Future Work

### Resolved since original review

| Item | Status |
|------|--------|
| Deprecated `csurf` | **Fixed** — custom Double Submit Cookie in `middleware/csrf.js` |
| Business logic in routes | **Fixed** — controller + service layer |
| Manual input validation | **Fixed** — Zod in `validators/` |
| Hardcoded attendance rules | **Fixed** — `config/index.js` + env vars |
| Fragile date math | **Improved** — `date-fns` in `utils/dateUtils.js` |

### Remaining recommendations

| Priority | Item | Location / notes |
|----------|------|------------------|
| Medium | Backend still JavaScript | No shared DTOs with frontend; consider TS migration |
| Medium | Frontend/backend env sync | `ATTENDANCE_*` must match on both sides |
| Low | `helmet` CSP `unsafe-inline` styles | `index.js` — consider nonces |
| Low | `framer-motion` / `react-icons` bundle size | Use `LazyMotion`; named icon imports |
| Low | Some pages bypass `api.ts` | `forgot-password`, `reset-password`, `monthly-report` use axios/fetch directly |
| Low | Backend `npm test` script | Still placeholder; Jest config exists |
| Info | Mess bills / notifications GET are **public** | By design; no auth on list endpoints |

### Quick debugging checklist

1. **401 on API:** Token expired → check refresh cookie + `/api/auth/refresh`
2. **403 on POST:** CSRF mismatch → call `/api/csrf-token`, ensure `credentials: 'include'`
3. **CORS error:** Add frontend origin to `FRONTEND_URL`
4. **Deadline errors:** Server uses UTC; compare with `dateUtils.calculateDeadline`
5. **Admin 403:** User `role` must be `admin` in JWT / DB

---

*Last updated: reflects post-refactor architecture (controllers, services, Zod, date-fns, custom CSRF, student mobile UI). When adding features, update the relevant section here first.*
