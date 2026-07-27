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
 * Connection/socket timeouts are set to prevent indefinite hangs when
 * the SMTP server is unreachable.
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
    connectionTimeout: 10000,  // 10 s — fail fast if SMTP is unreachable
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  const mailOptions = {
    from: `"MH App — GEC Palakkad" <${config.emailUser}>`,
    to: user.email,
    subject: 'MH App — Password Reset Request',
    text: [
      `Hello ${user.name},`,
      '',
      'You requested a password reset for your MH App account.',
      '',
      `Reset link (valid for 30 minutes):`,
      resetURL,
      '',
      'If you did not request this, ignore this email — your password will not change.',
      '',
      '— MH App, GEC Sreekrishnapuram',
    ].join('\n'),
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#4441CC 0%,#6c63ff 100%);padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">MH App</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:12px;">GEC Sreekrishnapuram — Men's Hostel</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 8px;color:#111;font-size:18px;font-weight:700;">Reset your password</h2>
            <p style="margin:0 0 16px;color:#555;font-size:14px;line-height:1.6;">
              Hello <strong>${user.name}</strong>,<br>
              We received a request to reset the password for your account. Click the button below to choose a new password.
            </p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${resetURL}"
                 style="display:inline-block;background:#4441CC;color:#ffffff;text-decoration:none;padding:13px 32px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.2px;">
                Reset Password
              </a>
            </div>
            <p style="margin:0 0 8px;color:#888;font-size:12px;line-height:1.6;">
              This link expires in <strong>30 minutes</strong>. If the button doesn't work, copy and paste this URL into your browser:
            </p>
            <p style="margin:0 0 24px;word-break:break-all;">
              <a href="${resetURL}" style="color:#4441CC;font-size:12px;">${resetURL}</a>
            </p>
            <hr style="border:none;border-top:1px solid #eee;margin:0 0 16px;">
            <p style="margin:0;color:#aaa;font-size:11px;line-height:1.6;">
              If you did not request a password reset, you can safely ignore this email — your password will remain unchanged.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#fafafa;padding:16px 32px;text-align:center;border-top:1px solid #eee;">
            <p style="margin:0;color:#ccc;font-size:11px;">© ${new Date().getFullYear()} MH App — GEC Sreekrishnapuram</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
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




