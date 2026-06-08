# Release Notes — MH App v2.0.1 (Final Release)

We are proud to announce the final release of **MH App v2.0.1**, a major update designed for Government Engineering College Sreekrishnapuram (GECSKP) Men's Hostel. This release brings a complete modern overhaul of student and administrator views, automated cloud storage integrations, PWA capabilities, and enterprise-grade security hardening.

Below is a detailed summary of the features and improvements included in this release.

---

## 🚀 Key Features

### 1. Student Dashboard Redesign
* **Modern Interface**: Replaced the legacy view with a dashboard optimized for mobile devices.
* **Live Stats**: Real-time tracking of present days, logged cuts, and active status.
* **Zoned Calendar**: A simple visual calendar utilizing timezone-zoned date boundaries for locking/marking mess cuts without layout shifts.

### 2. Admin Dashboard Redesign
* **Operational Overview**: Centralized metrics showing active mess cut counts and recent resident updates.
* **Quick Access Grids**: Faster access to billing, user registration, and report exports.
* **Audit Logs Feed**: In-app timeline showcasing administrative changes for enhanced transparency.

### 3. Bulk User Import
* **Spreadsheet Ingestion**: Standardized parsing of `.xlsx` files using `exceljs` and `xlsx` packages to onboard hundreds of residents at once.
* **Column Validation**: Auto-validates columns for name, email, year of study, and room number.
* **Welcome Email Dispatch**: Automatically generates secure passwords and dispatches them to students on successful import.

### 4. Monthly Reports
* **Flexible Filtering**: Select custom ranges or select all days in a month.
* **Detailed Exports**: Generates comprehensive Excel reports detailing student names, attendance counts, and mess cut summaries for verification.

### 5. Mess Bill Management
* **Status Tracking**: Easily upload new bills, mark them as Paid or Unpaid, and track overall collection progress.
* **Automated Reminders**: Built-in system to trigger daily notifications and emails in Indian Standard Time (`Asia/Kolkata`) prior to due dates.

### 6. Google Drive Storage Integration
* **Cloud Storage**: Bill PDFs are programmatically uploaded to Google Drive.
* **Automatic Folder Organization**: Files are structured dynamically by `/Year/Month/` folders (e.g. `MH App Bills/2026/June/bill.pdf`).
* **Reader Permissions**: Programmatically updates document sharing permissions to allow readers instant downloading without sign-in barriers.

### 7. Year-End Reset
* **Transactional Cleanup**: Purges student accounts, attendance histories, notice items, and billing data in a single transactional step.
* **Google Drive Purge**: Includes an option to recursively clean out the configured `MH App Bills` folder.
* **Safety Lock**: Requires typing a validation safety phrase (`RESET_DATABASE`) to prevent accidental deletion.

### 8. Progressive Web App (PWA) Support
* **Mobile Home Screen**: Installable as a standalone app on iOS and Android.
* **Service Worker Caching**: Caches shell layouts and assets for instantaneous loads.
* **Offline Fallback**: Features a dedicated offline page and status warning banners when connection is lost.

---

## 🛠️ Performance & Security Fixes

### 9. Performance Improvements
* Next.js App Router route-caching optimization.
* Bundle size cleanup and image assets compression.
* Minimized MongoDB queries for attendance checks using index optimization.

### 10. UI Consistency Improvements
* Standardized HSL CSS variables for a premium visual aesthetic.
* Cohesive skeleton loaders for dashboards and calendar states to prevent layout shifts.
* Smooth micro-animations using `framer-motion`.

### 11. Production Readiness Fix Pack
* **Double-Submit CSRF Middleware**: Replaced external libraries with custom secure middleware.
* **Secure JWT Cookies**: Configured HttpOnly refresh token cookies with `SameSite=None` and `Secure=true` in production environment.
* **Zoned Timezone Dates**: Replaced local-clock date matching with standardized IST date manipulation.
