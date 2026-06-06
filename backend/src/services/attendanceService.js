const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { parseDate, calculateDeadline, isBeforeDeadline, isWithinWindow } = require('../utils/dateUtils');
const config = require('../config');

/**
 * Validate attendance date and deadline
 */
function validateAttendanceDate(date) {
  const requestedDate = parseDate(date);
  
  if (!requestedDate) {
    throw new Error('INVALID_DATE');
  }

  // Calculate deadline using config
  const deadline = calculateDeadline(requestedDate, config.attendanceDeadlineHour);
  
  // Check if deadline has passed
  if (!isBeforeDeadline(deadline)) {
    throw new Error('DEADLINE_PASSED');
  }

  // Check if date is within allowed window
  if (!isWithinWindow(requestedDate, config.attendanceWindowDays)) {
    throw new Error('OUTSIDE_WINDOW');
  }

  return requestedDate;
}

/**
 * Mark attendance for a user
 */
async function markAttendance(userId, date, meals) {
  // Validate date
  validateAttendanceDate(date);

  // Upsert attendance (update if exists, insert if not)
  let attendance;
  try {
    attendance = await Attendance.findOneAndUpdate(
      { userId, date },
      { $set: { meals }, $setOnInsert: { userId, date } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (err) {
    // Handle duplicate key race (two requests trying to insert simultaneously)
    if (err && err.code === 11000) {
      // Find existing record and update it with new meals data
      attendance = await Attendance.findOneAndUpdate(
        { userId, date },
        { $set: { meals } },
        { new: true }
      );
      if (!attendance) {
        throw new Error('Failed to update attendance after race condition');
      }
    } else {
      throw err;
    }
  }

  return attendance;
}

/**
 * Get attendance for a user for a specific month
 */
async function getMonthAttendance(userId, month) {
  const regex = new RegExp(`^${month}-\\d{2}$`); // Matches YYYY-MM-XX
  return await Attendance.find({ userId, date: { $regex: regex } }).select('date meals -_id');
}

/**
 * Get admin summary for a specific date
 */
async function getAdminSummary(date) {
  // Get all users (students only)
  const users = await User.find({ role: 'student' }).select('name email');
  // Get all attendance records for the date
  const attendanceRecords = await Attendance.find({ date });
  // Map userId to attendance
  const attendanceMap = {};
  attendanceRecords.forEach(a => { attendanceMap[a.userId.toString()] = a; });
  
  // Prepare details and summary
  let summary = { morning: 0, noon: 0, night: 0 };
  const details = users.map(user => {
    const att = attendanceMap[user._id.toString()];
    const morningAbsent = att ? !att.meals.morning : false;
    const noonAbsent = att ? !att.meals.noon : false;
    const nightAbsent = att ? !att.meals.night : false;
    if (morningAbsent) summary.morning++;
    if (noonAbsent) summary.noon++;
    if (nightAbsent) summary.night++;
    return {
      name: user.name,
      email: user.email,
      morning: morningAbsent,
      noon: noonAbsent,
      night: nightAbsent,
      morningAbsent,
      noonAbsent,
      nightAbsent,
    };
  });
  
  return { date, summary, details };
}

/**
 * Generate monthly report data
 */
async function generateMonthlyReport(startDate, endDate) {
  const User = require('../models/User');
  const students = await User.find({ role: 'student' }).select('name roomNumber yearOfStudy');
  const attendanceRecords = await Attendance.find({
    date: { $gte: startDate, $lte: endDate },
  });
  
  const summary = [];
  const details = [];
  
  students.forEach(student => {
    const studentRecords = attendanceRecords.filter(a => a.userId.toString() === student._id.toString());
    let totalCuts = 0;
    const cutDates = [];
    studentRecords.forEach(rec => {
      const { morning, noon, night } = rec.meals;
      if (!morning && !noon && !night) {
        totalCuts++;
        cutDates.push(rec.date);
      }
    });
    summary.push({
      name: student.name,
      roomNumber: student.roomNumber || '',
      yearOfStudy: student.yearOfStudy || '',
      totalCuts,
    });
    cutDates.forEach(date => {
      details.push({
        name: student.name,
        roomNumber: student.roomNumber || '',
        yearOfStudy: student.yearOfStudy || '',
        date,
      });
    });
  });
  
  return { summary, details };
}

/**
 * Generate monthly report data for specific dates
 */
async function generateMonthlyReportForDates(dates) {
  const students = await User.find({ role: 'student' }).select('name roomNumber yearOfStudy');
  const attendanceRecords = await Attendance.find({ date: { $in: dates } });
  
  const summary = [];
  const details = [];
  
  students.forEach(student => {
    const studentRecords = attendanceRecords.filter(a => a.userId.toString() === student._id.toString());
    let totalCuts = 0;
    const cutDates = [];
    studentRecords.forEach(rec => {
      const { morning, noon, night } = rec.meals;
      if (!morning && !noon && !night) {
        totalCuts++;
        cutDates.push(rec.date);
      }
    });
    summary.push({
      name: student.name,
      roomNumber: student.roomNumber || '',
      yearOfStudy: student.yearOfStudy || '',
      totalCuts,
    });
    cutDates.forEach(date => {
      details.push({
        name: student.name,
        roomNumber: student.roomNumber || '',
        yearOfStudy: student.yearOfStudy || '',
        date,
      });
    });
  });
  
  return { summary, details };
}

module.exports = {
  markAttendance,
  getMonthAttendance,
  getAdminSummary,
  generateMonthlyReport,
  generateMonthlyReportForDates,
};




