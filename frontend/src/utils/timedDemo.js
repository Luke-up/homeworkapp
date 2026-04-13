export const TIMED_DEMO_STORAGE_KEY = 'homeworkapp_timed_demo_v1';
/** Per-tab copy of ISO expiry (sessionStorage) so each tab can sign itself out when time is up. */
export const DEMO_SESSION_EXPIRES_AT_KEY = 'demo_session_expires_at';

export function readTimedDemoSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(TIMED_DEMO_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearTimedDemoLocalState() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TIMED_DEMO_STORAGE_KEY);
  sessionStorage.removeItem(DEMO_SESSION_EXPIRES_AT_KEY);
}

export function getDemoSessionExpiresAtIso() {
  if (typeof window === 'undefined') return null;
  return (
    sessionStorage.getItem(DEMO_SESSION_EXPIRES_AT_KEY) ||
    readTimedDemoSession()?.expiresAt ||
    null
  );
}
