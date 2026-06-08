# MH App v2.0.1 — Backend (Express API)

This directory contains the Express REST API server of the hostel mess management application. It handles authentication, attendance marking logic, bill indexing, push notification dispatches, and system resets.

---

## 🛠️ Technology Stack

* **Server Framework**: Node.js, Express
* **Database & ODM**: MongoDB, Mongoose
* **Validation**: Zod (schemas inside `validators/` injected as Express middleware)
* **Authentication**: `jsonwebtoken` (JWT), `bcryptjs`
* **Date Manipulation**: `date-fns` and `date-fns-tz` (timezone-zoned boundary operations)
* **Web Push Notifications**: `web-push`
* **Emails**: `nodemailer`
* **Excel Processing**: `exceljs`, `xlsx`
* **Tests**: Jest, Supertest

---

## 📂 Project Directory Structure

```
backend/
├── package.json              # Version metadata & dependencies
├── jest.config.js            # Testing settings
├── scripts/
│   ├── bulkUserImport.js     # Standard JavaScript Excel student import script
│   └── dbCheck.js            # Mongoose aggregate diagnostic tool
└── src/
    ├── index.js              # Server entry point and middleware order
    ├── config/index.js       # Centralized config parsing and validation
    ├── constants/errors.js   # Consistent error code mapping
    ├── controllers/          # HTTP request handlers (controllers layer)
    ├── services/             # Core business and DB calculations (service layer)
    ├── routes/               # API endpoint routing and rate limit mapping
    ├── models/               # MongoDB models (User, Attendance, MessBill, etc.)
    ├── middleware/           # Auth, CSRF, and global error handling
    ├── validators/           # Zod schema definitions
    └── utils/                # Date and sanitization helpers
```

---

## 🔐 Authentication & Security Architecture

1. **Double Submit Cookie CSRF**:
   * Renders custom middleware in `middleware/csrf.js` replacing deprecated packages.
   * Generates a unique, non-HttpOnly CSRF token cookie (`csrf-token`) on request.
   * The client must attach the matching token value in the `X-CSRF-Token` header for state-changing requests.

2. **HttpOnly Refresh Cookies**:
   * Successful logins issue a short-lived access token JSON payload (15-minute TTL) and a long-lived refresh token (7-day TTL) as an `HttpOnly` cookie.
   * Cross-site deployments dynamically activate cookie flags based on `NODE_ENV === 'production'`:
     * **Production**: `SameSite=None`, `Secure=true`.
     * **Development**: `SameSite=Lax`, `Secure=false` (permits local HTTP localhost testing).

---

## 📅 Business Rules & Date Computations

* **Timezone Safety**: The cron job schedules due date checks in India Standard Time (`Asia/Kolkata`) using `date-fns-tz`. Day boundaries are computed in IST and queried on the MongoDB database as timezone-independent UTC timestamps.
* **Attendance Window**: Students can mark attendance for yesterday, today, and up to `ATTENDANCE_WINDOW_DAYS` in advance.
* **Attendance Deadline**: Marking for a specific day locks at `ATTENDANCE_DEADLINE_HOUR` UTC on the *previous* calendar day. For instance, a deadline hour of `19` locks attendance marking at 19:00 UTC (12:30 AM IST).

---

## 💾 Storage Integration (Google Drive API)

The mess bill files are saved automatically onto Google Drive by setting `MESS_BILL_STORAGE_PROVIDER=google-drive`.
* **Structure**: Dynamically creates a main directory `MH App Bills`, followed by year subfolders and month subfolders (e.g. `MH App Bills/2026/June/file.pdf`).
* **Permissions**: Access permissions are programmatically set to reader (`role: 'reader'`, `type: 'anyone'`) so student download links resolve instantly.
* **Fallback**: Omit Google Drive keys to automatically fall back to local disk storage (`uploads/mess-bills/`).

---

## 🚀 Running the API Server

### 1. Configure `.env`
Duplicate `.env.example` into `.env` and fill in your connection strings and oauth2 client credentials.

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Dev Server
```bash
npm run dev
```

### 4. Run Jest Test Suite
```bash
npx jest
```
