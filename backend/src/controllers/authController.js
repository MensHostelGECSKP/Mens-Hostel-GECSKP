const authService = require('../services/authService');
const config = require('../config');
const { ERROR_CODES } = require('../constants/errors');

/**
 * Register a new user (admin only)
 */
async function register(req, res, next) {
  try {
    const { name, email, password, role, yearOfStudy, roomNumber } = req.validated;
    await authService.registerUser({
      name,
      email,
      password,
      role,
      yearOfStudy,
      roomNumber,
    });
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    if (err.message === 'DUPLICATE_ENTRY') {
      return res.status(409).json({
        error: 'User already exists',
        code: ERROR_CODES.DUPLICATE_ENTRY,
      });
    }
    next(err);
  }
}

/**
 * Login user
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.validated;
    const user = await authService.authenticateUser(email, password);
    const { accessToken, refreshToken } = authService.createTokens(user);
    
    // Set refresh token as HttpOnly cookie
    const config = require('../config');
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json({
      token: accessToken,
      user: authService.formatPublicUser(user),
    });
  } catch (err) {
    if (err.message === 'INVALID_CREDENTIALS') {
      return res.status(400).json({
        error: 'Invalid credentials',
        code: ERROR_CODES.INVALID_CREDENTIALS,
      });
    }
    if (err.message === 'ACCOUNT_INACTIVE') {
      return res.status(403).json({
        error: 'This account has been deactivated. Contact the admin.',
        code: ERROR_CODES.ACCOUNT_INACTIVE,
      });
    }
    next(err);
  }
}

/**
 * Forgot password
 */
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.validated;
    const result = await authService.generatePasswordResetToken(email);

    if (result) {
      try {
        await authService.sendPasswordResetEmail(result.user, result.resetToken);
      } catch (err) {
        console.error('[forgot-password] Email not sent:', err.message, err.details || '');
        if (config.nodeEnv === 'development') {
          const hint =
            err.message === 'EMAIL_NOT_CONFIGURED'
              ? 'Set EMAIL_USER and EMAIL_PASS in backend/.env. For Gmail, create an App Password (Google Account → Security → 2-Step Verification → App passwords).'
              : `SMTP error: ${err.details || err.message}. Check EMAIL_USER/EMAIL_PASS and SMTP_HOST/SMTP_PORT if not using Gmail.`;
          return res.status(503).json({
            error: hint,
            code: ERROR_CODES.EMAIL_SEND_FAILED,
          });
        }
      }
    }

    res.json({ message: 'If your email is registered, you will receive a password reset link.' });
  } catch (err) {
    next(err);
  }
}

/**
 * Reset password
 */
async function resetPassword(req, res, next) {
  try {
    const { password } = req.validated;
    const token = req.params.token;
    await authService.resetPassword(token, password);
    res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    if (err.message === 'INVALID_TOKEN') {
      return res.status(400).json({
        error: 'Token is invalid or has expired.',
        code: ERROR_CODES.INVALID_TOKEN,
      });
    }
    next(err);
  }
}

/**
 * Refresh access token
 */
async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.cookies;
    
    if (!refreshToken) {
      return res.status(401).json({
        error: 'No refresh token provided',
        code: ERROR_CODES.NO_REFRESH_TOKEN,
      });
    }
    
    const decoded = authService.verifyRefreshToken(refreshToken);
    const user = await authService.getUserById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        error: 'Invalid refresh token',
        code: ERROR_CODES.INVALID_REFRESH_TOKEN,
      });
    }
    
    const { accessToken } = authService.createTokens(user);
    
    res.json({
      token: accessToken,
      user: authService.formatPublicUser(user),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get current user
 */
async function getCurrentUser(req, res, next) {
  try {
    const user = await authService.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: ERROR_CODES.USER_NOT_FOUND,
      });
    }
    res.json({ user: authService.formatPublicUser(user) });
  } catch (err) {
    next(err);
  }
}

/**
 * Logout user
 */
function logout(req, res) {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
}

/**
 * Get all users (admin only)
 */
async function getAllUsers(req, res, next) {
  try {
    const users = await authService.getAllStudents();
    res.json({ users: users.map((u) => authService.formatPublicUser(u)) });
  } catch (err) {
    next(err);
  }
}

/**
 * Update a student user (admin only)
 */
async function updateUser(req, res, next) {
  try {
    const { userId } = req.params;
    const updates = req.validated;
    const year = String(updates.yearOfStudy).replace(/^year\s*/i, '').trim();
    const user = await authService.updateStudentById(userId, {
      ...updates,
      yearOfStudy: year,
    });
    res.json({
      message: 'User updated successfully',
      user: authService.formatPublicUser(user),
    });
  } catch (err) {
    if (err.message === 'USER_NOT_FOUND') {
      return res.status(404).json({
        error: 'User not found',
        code: ERROR_CODES.USER_NOT_FOUND,
      });
    }
    if (err.message === 'DUPLICATE_ENTRY') {
      return res.status(409).json({
        error: 'Email is already in use',
        code: ERROR_CODES.DUPLICATE_ENTRY,
      });
    }
    next(err);
  }
}

/**
 * Delete a student user (admin only)
 */
async function deleteUser(req, res, next) {
  try {
    const { userId } = req.params;
    await authService.deleteStudentById(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    if (err.message === 'USER_NOT_FOUND') {
      return res.status(404).json({
        error: 'User not found',
        code: ERROR_CODES.USER_NOT_FOUND,
      });
    }
    next(err);
  }
}

module.exports = {
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
};

