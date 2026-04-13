'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axiosInterceptor from '@/utils/axiosInterceptor';
import TeacherProfileModal from '@/components/TeacherProfileModal/TeacherProfileModal';
import { formatDueDate } from '@/utils/formatDueDate';
import '@/styles/student-pages.scss';
import './teacher-dashboard.scss';

function splitName(full) {
  const t = (full || '').trim();
  if (!t) return { first: '', last: '' };
  const i = t.indexOf(' ');
  if (i === -1) return { first: t, last: '' };
  return { first: t.slice(0, i), last: t.slice(i + 1).trim() };
}

function hueFromId(id) {
  const n = typeof id === 'number' ? id : parseInt(String(id), 10) || 0;
  return (n * 47) % 360;
}

function formatSubmittedAt(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return '—';
  }
}

const TeacherDashboardPage = () => {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [showClass, setShowClass] = useState('all');
  const [order, setOrder] = useState('new');

  const load = useCallback(async () => {
    try {
      const res = await axiosInterceptor.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/core/teacher-dashboard/`
      );
      setData(res.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const studentNameById = useMemo(() => {
    const m = {};
    (data?.students || []).forEach((s) => {
      m[s.id] = s.name;
    });
    return m;
  }, [data]);

  const sortedQueue = useMemo(() => {
    let list = [...(data?.homework || [])];
    if (showClass !== 'all') {
      const cid = Number(showClass);
      list = list.filter((sh) => Number(sh.homework?.class_field) === cid);
    }
    list.sort((a, b) => {
      const ta = a.submission_date ? new Date(a.submission_date).getTime() : 0;
      const tb = b.submission_date ? new Date(b.submission_date).getTime() : 0;
      return order === 'new' ? tb - ta : ta - tb;
    });
    return list;
  }, [data, showClass, order]);

  const stats = data?.dashboard_stats || {};
  const summaries = data?.class_summaries || [];
  const { first: firstName, last: lastName } = splitName(data?.name);

  if (!data) {
    return <p className="teacher-dash-loading">Loading…</p>;
  }

  const initials = `${(firstName || '?').slice(0, 1)}${(lastName || '').slice(0, 1)}`.toUpperCase() || '?';

  return (
    <>
      <header className="student-dash-header">
        <h1 className="student-page-title">My dashboard</h1>
        <button
          type="button"
          className="student-dash-header__badge"
          onClick={() => setProfileModalOpen(true)}
        >
          Teacher account
        </button>
      </header>

      <section className="teacher-dash-overview" aria-label="Overview">
        <div className="teacher-dash-profile">
          <div className="teacher-dash-identity">
            {data.avatar_url ? (
              <img className="teacher-dash-avatar" src={data.avatar_url} alt="" />
            ) : (
              <div className="teacher-dash-avatar-placeholder">{initials}</div>
            )}
            <div className="teacher-dash-names">
              <p className="teacher-dash-first">{firstName || data.name || 'Teacher'}</p>
              {lastName ? <p className="teacher-dash-last">{lastName}</p> : null}
            </div>
          </div>

          <table className="teacher-dash-stats-table">
            <tbody>
              <tr>
                <td>Classes</td>
                <td>{stats.classes_count ?? 0}</td>
              </tr>
              <tr>
                <td>Students</td>
                <td>{stats.students_count ?? 0}</td>
              </tr>
              <tr>
                <td>Pending assignments</td>
                <td>{stats.pending_assignments_count ?? 0}</td>
              </tr>
              <tr>
                <td>Unmarked assignments</td>
                <td>{stats.unmarked_assignments_count ?? 0}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="teacher-dash-class-grid" aria-label="Your classes">
          {summaries.length ? (
            summaries.map((c) => {
              const h = hueFromId(c.id);
              return (
                <Link
                  key={c.id}
                  href={`/teacher/class/${c.id}`}
                  className="teacher-dash-class-card"
                >
                  <span
                    className="teacher-dash-class-card__bg"
                    style={{
                      background: `linear-gradient(145deg, hsl(${h}, 42%, 32%), hsl(${h}, 55%, 16%))`,
                    }}
                  />
                  <div className="teacher-dash-class-card__overlay">
                    <h2 className="teacher-dash-class-card__title">{c.name}</h2>
                    <p className="teacher-dash-class-card__meta">
                      Students: {c.student_count}
                      <br />
                      Unmarked assignments: {c.unmarked_count}
                    </p>
                  </div>
                </Link>
              );
            })
          ) : (
            <p className="muted">No classes assigned yet.</p>
          )}
        </div>
      </section>

      <section className="teacher-dash-queue" aria-labelledby="teacher-queue-title">
        <h2 id="teacher-queue-title" className="teacher-dash-queue__title">
          Assignments (to be marked)
        </h2>
        <div className="teacher-dash-queue__toolbar">
          <div className="teacher-dash-queue__inline-group">
            <span className="teacher-dash-queue__inline-label">Show:</span>
            <select
              id="teacher-show-class"
              className="teacher-dash-queue__select teacher-dash-queue__select--outlined"
              value={showClass}
              onChange={(e) => setShowClass(e.target.value)}
              aria-label="Filter by classroom"
            >
              <option value="all">All classrooms</option>
              {summaries.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="teacher-dash-queue__inline-group">
            <span className="teacher-dash-queue__inline-label">Order by:</span>
            <select
              id="teacher-order"
              className="teacher-dash-queue__select teacher-dash-queue__select--solid"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              aria-label="Sort by submission date"
            >
              <option value="new">Date (newest first)</option>
              <option value="old">Date (oldest first)</option>
            </select>
          </div>
        </div>

        <div className="teacher-dash-queue__table-wrap">
          <table className="teacher-dash-queue__table">
            <thead>
              <tr>
                <th scope="col">Assignment name</th>
                <th scope="col">Student name</th>
                <th scope="col">Classroom</th>
                <th scope="col">Date submitted</th>
                <th scope="col">Due date</th>
              </tr>
            </thead>
            <tbody>
              {sortedQueue.length ? (
                sortedQueue.map((sh) => {
                  const hw = sh.homework || {};
                  const sid = sh.student;
                  const who = studentNameById[sid] || `Student #${sid}`;
                  const open = () => router.push(`/teacher/mark/${sh.id}`);
                  return (
                    <tr
                      key={sh.id}
                      className="teacher-dash-queue__row"
                      tabIndex={0}
                      role="link"
                      onClick={open}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          open();
                        }
                      }}
                    >
                      <td>{hw.title || 'Assignment'}</td>
                      <td>{who}</td>
                      <td>{hw.class_name || '—'}</td>
                      <td>{formatSubmittedAt(sh.submission_date)}</td>
                      <td>{hw.due_date ? formatDueDate(hw.due_date) : '—'}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} style={{ opacity: 0.75 }}>
                    Nothing in this queue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <TeacherProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        profile={data}
        onSaved={load}
      />
    </>
  );
};

export default TeacherDashboardPage;
