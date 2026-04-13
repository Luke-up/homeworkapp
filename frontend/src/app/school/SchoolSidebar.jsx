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

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15 15l6 6" />
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

function normalizePath(pathname) {
  if (!pathname) return '/';
  const p = pathname.replace(/\/$/, '') || '/';
  return p;
}

function isActive(pathname, href, exact) {
  const p = normalizePath(pathname);
  const h = normalizePath(href);
  if (exact) return p === h;
  return p === h || p.startsWith(`${h}/`);
}

const NAV = [
  { href: '/school', label: 'Dashboard', icon: IconDashboard, exact: true },
  { href: '/school/students', label: 'Student search', icon: IconSearch, exact: false },
  { href: '/school/teachers', label: 'Teacher search', icon: IconSearch, exact: false },
];

export default function SchoolSidebar({ onLogout }) {
  const pathname = usePathname() || '';

  return (
    <aside className="dashboard-sidebar" aria-label="School navigation">
      <nav className="dashboard-sidebar__nav">
        {NAV.map((item) => {
          const Icon = item.icon;
          const p = normalizePath(pathname);
          let active = isActive(pathname, item.href, item.exact);
          if (item.href === '/school') {
            active = p === '/school' || p.startsWith('/school/class/');
          }
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
