const attendanceService = require('../services/attendanceService');
const ExcelJS = require('exceljs');
const { ERROR_CODES } = require('../constants/errors');

function buildMonthlyReportWorkbook(summary, details) {
  const workbook = new ExcelJS.Workbook();

  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Room Number', key: 'roomNumber', width: 16 },
    { header: 'Year', key: 'yearOfStudy', width: 10 },
    { header: 'Total Mess Cuts', key: 'totalCuts', width: 20 },
  ];
  summary.forEach((row) => summarySheet.addRow(row));

  const detailsSheet = workbook.addWorksheet('Details');
  detailsSheet.columns = [
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Room Number', key: 'roomNumber', width: 16 },
    { header: 'Year', key: 'yearOfStudy', width: 10 },
    { header: 'Date', key: 'date', width: 20 },
  ];
  details.forEach((row) => detailsSheet.addRow(row));

  return workbook;
}

/**
 * Mark attendance
 */
async function markAttendance(req, res, next) {
  try {
    const { date, meals } = req.validated;
    const userId = req.user.userId;
    
    const attendance = await attendanceService.markAttendance(userId, date, meals);
    res.json({ message: 'Attendance marked', attendance });
  } catch (err) {
    if (err.message === 'INVALID_DATE') {
      return res.status(400).json({
        error: 'Invalid date',
        code: ERROR_CODES.INVALID_DATE,
      });
    }
    if (err.message === 'DEADLINE_PASSED') {
      return res.status(400).json({
        error: `Deadline to mark for ${req.validated.date} has passed.`,
        code: ERROR_CODES.DEADLINE_PASSED,
      });
    }
    if (err.message === 'OUTSIDE_WINDOW') {
      return res.status(400).json({
        error: `Cannot mark attendance more than the allowed days in advance.`,
        code: ERROR_CODES.OUTSIDE_WINDOW,
      });
    }
    next(err);
  }
}

/**
 * Get month attendance
 */
async function getMonthAttendance(req, res, next) {
  try {
    const { month } = req.validated;
    const userId = req.user.userId;
    const attendance = await attendanceService.getMonthAttendance(userId, month);
    res.json({ attendance });
  } catch (err) {
    next(err);
  }
}

/**
 * Get admin summary
 */
async function getAdminSummary(req, res, next) {
  try {
    const { date } = req.validated;
    const result = await attendanceService.getAdminSummary(date);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Generate monthly report (GET)
 */
async function generateMonthlyReport(req, res, next) {
  try {
    const { startDate, endDate } = req.validated;
    const { summary, details } = await attendanceService.generateMonthlyReport(startDate, endDate);
    const workbook = buildMonthlyReportWorkbook(summary, details);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=mess-cut-report-${startDate}_to_${endDate}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
}

/**
 * Generate monthly report (POST)
 */
async function generateMonthlyReportForDates(req, res, next) {
  try {
    const { dates } = req.validated;
    const { summary, details } = await attendanceService.generateMonthlyReportForDates(dates);
    const workbook = buildMonthlyReportWorkbook(summary, details);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=mess-cut-report-${dates[0]}_to_${dates[dates.length-1]}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  markAttendance,
  getMonthAttendance,
  getAdminSummary,
  generateMonthlyReport,
  generateMonthlyReportForDates,
};




