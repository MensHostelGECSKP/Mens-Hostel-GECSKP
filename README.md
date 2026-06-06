# Mess Management Web App for Men's Hostel

## Overview
A modern, full-stack web application for managing hostel mess attendance, meal cuts, and billing, designed for Government Engineering College Palakkad (Men's Hostel).

## Tech Stack
- Frontend: Next.js (React, TypeScript), Tailwind CSS
- Backend: Node.js, Express, MongoDB, JWT Auth

## Features
- Student and Admin roles
- Mess cut tracking with calendar interface
- Meal selection and absence marking
- Monthly reporting and billing
- Admin dashboard for user and announcement management

## Getting Started

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
npm run dev
```

#### Backend Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

**Required:**
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT access tokens
- `JWT_REFRESH_SECRET` - Secret key for JWT refresh tokens (must be different from JWT_SECRET)

**Optional (with defaults):**
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment mode: 'development' or 'production' (default: 'development')
- `FRONTEND_URL` - Frontend URL(s), comma-separated for multiple (default: 'http://localhost:3000')
- `EMAIL_USER` - Email address for sending password reset emails
- `EMAIL_PASS` - Email password/app password
- `JWT_ACCESS_TOKEN_EXPIRY` - Access token expiration (default: '15m')
- `JWT_REFRESH_TOKEN_EXPIRY` - Refresh token expiration (default: '7d')
- `ATTENDANCE_DEADLINE_HOUR` - Hour (UTC) when attendance deadline passes (default: 19)
- `ATTENDANCE_WINDOW_DAYS` - Number of days in advance attendance can be marked (default: 7)
- `RATE_LIMIT_WINDOW_MS` - Rate limit window in milliseconds (default: 900000 = 15 minutes)
- `RATE_LIMIT_MAX` - Max requests per window for general routes (default: 100)
- `AUTH_RATE_LIMIT_MAX` - Max requests per window for auth routes (default: 10)
- `ATTENDANCE_RATE_LIMIT_MAX` - Max requests per window for attendance routes (default: 20)
- `JSON_BODY_LIMIT` - Maximum JSON body size (default: '1mb')

**Mess bill uploads (Cloudflare R2):**

- `R2_ACCOUNT_ID` - Cloudflare account ID
- `R2_ACCESS_KEY_ID` - R2 API token access key
- `R2_SECRET_ACCESS_KEY` - R2 API token secret
- `R2_BUCKET_NAME` - R2 bucket name (e.g. `mh-mess-bills`)
- `R2_PRESIGNED_URL_EXPIRY` - Seconds before view/download links expire (default: 300)
- `MESS_BILL_STORAGE_PROVIDER` - `r2` (production) or `local` (dev without R2)
- `MESS_BILL_STORAGE_DIR` - Local fallback directory when provider is `local` (default: `uploads/mess-bills`)
- `MESS_BILL_UPLOAD_MAX_MB` - Max upload size in MB (default: 10)
- `MESS_BILL_REMINDER_CRON` - Cron schedule for due-date reminders (default: `0 9 * * *`)
- `MESS_BILL_REMINDER_TZ` - Timezone for reminders (default: `Asia/Kolkata`)

#### Cloudflare R2 setup (mess bills)

1. In the [Cloudflare dashboard](https://dash.cloudflare.com/), open **R2** and create a bucket (e.g. `mh-mess-bills`).
2. Create an **R2 API token** with read/write access to that bucket.
3. Add `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET_NAME` to `backend/.env`.
4. Files are stored under `mess-bills/YYYY/MM/` in the bucket. MongoDB stores metadata; students receive short-lived presigned URLs through the backend.
5. For local development without R2, omit the R2 variables — the backend falls back to local disk storage automatically.

## Logo
Add your college logo to `frontend/public/` and update the layout as needed.

---

For detailed documentation, see the respective `frontend/` and `backend/` folders. 