/**
 * Format a homework due value from the API (YYYY-MM-DD or ISO datetime) for display without a time of day.
 */
export function formatDueDate(value) {
  if (value == null || value === '') return '';
  const datePart = String(value).split('T')[0];
  const parts = datePart.split('-').map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' });
  }
  const [y, m, d] = parts;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { dateStyle: 'medium' });
}
