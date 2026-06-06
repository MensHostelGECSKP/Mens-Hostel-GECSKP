// backend/src/routes/auth.js
const express = require('express');
const { auth, adminOnly } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateUpdateUser,
} = require('../validators/authValidator');
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  refresh,
  getCurrentUser,
  logout,
  getAllUsers,
  updateUser,
  deleteUser,
} = require('../controllers/authController');

const router = express.Router();

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login or password reset attempts, please try again later',
});

// Register route (admin only)
router.post('/register', auth, adminOnly, validateRegister, register);

// Login route
router.post('/login', authLimiter, validateLogin, login);

// Forgot Password
router.post('/forgot-password', authLimiter, validateForgotPassword, forgotPassword);

// Reset Password
router.post('/reset-password/:token', authLimiter, validateResetPassword, resetPassword);

// Refresh token endpoint
router.post('/refresh', refresh);

// Get current user endpoint
router.get('/me', auth, getCurrentUser);

// Logout endpoint
router.post('/logout', logout);

// Get all users (admin only)
router.get('/users', auth, adminOnly, getAllUsers);

// Update / delete student (admin only)
router.patch('/users/:userId', auth, adminOnly, validateUpdateUser, updateUser);
router.delete('/users/:userId', auth, adminOnly, deleteUser);

module.exports = router; 