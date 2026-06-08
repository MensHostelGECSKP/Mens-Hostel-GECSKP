const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const config = require('../config');

/**
 * Public user fields for API responses (no password)
 */
function formatPublicUser(user) {
  const base = {
    userId: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    notificationPreferences: user.notificationPreferences || { bills: true, announcements: true, system: true },
  };
  if (user.role === 'student') {
    return {
      ...base,
      yearOfStudy: user.yearOfStudy || '',
      roomNumber: user.roomNumber || '',
      status: user.status || 'active',
    };
  }
  return base;
}

/**
 * Create access and refresh tokens for a user
 */
function createTokens(user) {
  const payload = {
    userId: user._id,
    role: user.role,
    name: user.name,
    email: user.email,
  };
  if (user.role === 'student') {
    payload.yearOfStudy = user.yearOfStudy || '';
    payload.roomNumber = user.roomNumber || '';
  }

  const accessToken = jwt.sign(
    payload,
    config.jwtSecret,
    { expiresIn: config.jwtAccessTokenExpiry }
  );
  
  const refreshToken = jwt.sign(
    { userId: user._id },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshTokenExpiry }
  );
  
  return { accessToken, refreshToken };
}

/**
 * Verify refresh token and return decoded payload
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwtRefreshSecret);
}

/**
 * Register a new user
 */
async function registerUser(userData) {
  const { name, email, password, role = 'student', yearOfStudy, roomNumber } = userData;

  const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
  if (existingUser) {
    throw new Error('DUPLICATE_ENTRY');
  }

  const user = new User({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    role,
    yearOfStudy: role === 'student' ? String(yearOfStudy).trim() : '',
    roomNumber: role === 'student' ? String(roomNumber).trim() : '',
  });
  await user.save();

  return user;
}

/**
 * Authenticate user with email and password
 */
async function authenticateUser(email, password) {
  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }
  
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('INVALID_CREDENTIALS');
  }

  if (user.status && user.status !== 'active') {
    throw new Error('ACCOUNT_INACTIVE');
  }
  
  return user;
}

/**
 * Generate password reset token
 */
async function generatePasswordResetToken(email) {
  const user = await User.findOne({ email });
  
  if (!user) {
    // Return null to prevent email enumeration
    return null;
  }
  
  // Generate token
  const resetToken = crypto.randomBytes(32).toString('hex');
  // Hash token and set to user
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
  
  await user.save();
  
  return { user, resetToken };
}

/**
 * Send password reset email (SMTP; defaults match Gmail on port 465).
 */
async function sendPasswordResetEmail(user, resetToken) {
  if (!config.emailUser || !config.emailPass) {
    throw new Error('EMAIL_NOT_CONFIGURED');
  }

  const frontendUrls = config.frontendUrl.split(',').map((s) => s.trim()).filter(Boolean);
  const base = frontendUrls[0] || 'http://localhost:3000';
  const resetURL = `${base.replace(/\/$/, '')}/reset-password/${resetToken}`;

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
      user: config.emailUser,
      pass: config.emailPass,
    },
  });

  const mailOptions = {
    from: `"MH App" <${config.emailUser}>`,
    to: user.email,
    subject: 'MH App Password Reset Request',
    html: `
      <h1>Reset your Password</h1>
      <p>You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>
      <p>Please click on the following link, or paste it into your browser to complete the process:</p>
      <a href="${resetURL}">${resetURL}</a>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      <p>This link is valid for 30 minutes.</p>
      <h2>Admin MH App</h2>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('[email] Password reset sendMail failed:', err.message);
    if (err.response) {
      console.error('[email] SMTP response:', err.response);
    }
    const wrapped = new Error('EMAIL_SEND_FAILED');
    wrapped.details = err.message;
    throw wrapped;
  }
}

/**
 * Reset user password using token
 */
async function resetPassword(token, newPassword) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });
  
  if (!user) {
    throw new Error('INVALID_TOKEN');
  }
  
  user.password = newPassword; // Pre-save hook will hash it
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  
  return user;
}

/**
 * Get user by ID
 */
async function getUserById(userId) {
  return await User.findById(userId).select('-password');
}

/**
 * Get all students
 */
async function getAllStudents() {
  return await User.find({ role: 'student' }).select('-password');
}

/**
 * Update a student account (admin)
 */
async function updateStudentById(userId, updates) {
  const user = await User.findById(userId);
  if (!user || user.role !== 'student') {
    throw new Error('USER_NOT_FOUND');
  }

  const { name, email, roomNumber, yearOfStudy, status } = updates;

  if (name !== undefined) {
    user.name = String(name).trim();
  }
  if (email !== undefined) {
    const normalized = String(email).trim().toLowerCase();
    const duplicate = await User.findOne({
      email: normalized,
      _id: { $ne: userId },
    });
    if (duplicate) {
      throw new Error('DUPLICATE_ENTRY');
    }
    user.email = normalized;
  }
  if (roomNumber !== undefined) {
    user.roomNumber = String(roomNumber).trim();
  }
  if (yearOfStudy !== undefined) {
    user.yearOfStudy = String(yearOfStudy).trim();
  }
  if (status !== undefined) {
    user.status = status;
  }

  await user.save();
  return user;
}

/**
 * Permanently delete a student account (admin)
 */
async function deleteStudentById(userId) {
  const user = await User.findById(userId);
  if (!user || user.role !== 'student') {
    throw new Error('USER_NOT_FOUND');
  }
  await User.findByIdAndDelete(userId);
}

/**
 * Update notification preferences for a user
 */
async function updateNotificationSettings(userId, settings) {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }
  
  user.notificationPreferences = {
    bills: settings.bills !== undefined ? Boolean(settings.bills) : user.notificationPreferences?.bills ?? true,
    announcements: settings.announcements !== undefined ? Boolean(settings.announcements) : user.notificationPreferences?.announcements ?? true,
    system: settings.system !== undefined ? Boolean(settings.system) : user.notificationPreferences?.system ?? true,
  };
  
  await user.save();
  return user;
}

module.exports = {
  formatPublicUser,
  createTokens,
  verifyRefreshToken,
  registerUser,
  authenticateUser,
  generatePasswordResetToken,
  sendPasswordResetEmail,
  resetPassword,
  getUserById,
  getAllStudents,
  updateStudentById,
  deleteStudentById,
  updateNotificationSettings,
};




