// backend/src/index.js
// Basic Express server setup for Mess Management Web App

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const { setCsrfToken, getCsrfToken } = require('./middleware/csrf');
const { errorHandler } = require('./middleware/errorHandler');
const { sanitizeBody } = require('./utils/sanitize');

const app = express();
const PORT = config.port;

// Trust proxy for rate limiting (needed for Render deployment)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Compression middleware
app.use(compression());

// Cookie parser middleware
app.use(cookieParser());

// Set CSRF token cookie for all requests
app.use(setCsrfToken);

const allowedOrigins = config.frontendUrl
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, server-side requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // Enable cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
};

// Middleware
app.use(cors(corsOptions));

// Handle preflight OPTIONS requests for all routes with the same options
app.options('*', cors(corsOptions));

// Parse JSON bodies with size limit
app.use(express.json({ limit: config.jsonBodyLimit }));

// Sanitize request bodies
app.use(sanitizeBody);

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later',
});

// Apply to all API requests
app.use('/api', apiLimiter);

// Test route
app.get('/', (req, res) => {
  res.send('Mess Management API is running!');
});

// CSRF token endpoint (GET only, no CSRF protection needed)
app.get('/api/csrf-token', (req, res) => {
  const token = getCsrfToken(req, res);
  res.json({ csrfToken: token });
});

// Auth routes
app.use('/api/auth', require('./routes/auth'));

// Attendance routes
app.use('/api/attendance', require('./routes/attendance'));

// Mess Bill routes
app.use('/api/mess-bill', require('./routes/messBill'));

// Notifications routes
app.use('/api/notifications', require('./routes/notification'));

// System management (admin)
app.use('/api/system', require('./routes/system'));

// Global error handler (must be last middleware)
app.use(errorHandler);

// Connect to MongoDB
mongoose.connect(config.mongodbUri, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => {
    console.log('Connected to MongoDB');
    const { startMessBillReminderJob } = require('./jobs/messBillReminders');
    startMessBillReminderJob();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`[config] Mess bill storage provider: ${config.storageProvider || 'local'}`);
  if (!config.emailUser || !config.emailPass) {
    console.warn(
      '[config] EMAIL_USER / EMAIL_PASS are not set — forgot-password will save reset tokens but cannot send email.'
    );
  }
});
