'use client';

import '@/styles/student-pages.scss';
import '@/styles/dashboard-shell.scss';
import DashboardSidebar from '@/components/DashboardSidebar/DashboardSidebar';
import SiteFooter from '@/components/SiteFooter/SiteFooter';
import TimedDemoExpiry from '@/components/TimedDemoExpiry/TimedDemoExpiry';
import axiosInterceptor from '@/utils/axiosInterceptor';
import { clearTimedDemoLocalState } from '@/utils/timedDemo';
import './styles.scss';

const NAV_ITEMS = [
  { href: '/student', label: 'Dashboard', icon: 'dashboard' },
  { href: '/student/homework', label: 'Homework', icon: 'homework' },
  { href: '/student/lexicon', label: 'Lexicon', icon: 'lexicon' },
];

export default function StudentLayout({ children }) {
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
      <DashboardSidebar items={NAV_ITEMS} onLogout={handleLogout} />
      <main className="dashboard-main">
        <div className="dashboard-main-inner">{children}</div>
        <SiteFooter />
      </main>
    </div>
  );
}
