// Centralized configuration
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
if (process.env.MESS_BILL_STORAGE_PROVIDER === 'google-drive') {
  requiredEnvVars.push('GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN');
}
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

const config = {
  // Server
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  mongodbUri: process.env.MONGODB_URI,
  
  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtAccessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
  jwtRefreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
  
  // CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Email (password reset). Gmail: use an App Password, not your normal password.
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '465', 10),
  smtpSecure:
    process.env.SMTP_SECURE === 'true'
      ? true
      : process.env.SMTP_SECURE === 'false'
        ? false
        : parseInt(process.env.SMTP_PORT || '465', 10) === 465,
  
  // Attendance Business Rules
  attendanceDeadlineHour: parseInt(process.env.ATTENDANCE_DEADLINE_HOUR || '19', 10),
  attendanceWindowDays: parseInt(process.env.ATTENDANCE_WINDOW_DAYS || '7', 10),
  
  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  authRateLimitMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10', 10),
  attendanceRateLimitMax: parseInt(process.env.ATTENDANCE_RATE_LIMIT_MAX || '20', 10),
  
  // Request Body Limits
  jsonBodyLimit: process.env.JSON_BODY_LIMIT || '1mb',

  // Optional display label for current academic year (e.g. "2025-2026")
  academicYear: process.env.ACADEMIC_YEAR || null,

  // Mess bill file storage (local filesystem)
  messBillStorageDir: process.env.MESS_BILL_STORAGE_DIR || 'uploads/mess-bills',

  // Google Drive & Provider configuration
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || 'https://developers.google.com/oauthplayground',
  storageProvider: process.env.MESS_BILL_STORAGE_PROVIDER || 'local',

  // Mess bill reminders (cron)
  messBillReminderCron: process.env.MESS_BILL_REMINDER_CRON || '0 9 * * *',
  messBillReminderTimezone: process.env.MESS_BILL_REMINDER_TZ || 'Asia/Kolkata',
  messBillUploadMaxMb: parseInt(process.env.MESS_BILL_UPLOAD_MAX_MB || '10', 10),

  // VAPID keys for Web Push
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
  vapidSubject: process.env.VAPID_SUBJECT || 'mailto:gecskp.menshostel@gmail.com',
};

module.exports = config;




