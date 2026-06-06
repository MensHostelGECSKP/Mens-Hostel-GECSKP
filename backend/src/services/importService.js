const XLSX = require('xlsx');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const config = require('../config');
const { logAuditEvent } = require('../utils/auditLogger');

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
 * Internal helper to check if a MongoDB error is related to transactions not being supported.
 */
function isTransactionUnsupportedError(err) {
  const msg = err?.message || '';
  return (
    msg.includes('replica set') ||
    msg.includes('Transaction numbers') ||
    msg.includes('transactions are not supported')
  );
}

/**
 * Sends welcome emails to successfully created users.
 */
async function sendWelcomeEmails(users) {
  if (!config.emailUser || !config.emailPass) {
    console.warn('[import-service] EMAIL_USER / EMAIL_PASS not set — skipping welcome emails.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
      user: config.emailUser,
      pass: config.emailPass,
    },
  });

  const frontendUrls = config.frontendUrl.split(',').map((s) => s.trim()).filter(Boolean);
  const loginUrl = frontendUrls[0] || 'http://localhost:3000';

  for (const user of users) {
    try {
      await transporter.sendMail({
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
      });
    } catch (err) {
      console.error(`[import-service] Failed to send welcome email to ${user.email}:`, err.message);
    }
  }
}

/**
 * Imports valid rows into the database (supports MongoDB Transactions).
 */
async function importUsers(validRows, req = null, useTransaction = true) {
  if (!validRows || validRows.length === 0) {
    return { successfullyImported: 0, failed: 0, errors: [] };
  }

  if (useTransaction) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const results = await executeInsert(validRows, req, session);
      await session.commitTransaction();
      
      // Asynchronously send emails after successful commit
      sendWelcomeEmails(results.createdUsers).catch(console.error);

      return {
        successfullyImported: results.createdUsers.length,
        failed: 0,
        errors: [],
      };
    } catch (err) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      if (!isTransactionUnsupportedError(err)) {
        throw err;
      }
      console.warn('[import-service] Transactions unsupported; falling back to non-transactional import');
    } finally {
      session.endSession();
    }
  }

  // Fallback: non-transactional inserts
  const results = await executeInsert(validRows, req);
  sendWelcomeEmails(results.createdUsers).catch(console.error);

  return {
    successfullyImported: results.createdUsers.length,
    failed: results.failedCount,
    errors: results.errors,
  };
}

/**
 * Performs actual DB insertions of user records.
 */
async function executeInsert(validRows, req, session = null) {
  const opts = session ? { session } : {};
  const createdUsers = [];
  const errors = [];
  let failedCount = 0;

  for (const row of validRows) {
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

    try {
      await user.save(opts);
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
        user._id,
        session
      );
    } catch (err) {
      failedCount++;
      errors.push({
        rowNumber: row.rowNumber,
        email: row.email,
        error: err.message,
      });
      // In transactional mode, this throw triggers abortion and rolls back all inserts
      if (session) {
        throw err;
      }
    }
  }

  return { createdUsers, failedCount, errors };
}

module.exports = {
  parseExcel,
  validateData,
  importUsers,
  normalizeYearOfStudy,
  getUsernameFromEmail,
};
