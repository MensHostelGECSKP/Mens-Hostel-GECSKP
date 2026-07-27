# MH App — Codebase Index & Reference

> **Purpose:** Single source of truth for AI agents and developers. Read this file first before searching the repo. It maps architecture, files, APIs, types, env vars, and conventions as of the latest release (controller–service layer, Zod validation, custom CSRF, student mobile UI, Google Drive bill storage integration, PWA).

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
18. [Resolved Issues & Technical Polish](#18-resolved-issues--technical-polish)

---

## 1. Project Summary

| Field | Value |
|-------|--------|
| **Name** | MH App — Mess Management Web App |
| **Version** | v2.0.2 (Production Release) |
| **Org** | Men's Hostel, GEC Sreekrishnapuram (GECSKP) |
| **Roles** | `student`, `admin` |
| **Core features** | Mess cut attendance calendar, admin daily summary & monthly reports, mess bills (Google Drive PDF storage), notifications (global broadcast + Web Push dispatches), user management, year-end reset |
| **Monorepo** | `frontend/` (Next.js 16 + TS) + `backend/` (Express + JS) |
| **Default ports** | Frontend `3000`, Backend `5000` |

**Meal model:** Each day has `{ morning, noon, night }` booleans. `true` = present (eating), `false` = absent (mess cut for that meal). Full mess cut = all three `false`.

---

## 2. Repository Layout

```
MH App/
├── README.md
├── codebase_review.md          ← this file
├── CHANGELOG.md                ← release changelog
├── .eslintrc.json
├── backend/
│   ├── package.json
│   ├── jest.config.js
│   ├── scripts/
│   │   ├── bulkUserImport.js   # Official JavaScript XLSX import script
│   │   └── dbCheck.js          # DB Aggregate check script
│   └── src/
│       ├── index.js              # Express app entry, middleware stack, route mounting
│       ├── config/index.js       # Env validation + centralized config
│       ├── constants/
│       │   ├── errors.js         # ERROR_MESSAGES, ERROR_CODES
│       │   └── version.js        # Centralized version source of truth ('2.0.1')
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
        │   └── appConfig.ts      # Centralized frontend version ('2.0.1')
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
| date-fns + date-fns-tz | Date parsing & timezone-independent due checks |
| googleapis | Google Drive oauth2 and storage provider APIs |
| validator | Body sanitization (`utils/sanitize.js`) |
| helmet, cors, compression, cookie-parser | Security & perf |
| express-rate-limit | Per-route limits |
| nodemailer | Password reset emails & credentials dispatches |
| exceljs, xlsx | Monthly report export (service) + bulk import |
| web-push | Browser Push Notification service |

**Note:** Backend is **JavaScript**, not TypeScript. No shared types package with frontend.

### Frontend (`frontend/package.json`)

| Package | Use |
|---------|-----|
| next 16, react 19 | App framework |
| @tanstack/react-query | Server state / caching |
| axios | Only on forgot/reset password pages |
| framer-motion | Home splash, animations |
| react-icons | Icons (tree-shake per import path) |
| react-hot-toast | Toasts (layout) |
| jspdf + jspdf-autotable | Admin PDF exports on dashboard |
| tailwindcss 4 | Styling |

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
| `EMAIL_USER`, `EMAIL_PASS` | No | — | Password reset & user welcome emails |
| `ATTENDANCE_DEADLINE_HOUR` | No | `19` | UTC hour on **day before** target date |
| `ATTENDANCE_WINDOW_DAYS` | No | `7` | Max days ahead students can mark |
| `MESS_BILL_STORAGE_PROVIDER`| No | `local` | `google-drive` or `local` storage provider |
| `GOOGLE_CLIENT_ID` | Conditional | — | OAuth Client ID (for `google-drive`) |
| `GOOGLE_CLIENT_SECRET` | Conditional | — | OAuth Client Secret (for `google-drive`) |
| `GOOGLE_REDIRECT_URI` | No | Playground | OAuth Redirect URI |
| `GOOGLE_REFRESH_TOKEN` | Conditional | — | OAuth Refresh Token (for `google-drive`) |
| `MESS_BILL_REMINDER_TZ` | No | `Asia/Kolkata` | Timezone for due reminders |

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

**Health:** `GET /` → `"Mess Management API v2.0.1 is running!"`

### 5.2 Layer Pattern

```
Route → [rateLimit] → [auth] → [adminOnly] → [csrfProtection] → Zod validate → Controller → Service → Model
```

- **Validated data:** `req.validated` (set by `utils/zodValidate.js`)
- **User from JWT:** `req.user` (`userId`, `role`, `name`, `email`, optional `yearOfStudy`, `roomNumber`)

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
| POST | `/login` | authLimiter, validateLogin | `{ email, password }` | `{ token, user }` + `refreshToken` HttpOnly cookie |
| POST | `/forgot-password` | authLimiter | `{ email }` | `{ message }` |
| POST | `/reset-password/:token` | authLimiter | `{ password }` | `{ message }` |
| POST | `/refresh` | — | cookie `refreshToken` | `{ token, user }` |
| GET | `/me` | auth | — | `{ user }` |
| POST | `/logout` | — | — | `{ message }` (clears refresh cookie) |
| GET | `/users` | auth, adminOnly | — | `{ users: User[] }` |
| PATCH | `/settings/notifications`| auth | `{ bills, announcements, system }` | `{ message, user }` |

### Attendance (`/api/attendance`)

| Method | Path | Middleware | Body / Query | Response |
|--------|------|------------|--------------|----------|
| POST | `/mark` | attendanceLimiter, auth, csrf, validate | `{ date: YYYY-MM-DD, meals: { morning, noon, night } }` | `{ message, attendance }` |
| GET | `/month` | auth, validate query | `?month=YYYY-MM` | `{ attendance: AttendanceRecord[] }` |
| GET | `/admin/summary` | auth, adminOnly | `?date=YYYY-MM-DD` | `{ date, summary: { morning, noon, night }, details: [...] }` |
| GET | `/admin/monthly-report` | auth, adminOnly | `?startDate&endDate` | Excel/blob (controller) |
| POST | `/admin/monthly-report` | auth, adminOnly | `{ dates: string[] }` | Excel/blob |

### Mess Bill (`/api/mess-bill`)

| Method | Path | Auth / Middlewares | Body / Params | Response |
|--------|------|--------------------|---------------|----------|
| POST | `/publish` | auth, adminOnly, csrf, uploadMessBillSingle, validatePublish | Form-Data: `{ month, year, dueDate, file }` | `201` `{ bill, notified }` |
| GET | `/` | auth | — | `{ bills }` |
| GET | `/:id` | auth | Params: `id` | `{ bill }` (with payment status) |
| GET | `/:id/view` | auth | Params: `id` | Redirects to Drive / sends file buffer |
| GET | `/:id/download` | auth | Params: `id` | Redirects to Drive content / sends file |
| PATCH | `/:id/payment` | auth, csrf, studentOnly, validatePayment | `{ isPaid }` | `{ messBillId, paymentStatus }` |
| DELETE | `/:id` | auth, adminOnly, csrf | Params: `id` | `{ message }` |

### Notifications (`/api/notifications`)

| Method | Path | Auth / Middlewares | Body / Params | Response |
|--------|------|--------------------|---------------|----------|
| GET | `/vapid-public-key`| auth | — | `{ vapidPublicKey }` |
| POST | `/subscribe` | auth | `{ endpoint, keys: { p256dh, auth } }` | `201` `{ subscription }` |
| POST | `/unsubscribe` | auth | `{ endpoint }` | `{ message }` |
| POST | `/` | auth, adminOnly, validateCreate | `{ title, message?, pdfUrl?, type? }` | `201` `{ notification }` |
| GET | `/` | auth | — | `{ notifications }` |
| PUT | `/:id/read` | auth | Params: `id` | `{ message }` |
| POST | `/read-all` | auth | — | `{ message }` |
| POST | `/metrics/:metricId/click`| Public | Params: `metricId` | `{ success }` |
| DELETE | `/:id` | auth | Params: `id` | `{ message }` |

---

## 7. Data Models (MongoDB)

### User (`models/User.js`)
* Schema: `{ name, email, password, role (student/admin), yearOfStudy, roomNumber, resetPasswordToken, resetPasswordExpires, notificationPreferences: { bills, announcements, system } }`

### Attendance (`models/Attendance.js`)
* Schema: `{ userId, date (YYYY-MM-DD), meals: { morning, noon, night } }`

### MessBill (`models/MessBill.js`)
* Schema: `{ month, year, dueDate, fileName, storageKey, mimeType, fileSize, storageProvider, uploadedBy, isPublished, fileId, viewUrl, downloadUrl }`

### MessBillPayment (`models/MessBillPayment.js`)
* Schema: `{ userId, messBillId, isPaid, paidAt, reminder3SentAt, reminder1SentAt }`

### Notification (`models/Notification.js`)
* Schema: `{ title, message, pdfUrl, type, messBillId, createdAt }`

### UserNotificationState (`models/UserNotificationState.js`)
* Schema: `{ userId, notificationId, isRead, readAt, isDismissed, dismissedAt }`

### PushSubscription (`models/PushSubscription.js`)
* Schema: `{ userId, endpoint, keys: { p256dh, auth } }`

### NotificationMetric (`models/NotificationMetric.js`)
* Schema: `{ notificationId, userId, endpoint, status (sent/delivered/clicked/failed), failureReason, sentAt, deliveredAt, clickedAt }`

---

## 8. Authentication & Security

### Token Flow
1. **Login**: Access token returned in JSON response (stored in `localStorage` by client). Refresh token stored as `HttpOnly` cookie.
2. **API Requests**: Sent with `Authorization: Bearer <token>` header.
3. **Cross-Site Cookie Configurations**: In production, cookies are issued with `SameSite=None` and `Secure=true`. In development, they use `SameSite=Lax` and `Secure=false` over HTTP.

### CSRF Protection
* Double Submit Cookie pattern: Cookie `csrf-token` matches custom header `X-CSRF-Token` sent by frontend `ApiClient`.

---

## 9. Attendance Business Rules

* **Date Format**: `YYYY-MM-DD` parsed as UTC midnight.
* **Marking Deadline**: Locks at `ATTENDANCE_DEADLINE_HOUR` UTC on the calendar day before the attendance date.
* **Marking Window**: From **yesterday** through **today + ATTENDANCE_WINDOW_DAYS**.

---

## 10. Frontend Index

### 10.1 App Layout (`app/layout.tsx`)
* Font: Manrope. Shell headers and routes automatically direct based on authenticated user role.

### 10.2 Sidebar & Drawer links
* Admin desktop layout includes Settings link directing to Release Checklist & Year-End Reset panels.

---

## 11. Scripts & Tests

* **Bulk User Import** (`backend/scripts/bulkUserImport.js`): Onboards students from `.xlsx` tables and mails passwords.
* **Database aggregate check** (`backend/scripts/dbCheck.js`): Queries record counts grouped by dates.
* **Zoned Time Verification** (`brain/../verify_tz.js`): Diagnostic script checking Indian timezone boundaries math.
* **Jest Unit Tests**: Unit tests implemented in `backend/src/services/` verifying core rules and Year-End Resets.

---

## 12. Resolved Issues & Technical Polish

* **Double Submit Cookie CSRF**: Replaced deprecated packages with robust custom validator.
* **Google Drive Bill Storage**: Automated oauth2 Drive API file dispatches replacing local filesystem storage.
* **Zoned India Time Reminders**: Removed host local-clock timezone reliance.
* **Production Cross-Site Cookies**: Resolved Vercel/Render hosting cookie blocker.
* **Auxiliary Collection Cleanups**: Prevented database bloat by removing metrics, states, and subscription records on resets.
