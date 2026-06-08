# MH App v2.0.1 — Frontend (Next.js)

This directory contains the user interface of the hostel mess management application built using **Next.js 16**, **React 19**, and **Tailwind CSS 4**.

---

## 🛠️ Technology Stack

* **Framework**: Next.js 16 (App Router)
* **Library**: React 19
* **State Management & Caching**: TanStack React Query v5
* **Styling**: Tailwind CSS 4 (using CSS-based `@import "tailwindcss"` configuration)
* **PDF Reports**: `jspdf` & `jspdf-autotable`
* **Icons**: `react-icons/hi2` (Heroicons)
* **Animations**: `framer-motion`

---

## ⚙️ Local Environment Configuration (`.env.local`)

Create a `.env.local` file in this directory with the following variables:

```env
# URL pointing to the backend API server
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000

# Window constraints matching backend configuration (in days)
NEXT_PUBLIC_ATTENDANCE_WINDOW_DAYS=7

# UTC hour representing daily mark lock (e.g. 19 = 19:00 UTC / 12:30 AM IST)
NEXT_PUBLIC_ATTENDANCE_DEADLINE_HOUR=19
```

---

## 📦 Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
Build the optimized bundle:
```bash
npm run build
npm start
```

---

## 📱 Progressive Web App (PWA) Support

This application is configured as a installable PWA for mobile devices:
* **Service Worker** (`public/sw.js`): Handles network-first caching strategies for shell pages and static resources.
* **Manifest** (`public/manifest.json`): Configures color tokens, app icons, and screen layout behaviors.
* **Offline Page** (`public/offline.html`): Displayed if the device is offline and requested page isn't in cache.
* **PWA Register** (`components/PWARegistration.tsx`): Programmatically handles service worker installation and registers click metrics.

---

## 📂 Key UI Components

* **AttendanceCalendar** (`src/components/AttendanceCalendar.tsx`): Renders the student and admin calendar layout using UTC-exact date math.
* **Sidebar** (`src/components/Sidebar.tsx`): Desktop navigation links with dynamic roles support (`student` or `admin`).
* **SettingsView** (`src/components/admin/settings/SettingsView.tsx`): Direct access to the release checklist and year-end database reset views.
* **StudentDashboard** (`src/components/student/StudentDashboard.tsx`): Displays present days, attendance summaries, and mess calendars with pull-to-refresh action.

---

## 🏷️ Version Config

The frontend version number is centrally defined at [appConfig.ts](file:///c:/Learn%20Webdevelopment/MH%20App/frontend/src/constants/appConfig.ts). All pages, PDFs, and drawer footers inherit their version and build indicators from this metadata object.