const XLSX = require('xlsx');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const config = require('../config');
const { logAuditEvent } = require('../utils/auditLogger');

const SMTP_TRANSIENT_CODES = new Set([
  'ETIMEDOUT',
  'ECONNECTION',
  'ESOCKET',
  'ECONNRESET',
  'EAI_AGAIN',
]);

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generates a random password for new accounts.
 */
function generatePassword(length = 12) {
  return [...Array(length)].map(() => (Math.random() * 36 | 0).toString(36)).join('');
}

/**
 * Derives the username from an email address (local part before @).
 */
function getUsernameFromEmail(email) {
  if (!email || !email.includes('@')) return '';
  return email.split('@')[0].trim().toLowerCase();
}

/**
 * Normalizes year of study to "1", "2", "3", "4" by stripping "year" prefix.
 */
function normalizeYearOfStudy(year) {
  if (year === undefined || year === null) return '';
  return String(year).replace(/^year\s*/i, '').trim();
}

/**
 * Extracts a field from spreadsheet row by searching case-insensitive headers/aliases.
 */
function pickField(row, aliases) {
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const found = keys.find((k) => k.trim().toLowerCase() === alias.toLowerCase());
    if (found != null && String(row[found]).trim() !== '') {
      return String(row[found]).trim();
    }
  }
  return '';
}

/**
 * Parses Excel buffer into normalized row objects.
 */
function parseExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(sheet);

  return rawRows.map((row, index) => {
    const name = pickField(row, ['name', 'full name', 'student name']);
    const yearRaw = pickField(row, ['year of study', 'year', 'yearofstudy']);
    const roomNumber = pickField(row, ['room number', 'room', 'room no', 'roomnumber']);
    const email = pickField(row, ['email', 'e-mail', 'email address']);

    return {
      rowNumber: index + 2, // Excel rows are 1-indexed, and header is row 1
      name,
      yearOfStudy: normalizeYearOfStudy(yearRaw),
      roomNumber,
      email,
    };
  });
}

/**
 * Validates list of rows. Checks fields, format, in-file duplicates, and DB duplicates.
 */
async function validateData(rows) {
  // Query all existing users' emails to check against DB duplicates in a single pass
  const existingUsers = await User.find({}, 'email');
  const dbEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));
  const dbUsernames = new Set(existingUsers.map(u => getUsernameFromEmail(u.email)));

  const fileEmails = new Set();
  const fileUsernames = new Set();

  // Keep track of duplicated emails and usernames in the upload file
  const seenEmails = new Set();
  const seenUsernames = new Set();
  const duplicateEmailsInFile = new Set();
  const duplicateUsernamesInFile = new Set();

  for (const row of rows) {
    if (row.email) {
      const emailLower = row.email.toLowerCase();
      if (seenEmails.has(emailLower)) {
        duplicateEmailsInFile.add(emailLower);
      } else {
        seenEmails.add(emailLower);
      }

      const username = getUsernameFromEmail(row.email);
      if (username) {
        if (seenUsernames.has(username)) {
          duplicateUsernamesInFile.add(username);
        } else {
          seenUsernames.add(username);
        }
      }
    }
  }

  const validRows = [];
  const invalidRows = [];
  const rowErrors = [];
  let duplicateCount = 0;

  for (const row of rows) {
    const errors = [];
    const emailLower = row.email ? row.email.toLowerCase() : '';
    const username = getUsernameFromEmail(row.email);

    // 1. Name Check
    if (!row.name) {
      errors.push('Missing Name');
    }

    // 2. Email Checks
    if (!row.email) {
      errors.push('Missing Email');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email)) {
        errors.push('Invalid Email');
      } else if (!username) {
        errors.push('Missing Username');
      } else {
        // Uniqueness checks
        let isDuplicate = false;
        if (duplicateEmailsInFile.has(emailLower)) {
          errors.push('Duplicate Email');
          isDuplicate = true;
        } else if (dbEmails.has(emailLower)) {
          errors.push('Duplicate Email');
          isDuplicate = true;
        }

        if (duplicateUsernamesInFile.has(username)) {
          errors.push('Duplicate Username');
          isDuplicate = true;
        } else if (dbUsernames.has(username)) {
          errors.push('Duplicate Username');
          isDuplicate = true;
        }

        if (isDuplicate) {
          duplicateCount++;
        }
      }
    }

    // 3. Year Checks
    if (!row.yearOfStudy) {
      errors.push('Missing Year');
    } else if (!['1', '2', '3', '4'].includes(row.yearOfStudy)) {
      errors.push('Invalid Year');
    }

    if (errors.length > 0) {
      invalidRows.push(row);
      rowErrors.push({
        rowNumber: row.rowNumber,
        errors,
        email: row.email || '(unknown)',
      });
    } else {
      validRows.push(row);
    }
  }

  return {
    totalRows: rows.length,
    validRowsCount: validRows.length,
    invalidRowsCount: invalidRows.length,
    duplicateCount,
    validRows,
    invalidRows,
    rowErrors,
  };
}

/**
 * Creates a transporter for welcome emails.
 */
function createWelcomeEmailTransporter() {
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
      user: config.emailUser,
      pass: config.emailPass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

function isTransientSmtpError(err) {
  if (!err) return false;
  if (SMTP_TRANSIENT_CODES.has(err.code)) return true;
  if ([421, 450, 451, 452].includes(err.responseCode)) return true;
  const msg = String(err.message || '').toLowerCase();
  return (
    msg.includes('timeout') ||
    msg.includes('temporarily unavailable') ||
    msg.includes('try again later') ||
    msg.includes('connection closed')
  );
}

function formatSmtpError(err) {
  const parts = [];
  if (err?.code) parts.push(err.code);
  if (err?.responseCode) parts.push(`SMTP ${err.responseCode}`);
  if (err?.message) parts.push(err.message);
  return parts.join(': ') || 'SMTP error';
}

async function sendWelcomeEmail(transporter, user, loginUrl) {
  const mailOptions = {
    from: `"MH App" <${config.emailUser}>`,
    to: user.email,
    subject: 'Your Hostel Mess App Account Created',
    text: [
      `Hello ${user.name},`,
      '',
      'Your mess account has been created successfully.',
      `Name: ${user.name}`,
      `Year: ${user.yearOfStudy}`,
      `Room: ${user.roomNumber || 'N/A'}`,
      `Email: ${user.email}`,
      `Password: ${user.plainPassword}`,
      '',
      `Please log in at ${loginUrl} using these credentials.`,
    ].join('\n'),
  };

  const maxAttempts = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await transporter.sendMail(mailOptions);
      return { ok: true };
    } catch (err) {
      lastError = err;
      if (!isTransientSmtpError(err) || attempt === maxAttempts) {
        break;
      }
      await delay(250 * attempt);
    }
  }

  const error = new Error(formatSmtpError(lastError));
  error.originalError = lastError;
  throw error;
}

/**
 * Sends welcome emails to successfully created users.
 */
async function sendWelcomeEmails(users) {
  if (!config.emailUser || !config.emailPass) {
    console.warn('[import-service] EMAIL_USER / EMAIL_PASS not set — skipping welcome emails.');
    return {
      sent: 0,
      failed: 0,
      skipped: users.length,
      failures: [],
    };
  }

  const transporter = createWelcomeEmailTransporter();

  const frontendUrls = config.frontendUrl.split(',').map((s) => s.trim()).filter(Boolean);
  const loginUrl = frontendUrls[0] || 'http://localhost:3000';

  let sent = 0;
  let failed = 0;
  const failures = [];

  for (const user of users) {
    console.info(`[import-service] Sending welcome email to ${user.email}`);
    try {
      await sendWelcomeEmail(transporter, user, loginUrl);
      sent += 1;
      console.info(`[import-service] Welcome email sent to ${user.email}`);
    } catch (err) {
      failed += 1;
      failures.push({
        email: user.email,
        error: err.message,
      });
      console.error(`[import-service] Failed to send welcome email to ${user.email}:`, err.message);
    }
  }

  return {
    sent,
    failed,
    skipped: 0,
    failures,
  };
}

/**
 * Imports valid rows into the database sequentially.
 */
async function importUsers(validRows, req = null, useTransactionOrOptions = true) {
  const options = typeof useTransactionOrOptions === 'object' && useTransactionOrOptions !== null
    ? useTransactionOrOptions
    : {};
  const validationSkippedCount = Number(options.skippedCount || 0);

  if (!validRows || validRows.length === 0) {
    return {
      totalRows: validationSkippedCount,
      importedCount: 0,
      skippedCount: validationSkippedCount,
      failedCount: 0,
      durationMs: 0,
      emailStats: { sent: 0, failed: 0, skipped: validationSkippedCount },
      rowResults: [],
      createdUsers: [],
      successfullyImported: 0,
      failed: 0,
      errors: [],
      emailFailures: [],
    };
  }

  const startedAt = Date.now();
  const createdUsers = [];
  const rowResults = [];
  const errors = [];
  const emailFailures = [];
  let failedCount = 0;
  let emailSentCount = 0;
  let emailFailedCount = 0;

  const frontendUrls = config.frontendUrl.split(',').map((s) => s.trim()).filter(Boolean);
  const loginUrl = frontendUrls[0] || 'http://localhost:3000';
  const emailEnabled = Boolean(config.emailUser && config.emailPass);
  const transporter = emailEnabled ? createWelcomeEmailTransporter() : null;

  console.info('[import-service] Import Started');
  console.info(`[import-service] Rows: ${validRows.length}`);
  if (validationSkippedCount > 0) {
    console.info(`[import-service] Validation skipped rows: ${validationSkippedCount}`);
  }
  console.info('[import-service] Validation Passed');

  for (let index = 0; index < validRows.length; index += 1) {
    const row = validRows[index];
    const rowLabel = `${index + 1}/${validRows.length}`;
    const plainPassword = generatePassword();
    const user = new User({
      name: row.name.trim(),
      email: row.email.trim().toLowerCase(),
      password: plainPassword, // pre-save hook will hash this
      role: 'student',
      yearOfStudy: row.yearOfStudy,
      roomNumber: row.roomNumber ? row.roomNumber.trim() : '',
      status: 'active',
    });

    console.info(`[import-service] Creating user ${rowLabel}: ${user.email}`);
    try {
      await user.save();
      createdUsers.push({
        _id: user._id,
        name: user.name,
        email: user.email,
        yearOfStudy: user.yearOfStudy,
        roomNumber: user.roomNumber,
        plainPassword,
      });

      // Log audit trail event for user creation
      await logAuditEvent(
        req || { user: { role: 'admin' }, ip: '127.0.0.1', headers: {} },
        'USER_REGISTER',
        {
          name: user.name,
          email: user.email,
          role: 'student',
          yearOfStudy: user.yearOfStudy,
          roomNumber: user.roomNumber,
          imported: true,
        },
        user._id
      );

      let emailStatus = 'skipped';
      let emailError = '';
      if (emailEnabled) {
        console.info(`[import-service] Sending welcome email ${rowLabel}: ${user.email}`);
        try {
          await sendWelcomeEmail(transporter, createdUsers[createdUsers.length - 1], loginUrl);
          emailSentCount += 1;
          emailStatus = 'sent';
          console.info(`[import-service] Welcome email sent ${rowLabel}: ${user.email}`);
        } catch (err) {
          emailFailedCount += 1;
          emailStatus = 'failed';
          emailError = err.message;
          emailFailures.push({
            rowNumber: row.rowNumber,
            email: user.email,
            error: err.message,
          });
          console.error(`[import-service] Failed to send welcome email to ${user.email}:`, err.message);
        }
      }

      rowResults.push({
        rowNumber: row.rowNumber,
        name: user.name,
        email: user.email,
        status: 'imported',
        message: emailStatus === 'sent'
          ? 'Imported and welcome email sent'
          : emailStatus === 'failed'
            ? 'Imported, but welcome email failed'
            : 'Imported; welcome email skipped',
        emailStatus,
        emailError: emailError || undefined,
      });

      console.info(`[import-service] Processed ${rowLabel}: imported`);
    } catch (err) {
      failedCount++;
      errors.push({
        rowNumber: row.rowNumber,
        email: row.email,
        error: err.message,
      });
      rowResults.push({
        rowNumber: row.rowNumber,
        name: row.name,
        email: row.email,
        status: 'failed',
        message: err.message,
        emailStatus: 'skipped',
      });
      console.error(`[import-service] Failed to create user ${rowLabel}: ${row.email}`, err.message);
    }
  }

  const durationMs = Date.now() - startedAt;
  const summary = {
    totalRows: validRows.length + validationSkippedCount,
    importedCount: createdUsers.length,
    skippedCount: validationSkippedCount,
    failedCount,
    durationMs,
    emailStats: {
      sent: emailSentCount,
      failed: emailFailedCount,
      skipped: emailEnabled ? 0 : createdUsers.length,
    },
    rowResults,
    createdUsers,
    successfullyImported: createdUsers.length,
    failed: failedCount + validationSkippedCount,
    errors,
    emailFailures,
  };

  console.info('[import-service] Import Complete');
  console.info(
    `[import-service] Imported: ${summary.importedCount}, Skipped: ${summary.skippedCount}, Failed: ${summary.failedCount}, Emails Sent: ${summary.emailStats.sent}, Emails Failed: ${summary.emailStats.failed}, Duration: ${Math.round(durationMs / 1000)} seconds`
  );

  return summary;
}

module.exports = {
  parseExcel,
  validateData,
  importUsers,
  normalizeYearOfStudy,
  getUsernameFromEmail,
};
