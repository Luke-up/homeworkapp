/**
 * Map backend mark (0–5 scale) to 0–3 stars for display.
 */
export function markValueToStarCount(markValue) {
  if (markValue == null || markValue === '') return 0;
  const n = Number(markValue);
  if (Number.isNaN(n)) return 0;
  const scaled = Math.round((n / 5) * 3);
  return Math.max(0, Math.min(3, scaled));
}

/** Map 0–3 star selection to 0–5 scale for the API (discrete teacher marks). */
export function starCountToMarkValue(starCount) {
  const s = Math.max(0, Math.min(3, Number(starCount) || 0));
  if (s === 0) return '0';
  const raw = (s / 3) * 5;
  return String(Math.round(raw * 100) / 100);
}
