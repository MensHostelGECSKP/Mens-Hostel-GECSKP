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
 * Get "today" as a UTC midnight timestamp anchored to the current IST calendar date.
 * This ensures the window calculation is consistent regardless of the server's local
 * timezone. During 12:00 AM–5:30 AM IST the server UTC clock still reads the previous
 * calendar day; this function corrects for that by shifting by +5:30 before extracting
 * the date string.
 */
function getISTToday() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const istTime = new Date(now.getTime() + istOffset);
  const istDateString = istTime.toISOString().slice(0, 10);
  return new Date(`${istDateString}T00:00:00Z`);
}

/**
 * Calculate the deadline for marking attendance for a given date.
 * Deadline is at ATTENDANCE_DEADLINE_HOUR IST (UTC+5:30) on the day before the requested date.
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
 * Calculate the maximum date that can be marked (today IST + window days).
 * Uses IST calendar date to avoid off-by-one during 12:00 AM–5:30 AM IST window.
 */
function calculateMaxDate(windowDays) {
  const today = getISTToday();
  return addDays(today, windowDays);
}

/**
 * Check if requested date is within the allowed window.
 * "Today" is anchored to the IST calendar date to avoid off-by-one errors during
 * the 12:00 AM–5:30 AM IST window when the UTC clock still reads the prior day.
 */
function isWithinWindow(requestedDate, windowDays) {
  const today = getISTToday();
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
  getISTToday,
};
