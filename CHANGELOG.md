# Changelog

All notable changes to the **MH App** project will be documented in this file.

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
