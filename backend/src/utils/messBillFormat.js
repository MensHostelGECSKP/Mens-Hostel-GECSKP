const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatBillMonthLabel(month, year) {
  const name = MONTH_NAMES[month - 1] || String(month);
  return `${name} ${year}`;
}

function formatDueDate(dueDate) {
  const d = dueDate instanceof Date ? dueDate : new Date(dueDate);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

module.exports = {
  MONTH_NAMES,
  formatBillMonthLabel,
  formatDueDate,
};
