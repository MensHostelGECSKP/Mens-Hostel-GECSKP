require('dotenv').config();
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const nodemailer = require('nodemailer');
const path = require('path');

const User = require(path.join(__dirname, '../src/models/User'));

mongoose.connect(process.env.MONGODB_URI);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function generatePassword(length = 12) {
  return [...Array(length)].map(() => (Math.random() * 36 | 0).toString(36)).join('');
}

/** Read first matching column from a spreadsheet row (case-insensitive keys). */
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

function parseStudentRow(row) {
  const name = pickField(row, ['name', 'full name', 'student name']);
  const email = pickField(row, ['email', 'e-mail']);
  const yearOfStudy = pickField(row, ['year of study', 'year', 'yearofstudy']);
  const roomNumber = pickField(row, ['room', 'room no', 'room number', 'roomnumber']);

  const missing = [];
  if (!name) missing.push('name');
  if (!email) missing.push('email');
  if (!yearOfStudy) missing.push('year of study');
  if (!roomNumber) missing.push('room');

  return { name, email, yearOfStudy, roomNumber, missing };
}

async function importUsersFromExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  let created = 0;
  let skipped = 0;
  const errors = [];

  for (const row of rows) {
    const parsed = parseStudentRow(row);
    if (parsed.missing.length > 0) {
      errors.push({
        email: parsed.email || '(unknown)',
        error: `Missing required field(s): ${parsed.missing.join(', ')}`,
      });
      continue;
    }

    const { name, email, yearOfStudy, roomNumber } = parsed;
    const password = generatePassword().trim();

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      skipped++;
      continue;
    }

    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: 'student',
      yearOfStudy,
      roomNumber,
    });

    try {
      await user.save();

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Hostel Mess App Account',
        text: [
          `Hello ${name},`,
          '',
          'Your mess account has been created.',
          `Name: ${name}`,
          `Year: ${yearOfStudy}`,
          `Room: ${roomNumber}`,
          `Email: ${email}`,
          `Password: ${password}`,
          '',
          'Please log in at https://mens-hostel-gecskp.vercel.app/ using the above credentials.',
        ].join('\n'),
      });

      created++;
    } catch (err) {
      errors.push({ email, error: err.message });
    }
  }

  console.log(`Created: ${created}, Skipped (existing): ${skipped}, Errors: ${errors.length}`);
  if (errors.length) console.log(errors);

  mongoose.disconnect();
}

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node scripts/bulkUserImport.js <path-to-excel-file>');
  console.error('Required columns: name, email, year of study, room (or room no)');
  process.exit(1);
}
importUsersFromExcel(filePath);
