# Changelog

All notable changes to the **MH App** project will be documented in this file.

## [2.1.0] - 2026-10-26

### Fixed
* **Mobile Attendance & Mess Cut Marking**: Added `touch-manipulation` and user-select protection to attendance calendar day cells to eliminate tap lag on mobile browsers, and updated `handleMark` to present clear, descriptive server rejection reasons instead of generic failure toasts.
* **CSPRNG Temporary Password Generation**: Migrated `importService.generatePassword` from pseudo-random `Math.random()` to Node `crypto.randomBytes(12).toString('base64url')`.
* **Push Notification Dispatch Batching**: Replaced sequential blocking web push dispatches with chunked concurrent batches using `Promise.allSettled`, eliminating request timeouts when publishing announcements or mess bills.

---

## [2.0.3] - 2026-10-26

### Fixed
* **Authentication & Password Recovery**: Overhauled the forgot-password and reset-password flows with interactive strength evaluation, responsive feedback, and enhanced email delivery reliability.
* **IST Window Boundary & Sanitization**: Enforced consistent IST boundary checking for midnight-to-morning transitions and refined input sanitization without stripping valid punctuation in passwords, names, or URLs.

### Security & Dependencies
* **Patched Vulnerabilities**: Upgraded `nodemailer` to `10.2.1` and `zod` to `4.6.7` resolving high-severity advisories (GHSA-mrhx-c7xc-m3w5, GHSA-6vj9-mwq6-2f5v, and related).
* **Package Updates**: Upgraded `next` to `16.4.3`, `@tanstack/react-query` to `5.105.0`, `axios` to `1.20.0`, `mongoose` to `8.24.7`, `multer` to `2.5.0`, `express-rate-limit` to `8.7.1`, and `compression` to `1.8.2`.

---

## [2.0.2] - 2026-07-28

### Fixed
* **Mess Cut Cutoff Time Logic**: Fixed deadline calculation in backend `dateUtils.js` and frontend `AttendanceCalendar.tsx` to interpret `ATTENDANCE_DEADLINE_HOUR` (default `19` = 7:00 PM) strictly in Indian Standard Time (IST, UTC+5:30) on the previous calendar day instead of UTC, preventing users from marking cuts after 7:00 PM IST.
* **IST Window Boundary Bug**: Added `getISTToday()` helper to `dateUtils.js` to anchor the allowed marking window to the IST calendar date. Previously, during 12:00 AM–5:30 AM IST the UTC clock still read the prior day, causing the max-markable date to be off by one day. The same fix is mirrored in `AttendanceCalendar.tsx`.
* **Global Over-Sanitization**: Replaced `validator.escape()` with `validator.stripLow()` in `sanitize.js`. The previous implementation HTML-entity-encoded all strings on every request, corrupting stored passwords, names with apostrophes (e.g., `D'Souza`), URLs (slashes became `&#x2F;`), and Excel email templates. Security is preserved by Mongoose parameterised queries (NoSQL injection) and React auto-escaping (XSS).
* **Login Hook Call Order**: Fixed React Hooks rules violation on the Login page where hook calls were conditionally ordered.

### Added
* **Storage Fallback Mechanism**: Automatically falls back to local file storage if Google Drive upload fails (e.g., expired OAuth token), with a clear diagnostic warning. Expanded accepted upload MIME types.
* **Admin Manual Reminder Trigger**: Admins can now manually trigger mess bill payment reminders from the dashboard without waiting for the daily cron job.
* **Automated Payment Sync**: Automatically creates `MessBillPayment` records for newly added active students against existing published bills, ensuring no students are missed in reminder cycles.
* **MongoDB Atlas IP Diagnostics**: Added a clear startup diagnostic when a MongoDB Atlas IP whitelist error is detected, with step-by-step instructions to resolve it.

### Chores
* **Dependency Security Patches**: Updated React 19, Next.js 16, Mongoose 8, Multer 2, Nodemailer 9, node-cron 4, Helmet 8, express-rate-limit 8, and other packages to their latest patch versions.

---

## [2.0.1] - 2026-06-08

### Added
* **Student Dashboard Redesign**: Implemented a modern, responsive, and dynamic UI for students featuring real-time attendance statistics (Present Days calculations), simplified absent-marking calendars, and status badges.
* **Admin Dashboard Redesign**: Renders centralized management widgets showcasing active mess cut summaries, quick action grids, recent activity audit feeds, and automated PDF export reports.
* **Bulk User Import**: Standardized Express services to parse Excel spreadsheets (`.xlsx`), onboard hundreds of student accounts in batch, auto-generate passwords, and dispatch welcome credentials emails.
* **Monthly Reports**: Developed multi-criteria attendance aggregates exported to downloadable Microsoft Excel workbooks for mess cuts auditing.
* **Bill Management**: Created a flow for uploading, replacing, deleting, and marking paid/unpaid mess bills with automatic due date warnings.
* **Google Drive Bill Storage Integration**: Replaced local storage with automated Google Drive API upload pipelines. Bills are structured by `MH App Bills/Year/Month/` folders and permissions are automatically managed.
* **Academic Year-End Reset**: Implemented complete transactional resets that securely delete student accounts, attendances, notification records, auxiliary push endpoints, and clean Google Drive storage directories.
* **Progressive Web App (PWA) Support**: Added service worker caching, manifest definitions, install options, offline fallback pages, and install metric logging.
* **Centralized Versioning**: Established backend `version.js` and frontend `appConfig.ts` single sources of truth to display `2.0.1` throughout client footers, documents, and API base routes.

### Fixed & Optimized
* **Production Readiness Fix Pack**: Comprehensive validation sweep securing database indexes, input validations, cross-origin cookies policies (`SameSite=None`, `Secure=true`), and custom Double-Submit CSRF protection middleware.
* **Performance Improvements**: Integrated network-first route caching, bundle size optimizations, image asset sizing compression, and streamlined API querying minimizing redundant DB operations.
* **Timezone Zoned Reminders**: Computes mess bill daily reminder ranges in Indian Standard Time (`Asia/Kolkata`), resolving host server local-clock timezone mismatches.
* **Attendance Deadline Sync**: Synchronized client calendar checking bounds with backend deadline constraints using UTC Date calculations.

---

## [1.0.0] - 2026-04-12
* Initial full-stack implementation of hostel mess management application.
* Standardized controllers, services, database models, and in-app notifications dispatches.
