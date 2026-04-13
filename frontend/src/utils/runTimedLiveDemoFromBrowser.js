import { TIMED_DEMO_STORAGE_KEY } from '@/utils/timedDemo';

/**
 * Opens three blank tabs (caller must allow pop-ups), starts a timed demo school on the API,
 * stores credentials in localStorage, and navigates each tab to /timed-demo for the given roles.
 *
 * @param {object} opts
 * @param {string} [opts.recaptchaToken] - v2 token when NEXT_PUBLIC_RECAPTCHA_SITE_KEY is set server-side.
 * @param {(Window|null)[]} opts.blankWindows - Three windows from window.open('about:blank').
 * @returns {Promise<{ ok: true, payload: object } | { ok: false, error: string }>}
 */
export async function runTimedLiveDemoFromBrowser({ recaptchaToken = '', blankWindows }) {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!base) {
    return { ok: false, error: 'Missing NEXT_PUBLIC_BACKEND_URL. Check frontend/.env.local.' };
  }
  const wins = Array.isArray(blankWindows) ? blankWindows : [];
  if (wins.length !== 3 || wins.some((w) => !w)) {
    return { ok: false, error: 'Your browser blocked the demo tabs. Allow pop-ups for this site and try again.' };
  }

  const body = {};
  if (recaptchaToken) {
    body.recaptcha_token = recaptchaToken;
  }

  let res;
  try {
    res = await fetch(`${base}/core/demo-session/start/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    wins.forEach((w) => w && w.close());
    return { ok: false, error: 'Network error — is the API running?' };
  }

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    /* ignore */
  }

  if (!res.ok) {
    wins.forEach((w) => w && w.close());
    const msg =
      (typeof payload?.error === 'string' && payload.error) ||
      (typeof payload?.detail === 'string' && payload.detail) ||
      `Could not start demo (${res.status}).`;
    return { ok: false, error: msg };
  }

  if (typeof window === 'undefined') {
    wins.forEach((w) => w && w.close());
    return { ok: false, error: 'This action must run in the browser.' };
  }

  localStorage.setItem(
    TIMED_DEMO_STORAGE_KEY,
    JSON.stringify({
      expiresAt: payload.expires_at,
      password: payload.password,
      accounts: payload.accounts,
    })
  );

  const origin = window.location.origin;
  const urls = [
    `${origin}/timed-demo?role=school`,
    `${origin}/timed-demo?role=teacher`,
    `${origin}/timed-demo?role=student`,
  ];
  wins.forEach((w, i) => {
    if (w) w.location.href = urls[i];
  });

  return { ok: true, payload };
}
