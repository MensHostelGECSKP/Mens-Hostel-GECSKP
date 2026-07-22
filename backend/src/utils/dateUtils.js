const { parseISO, isValid, subDays, addDays, isAfter, isBefore } = require('date-fns');

/**
 * Parse and validate a date string in YYYY-MM-DD format
 * Returns a Date object in UTC or null if invalid
 */
function parseDate(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }
  
  // Validate format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return null;
  }
  
  // Parse as UTC midnight
  const date = parseISO(`${dateString}T00:00:00Z`);
  
  if (!isValid(date)) {
    return null;
  }
  
  // Verify the date string matches (handles invalid dates like 2024-02-30)
  if (date.toISOString().slice(0, 10) !== dateString) {
    return null;
  }
  
  return date;
}

/**
 * Get start of day in UTC
 */
function startOfDayUTC(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Calculate the deadline for marking attendance for a given date
 * Deadline is at ATTENDANCE_DEADLINE_HOUR IST (UTC+5:30) on the day before the requested date
 */
function calculateDeadline(requestedDate, deadlineHour) {
  const deadlineDay = startOfDayUTC(requestedDate);
  const previousDay = subDays(deadlineDay, 1);
  // deadlineHour is in IST (UTC+5:30). Convert IST hour on previous day to UTC timestamp.
  const deadlineMs = previousDay.getTime() + (deadlineHour - 5.5) * 60 * 60 * 1000;
  return new Date(deadlineMs);
}

/**
 * Check if current time is before deadline
 */
function isBeforeDeadline(deadline) {
  return isBefore(new Date(), deadline);
}

/**
 * Calculate the maximum date that can be marked (today + window days)
 */
function calculateMaxDate(windowDays) {
  const today = startOfDayUTC(new Date());
  return addDays(today, windowDays);
}

/**
 * Check if requested date is within the allowed window
 */
function isWithinWindow(requestedDate, windowDays) {
  const today = startOfDayUTC(new Date());
  const maxDate = addDays(today, windowDays);
  const minDate = subDays(today, 1);
  return !isAfter(requestedDate, maxDate) && !isBefore(requestedDate, minDate);
}

module.exports = {
  parseDate,
  calculateDeadline,
  isBeforeDeadline,
  calculateMaxDate,
  isWithinWindow,
};

