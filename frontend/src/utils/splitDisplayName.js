/** Split a full name into first + remainder (surname) on first space. */
export function splitDisplayName(full) {
  const t = (full || '').trim();
  if (!t) return { first: '', last: '' };
  const i = t.indexOf(' ');
  if (i === -1) return { first: t, last: '' };
  return { first: t.slice(0, i), last: t.slice(i + 1).trim() };
}
