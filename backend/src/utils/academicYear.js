const config = require('../config');

/**
 * Academic year label (e.g. "2025-2026").
 * Uses ACADEMIC_YEAR env when set; otherwise July–June cycle.
 */
function getAcademicYearLabel(now = new Date()) {
  if (config.academicYear) {
    return config.academicYear;
  }
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (month >= 7) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

module.exports = { getAcademicYearLabel };
