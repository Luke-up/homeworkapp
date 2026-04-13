/** Parse API date/datetime to local calendar date (no UTC shift for YYYY-MM-DD). */
export function parseApiDate(value) {
  if (value == null || value === '') return null;
  const datePart = String(value).split('T')[0];
  const parts = datePart.split('-').map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
}

/**
 * Academic year April → March (inclusive). As of a reference date, "this year"
 * is 1 Apr Y through 31 Mar Y+1 where Y is the April that has most recently begun.
 */
export function isDateInSchoolYearAprToMar(date, ref = new Date()) {
  if (!date) return true;
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const yearStart = m >= 3 ? y : y - 1;
  const start = new Date(yearStart, 3, 1);
  const end = new Date(yearStart + 1, 2, 31, 23, 59, 59, 999);
  return date >= start && date <= end;
}

export function completedHomeworkSortDate(sh) {
  return parseApiDate(sh.submission_date) || parseApiDate(sh.homework?.due_date);
}
