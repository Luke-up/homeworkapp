'use client';

import '@/styles/dashboard-shell.scss';
import SchoolSidebar from './SchoolSidebar';
import SiteFooter from '@/components/SiteFooter/SiteFooter';
import TimedDemoExpiry from '@/components/TimedDemoExpiry/TimedDemoExpiry';
import axiosInterceptor from '@/utils/axiosInterceptor';
import { clearTimedDemoLocalState } from '@/utils/timedDemo';

export default function SchoolAppShell({ children }) {
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
      <SchoolSidebar onLogout={handleLogout} />
      <main className="dashboard-main">
        <div className="dashboard-main-inner school-main">{children}</div>
        <SiteFooter />
      </main>
    </div>
  );
}
