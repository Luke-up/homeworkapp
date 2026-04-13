'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function IconDashboard() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconHomework() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none">
      <path d="M6 4h12v16H6z" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}

function IconLexicon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none">
      <path d="M5 3h10a2 2 0 0 1 2 2v16l-1-1H5z" />
      <path d="M8 7h6M8 11h6" />
    </svg>
  );
}

function IconClassroom() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none">
      <path d="M4 10l8-5 8 5v9H4z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none">
      <path d="M10 5H5v14h5" />
      <path d="M14 12H4M18 8l4 4-4 4" />
    </svg>
  );
}

const ICONS = {
  dashboard: IconDashboard,
  homework: IconHomework,
  lexicon: IconLexicon,
  classroom: IconClassroom,
};

function navActive(pathname, item) {
  if (item.href === '/student') {
    return pathname === item.href;
  }
  if (item.href === '/teacher') {
    return pathname === '/teacher';
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export default function DashboardSidebar({ items, onLogout }) {
  const pathname = usePathname() || '';

  return (
    <aside className="dashboard-sidebar" aria-label="Main navigation">
      <nav className="dashboard-sidebar__nav">
        {items.map((item) => {
          const Icon = ICONS[item.icon] || IconDashboard;
          const active = navActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`dashboard-sidebar__link${active ? ' is-active' : ''}`}
            >
              <span className="dashboard-sidebar__icon">
                <Icon />
              </span>
              <span className="dashboard-sidebar__label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="dashboard-sidebar__footer">
        <button type="button" className="dashboard-sidebar__logout" onClick={onLogout}>
          <span className="dashboard-sidebar__icon">
            <IconLogout />
          </span>
          <span className="dashboard-sidebar__label">Logout</span>
        </button>
      </div>
    </aside>
  );
}
