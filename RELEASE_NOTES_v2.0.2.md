# Release Notes — MH App v2.0.2

We are pleased to announce the **improved release of MH App v2.0.2** for Government Engineering College Sreekrishnapuram (GECSKP) Men's Hostel.

This release consolidates a series of significant bugfixes, reliability improvements, and new features on top of the IST timezone fix that was the original focus of this version.

---

## 🐛 Bug Fixes

### 1. Mess Cut Cutoff Time Logic (Original Fix)
* **IST Timezone Cutoff Enforcement**: Fixed the deadline calculation in `backend/src/utils/dateUtils.js` and `frontend/src/components/AttendanceCalendar.tsx`.
* **Cutoff Hour**: `ATTENDANCE_DEADLINE_HOUR` (default `19` = 7:00 PM) is now interpreted strictly in Indian Standard Time (`Asia/Kolkata`, UTC+5:30) on the calendar day prior to the requested attendance date.

### 2. IST Window Boundary Bug (Improved Fix)
* **Root cause**: During the window of 12:00 AM–5:30 AM IST, the server's UTC clock still reads the prior calendar day. The previous fix correctly handled the cutoff hour but left `isWithinWindow` still computing "today" from the raw UTC clock.
* **Fix**: Added a `getISTToday()` utility to `dateUtils.js` that applies the IST offset (+5:30) before extracting the calendar date, anchoring the max-markable window to the correct IST day.
* **Frontend sync**: `isMarkable()` in `AttendanceCalendar.tsx` is updated with the same IST-offset computation.

### 3. Global Over-Sanitization / Input Corruption
* **Root cause**: The global `sanitizeBody` middleware was calling `validator.escape()` on every string in `req.body`. This HTML-encodes characters like `'`, `/`, `<`, `>`, and `&` into XML entities (`&#x27;`, `&#x2F;`, etc.).
* **Impact**: Student names with apostrophes (e.g., `D'Souza` stored as `D&#x27;Souza`), URLs in notification PDF links (rendered unclickable), and passwords were corrupted at the storage layer.
* **Fix**: Replaced `validator.escape()` with `validator.stripLow(str, true)` in `sanitize.js`. This removes control characters only (invisible / non-printable bytes that have no valid use in user input) without HTML-encoding normal text.
* **Security**: No regression — Mongoose parameterised queries prevent NoSQL injection, and React's JSX auto-encodes any value at render time to prevent XSS.

### 4. Login Page React Hooks Ordering
* Fixed a React Hooks rules violation where `useForm` was called conditionally after an early return, causing a rendering error on some browsers.

---

## ✨ New Features & Improvements

### 5. Mess Bill Storage Fallback Mechanism
* If the configured **Google Drive** provider fails (e.g., expired OAuth refresh token), the service automatically falls back to **local disk storage** with a clear diagnostic warning in the server log.
* Additional MIME types are now accepted for bill uploads (includes common document formats beyond PDF).

### 6. Admin Manual Reminder Trigger
* Admins can now **manually trigger** mess bill payment reminders from the dashboard, without waiting for the nightly cron job.

### 7. Automated Payment Record Sync
* When a new mess bill is published, the system automatically creates `MessBillPayment` records for **all currently active students** who do not yet have one, ensuring no student is missed in reminder cycles.

### 8. MongoDB Atlas IP Whitelist Diagnostics
* Added a detailed startup diagnostic in `backend/src/index.js` that detects MongoDB Atlas IP access-list rejections and prints step-by-step remediation instructions, significantly reducing deployment debug time.

---

## 📦 Dependency Security Patches
Updated all packages to their latest patch versions:

| Package | Update |
|---------|--------|
| React + React DOM | `19.2.6` → `19.2.8` |
| Next.js | `16.2.6` → `16.2.11` |
| Mongoose | `8.24.0` → `8.24.1` |
| Multer | `2.1.1` → `2.2.0` |
| Nodemailer | `7.0.13` → `9.0.3` |
| node-cron | `4.2.1` → `4.6.0` |
| Helmet | `8.1.0` → `8.3.0` |
| express-rate-limit | `8.5.2` → `8.6.0` |
| date-fns | `4.2.1` → `4.4.0` |

---

## 🧪 Verification & Health Check
* **Backend Tests**: 5 test suites (20 tests) passed successfully after all changes.
* **Frontend Tests**: 1 test suite (2 tests) passed successfully.
* **Frontend Build**: TypeScript compilation and production build (`next build`) completed with zero errors across all 23 routes.
