'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { dashboardPathForUserType } from '@/utils/authRedirect';
import {
  clearTimedDemoLocalState,
  DEMO_SESSION_EXPIRES_AT_KEY,
  readTimedDemoSession,
} from '@/utils/timedDemo';

const ROLES = new Set(['school', 'teacher', 'student']);

export default function TimedDemoEntryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('Preparing your demo…');

  useEffect(() => {
    const role = searchParams.get('role');
    if (!ROLES.has(role)) {
      setMessage('Invalid demo link.');
      router.replace('/signup');
      return;
    }

    const base = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!base) {
      setMessage('Missing NEXT_PUBLIC_BACKEND_URL.');
      return;
    }

    const session = readTimedDemoSession();
    if (!session?.password || !session?.accounts) {
      setMessage('No active demo session. Start from Signup.');
      router.replace('/signup');
      return;
    }

    const end = new Date(session.expiresAt).getTime();
    if (Number.isNaN(end) || Date.now() >= end) {
      clearTimedDemoLocalState();
      setMessage('This demo has expired.');
      router.replace('/signup?demo_expired=1');
      return;
    }

    const acc = session.accounts[role];
    if (!acc?.email) {
      setMessage('Missing demo account.');
      router.replace('/signup');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const loginRes = await fetch(`${base}/core/login/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: acc.email, password: session.password }),
        });
        const data = await loginRes.json().catch(() => ({}));
        if (cancelled) return;
        if (!loginRes.ok) {
          const msg =
            (typeof data?.detail === 'string' && data.detail) ||
            (typeof data?.error === 'string' && data.error) ||
            `Login failed (${loginRes.status}).`;
          setMessage(msg);
          return;
        }
        sessionStorage.setItem('access_token', data.access);
        sessionStorage.setItem('refresh_token', data.refresh);
        sessionStorage.setItem(DEMO_SESSION_EXPIRES_AT_KEY, session.expiresAt);
        router.replace(dashboardPathForUserType(data.user_type));
      } catch {
        if (!cancelled) setMessage('Network error — is the API running?');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <p>{message}</p>
    </div>
  );
}
