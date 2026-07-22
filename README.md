# MH App v2.0.2 — Mess Management Web App

## Overview
A modern, full-stack, and PWA-enabled web application for managing hostel mess attendance, meal cuts, notifications, and billing, designed specifically for the Government Engineering College Sreekrishnapuram (GECSKP) Men's Hostel.

---

## 🚀 Key Features

* **Student Module**:
  * Visual calendar dashboard for logging mess cuts (absence marking) for specific meals (Morning, Noon, Night).
  * Real-time attendance statistics (Present Days calculation).
  * Mess bills view and payment status marking.
  * Localized in-app notifications and push updates.
  * PWA support for mobile homescreen installation and offline mode.

* **Admin Module**:
  * Centralized management dashboard with real-time operational metrics.
  * Student user account management, including bulk imports via Excel spreadsheets.
  * Mess bill publishing and automated Asia/Kolkata due date reminders.
  * Automated database and storage cleaning via the Year-End Reset utility.
  * PDF and Excel reports generation for mess cuts and monthly reviews.
  * Complete audit logs tracking system state mutations.

* **Google Drive Integration**:
  * Automatically uploads mess bill PDFs to Google Drive using the Google Drive API.
  * Organizes files dynamically by Year and Month folders (e.g. `MH App Bills/2026/June/`).
  * Features secure document link sharing and automated cleanup pipelines.

* **Authentication & Security**:
  * Double Submit Cookie pattern CSRF protection.
  * Secure JWT authentication using HttpOnly Refresh Cookies.
  * Dynamic SameSite production configuration for seamless cross-site hosting.

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 16 (React 19, TypeScript), Tailwind CSS 4, React Query v5
* **Backend**: Node.js, Express, MongoDB (Mongoose ODM), Web-Push
* **File Storage**: Google Drive API (via automated oauth2 refresh flow)
* **Design**: HSL CSS color systems, modern typography (Manrope), smooth micro-animations

---

## ⚙️ Environment Variables (`backend/.env`)

Create a `.env` file in the `backend/` directory:

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGODB_URI` | **Yes** | — | MongoDB Atlas / local connection string |
| `JWT_SECRET` | **Yes** | — | Signing secret for access tokens |
| `JWT_REFRESH_SECRET` | **Yes** | — | Signing secret for HttpOnly refresh cookies |
| `PORT` | No | `5000` | Port for Express server |
| `NODE_ENV` | No | `development` | Environment mode (`development` or `production`) |
| `FRONTEND_URL` | No | `http://localhost:3000` | CORS permitted origins (comma-separated list) |
| `EMAIL_USER` | No | — | Gmail / SMTP email for sending password resets |
| `EMAIL_PASS` | No | — | Gmail App password (2-Step Verification required) |
| `MESS_BILL_STORAGE_PROVIDER` | No | `local` | Storage provider (`google-drive` or `local`) |
| `GOOGLE_CLIENT_ID` | Conditional | — | Google OAuth Client ID (required for `google-drive`) |
| `GOOGLE_CLIENT_SECRET` | Conditional | — | Google OAuth Client Secret (required for `google-drive`) |
| `GOOGLE_REDIRECT_URI` | No | Playground | OAuth redirect URI (default: google oauth playground) |
| `GOOGLE_REFRESH_TOKEN` | Conditional | — | Google OAuth Refresh Token (required for `google-drive`) |
| `MESS_BILL_REMINDER_TZ` | No | `Asia/Kolkata` | Timezone for due date reminders |
| `ATTENDANCE_DEADLINE_HOUR` | No | `19` | Hour (in IST) of the previous day to lock marking (19:00 IST = 7:00 PM IST / 13:30 UTC) |
| `ATTENDANCE_WINDOW_DAYS` | No | `7` | Days in advance attendance can be logged |
| `VAPID_PUBLIC_KEY` | No | — | Web Push VAPID public key (auto-generated in dev if blank) |
| `VAPID_PRIVATE_KEY` | No | — | Web Push VAPID private key (auto-generated in dev if blank) |
| `VAPID_SUBJECT` | No | mailto | VAPID contact email header |

---

## 📦 Getting Started

### 1. Installation

Install dependencies in both directories:
```bash
# Install frontend packages
cd frontend
npm install

# Install backend packages
cd ../backend
npm install
```

### 2. Running Locally

Start the development environments:
```bash
# Run backend server (starts on port 5000)
cd backend
npm run dev

# Run frontend Next.js dev server (starts on port 3000)
cd frontend
npm run dev
```

Visit `http://localhost:3000` to access the application.

---

## 📈 Bulk User Import

To onboard students in bulk, admins can import an Excel spreadsheet (.xlsx) from the **Settings / Manage Users** panel. 

The sheet must contain the following columns in row 1:
1. **Name**: The full name of the student.
2. **Year** or **Year Of Study**: Year of study (e.g. `1`, `2`, `3`, `4`).
3. **Room Number**: Hostel room number (e.g. `104`).
4. **Email**: The unique student email address (used for logging in).

Import flow:
1. The backend validates the full spreadsheet first.
2. Valid rows are imported one at a time.
3. After each user is created, the welcome email is attempted immediately before moving to the next row.
4. Email failures do not stop later rows from being processed.
5. The completion summary shows imported, skipped, failed, email sent, email failed, and per-row results.

The local Python wrapper uses the same backend import service, so admin UI imports and local imports behave the same way.

---

## 🧹 Academic Year-End Reset

The **Year-End Reset** cleans up database operational data to prepare the system for the next academic year.
* **Deleted data**: Student accounts, attendance calendars, mess cut records, notification logs, bill payments.
* **Preserved data**: Admin credentials, audit log history, system settings.
* **Google Drive option**: If checked, the script recursively purges the `MH App Bills` directory in the configured Google Drive account.
* **Auxiliary collection sweeps**: Purges related push subscription endpoints, metrics, and notification states to prevent database bloat.