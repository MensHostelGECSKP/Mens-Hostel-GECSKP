# Release Notes — MH App v2.0.2

We are pleased to announce the release of **MH App v2.0.2** for Government Engineering College Sreekrishnapuram (GECSKP) Men's Hostel.

This release focuses on correcting mess cut cutoff time enforcement in Indian Standard Time (IST) and aligning versioning across the entire application stack.

---

## 🐛 Bug Fixes & Enhancements

### 1. Mess Cut Cutoff Time Logic
* **IST Timezone Cutoff Enforcement**: Fixed the deadline calculation in backend `dateUtils.js` and frontend `AttendanceCalendar.tsx`.
* **Cutoff Hour**: `ATTENDANCE_DEADLINE_HOUR` (default `19` = 7:00 PM) is now interpreted strictly in Indian Standard Time (`Asia/Kolkata`, UTC+5:30) on the calendar day prior to the requested attendance date.
* **Resolution**: Previously, `19:00 UTC` was computed as `00:30 AM IST` after midnight on the target date, allowing users to mark cuts anytime during the preceding day. The cutoff now correctly locks marking at 7:00 PM IST on the day before.

### 2. Version Alignment & UI Sync
* **Centralized Versioning**: Updated versions across `backend/package.json`, `frontend/package.json`, `backend/src/constants/version.js`, `frontend/src/constants/appConfig.ts`, and `CHANGELOG.md` to `2.0.2`.
* **Dynamic UI Version Display**: Refactored user-facing screens (`What's New` page and `Checklist` audit page) to dynamically source the active application version from `appConfig.version`.

---

## 🧪 Verification & Health Check
* **Backend Tests**: 5 test suites (20 tests) passed successfully.
* **Frontend Tests**: 1 test suite (2 tests) passed successfully.
