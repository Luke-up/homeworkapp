'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import '@/styles/student-pages.scss';
import '@/styles/dashboard-shell.scss';
import DashboardSidebar from '@/components/DashboardSidebar/DashboardSidebar';
import SiteFooter from '@/components/SiteFooter/SiteFooter';
import TimedDemoExpiry from '@/components/TimedDemoExpiry/TimedDemoExpiry';
import axiosInterceptor from '@/utils/axiosInterceptor';
import { clearTimedDemoLocalState } from '@/utils/timedDemo';
import './styles.scss';

const DEFAULT_NAV = [{ href: '/teacher', label: 'Dashboard', icon: 'dashboard' }];

export default function TeacherAppShell({ children }) {
  const pathname = usePathname() || '';
  const [navItems, setNavItems] = useState(DEFAULT_NAV);

  const fullWidth =
    pathname.startsWith('/teacher/mark/') ||
    /\/teacher\/class\/[^/]+\/homework\//.test(pathname);
  const mainInnerClass = fullWidth
    ? 'dashboard-main-inner dashboard-main-inner--full-width'
    : 'dashboard-main-inner';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInterceptor.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/core/teacher-dashboard/`
        );
        if (cancelled) return;
        const summaries = res.data?.class_summaries || [];
        const classLinks = summaries.map((c) => ({
          href: `/teacher/class/${c.id}`,
          label: c.name,
          icon: 'classroom',
        }));
        setNavItems([...DEFAULT_NAV, ...classLinks]);
      } catch {
        if (!cancelled) setNavItems(DEFAULT_NAV);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await axiosInterceptor.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/logout/`);
    } catch {
      /* ignore */
    }
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    clearTimedDemoLocalState();
    window.location.href = '/';
  };

  return (
    <div className="dashboard-shell">
      <TimedDemoExpiry />
      <DashboardSidebar items={navItems} onLogout={handleLogout} />
      <main className="dashboard-main">
        <div className={mainInnerClass}>{children}</div>
        <SiteFooter />
      </main>
    </div>
  );
}
