# Changelog

All notable changes to the **MH App** project will be documented in this file.

---

## [2.0.1] - 2026-06-08

### Added
* **Google Drive Bill Storage Integration**: Replaced local storage with automated Google Drive API upload pipelines. Bills are structured by `MH App Bills/Year/Month/` folders and permissions are automatically managed.
* **Progressive Web App (PWA) Support**: Added service worker caching, manifest definitions, install options, offline fallback pages, and install metric logging.
* **Centralized Backend Versioning**: Added `backend/src/constants/version.js` and updated base endpoint `GET /` to display current API version.
* **Unit Test Coverage**: Added services tests in `backend/src/services/` to verify Year-End Reset databases sweeps and Mess Bill Reminder boundaries calculations.

### Fixed
* **Production Cross-Site Cookies Policy**: Configured `SameSite=None` and `Secure=true` dynamically for production environments to avoid Vercel-Render domain blocking while preserving local development capability.
* **Timezone Independent Reminders**: Refactored `messBillReminderService.js` to compute daily reminder ranges using Indian timezone offsets (`Asia/Kolkata`), solving host server local-clock timezone mismatches.
* **Attendance Deadline Slippage**: Synchronized client calendar checking bounds inside `AttendanceCalendar.tsx` using UTC Date arithmetic matching backend logic.
* **Database Resets Orphan Sweep**: Added database sweeping scripts removing push subscriptions, notification state collections, and metrics upon Year-End Resets.
* **Admin Sidebar Settings Link**: Added Settings nav option to desktop layout sidebar.

---

## [1.0.0] - 2026-04-12
* Initial full-stack implementation of hostel mess management application.
* Standardized controllers, services, database models, and in-app notifications dispatches.
