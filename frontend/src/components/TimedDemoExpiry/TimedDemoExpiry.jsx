'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  clearTimedDemoLocalState,
  getDemoSessionExpiresAtIso,
} from '@/utils/timedDemo';

function signOutTimedDemo() {
  sessionStorage.removeItem('access_token');
  sessionStorage.removeItem('refresh_token');
  clearTimedDemoLocalState();
  window.location.href = '/signup?demo_expired=1';
}

export default function TimedDemoExpiry() {
  const pathname = usePathname();

  useEffect(() => {
    const tick = () => {
      const iso = getDemoSessionExpiresAtIso();
      if (!iso) return;
      const end = new Date(iso).getTime();
      if (!Number.isNaN(end) && Date.now() >= end) {
        signOutTimedDemo();
      }
    };
    tick();
    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
  }, [pathname]);

  return null;
}
