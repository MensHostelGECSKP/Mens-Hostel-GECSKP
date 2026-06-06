const path = require('path');
const { randomUUID } = require('crypto');
const { formatBillMonthLabel } = require('../utils/messBillFormat');

const ALLOWED_EXT = new Set(['.pdf', '.xlsx', '.xls']);

function resolveExtension(originalName, mimeType) {
  const ext = path.extname(originalName || '').toLowerCase();
  if (ALLOWED_EXT.has(ext)) return ext;

  if (mimeType === 'application/pdf') return '.pdf';
  if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    return '.xlsx';
  }
  if (mimeType === 'application/vnd.ms-excel') return '.xls';

  return '.pdf';
}

/**
 * Build a unique local storage key:
 * mess-bills/2026/03/{uuid}_March_2026_Bill.pdf
 */
function buildMessBillStorageKey({ month, year, originalName, mimeType }) {
  const monthPadded = String(month).padStart(2, '0');
  const label = formatBillMonthLabel(month, year).replace(/\s+/g, '_');
  const ext = resolveExtension(originalName, mimeType);
  const uniqueId = randomUUID().slice(0, 8);
  const displayName = `${label}_Bill${ext}`;

  return `mess-bills/${year}/${monthPadded}/${uniqueId}_${displayName}`;
}

module.exports = {
  buildMessBillStorageKey,
  MESS_BILLS_PREFIX: 'mess-bills/',
};
