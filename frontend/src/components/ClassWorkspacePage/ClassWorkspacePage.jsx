'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import axiosInterceptor from '@/utils/axiosInterceptor';
import TeacherProfileModal from '@/components/TeacherProfileModal/TeacherProfileModal';
import { formatDueDate } from '@/utils/formatDueDate';
import '@/styles/student-pages.scss';
import '@/app/teacher/class/teacher-class-page.scss';

function routesForRole(role, classId) {
  const id = classId;
  if (role === 'school') {
    return {
      back: '/school',
      backLabel: '← Back to school dashboard',
      mark: (shId) => `/school/mark/${shId}`,
      createHw: `/school/class/${id}/homework/create`,
      hwDetail: (hwId) => `/school/class/${id}/homework/${hwId}`,
    };
  }
  return {
    back: '/teacher',
    backLabel: '← Back to dashboard',
    mark: (shId) => `/teacher/mark/${shId}`,
    createHw: `/teacher/class/${id}/homework/create`,
    hwDetail: (hwId) => `/teacher/class/${id}/homework/${hwId}`,
  };
}

export default function ClassWorkspacePage({ role }) {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params?.id;
  const r = routesForRole(role, id);

  const [tab, setTab] = useState(() =>
    searchParams.get('tab') === 'homework' ? 'homework' : 'students'
  );
  const [profile, setProfile] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [classWork, setClassWork] = useState(null);
  const [homeworkList, setHomeworkList] = useState([]);
  const [hwOrder, setHwOrder] = useState('new');
  const [expanded, setExpanded] = useState(() => new Set());
  const [error, setError] = useState('');

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'homework') setTab('homework');
    if (t === 'students') setTab('students');
  }, [searchParams]);

  const load = useCallback(async () => {
    if (!id) return;
    setError('');
    try {
      if (role === 'teacher') {
        const [dashRes, workRes, hwRes] = await Promise.all([
          axiosInterceptor.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/teacher-dashboard/`),
          axiosInterceptor.get(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/core/teacher-class/${id}/students-work/`
          ),
          axiosInterceptor.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/homework/`, {
            params: { class_id: id },
          }),
        ]);
        setProfile(dashRes.data);
        setClassWork(workRes.data);
        setHomeworkList(Array.isArray(hwRes.data) ? hwRes.data : []);
      } else {
        const [workRes, hwRes] = await Promise.all([
          axiosInterceptor.get(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/core/teacher-class/${id}/students-work/`
          ),
          axiosInterceptor.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/homework/`, {
            params: { class_id: id },
          }),
        ]);
        setProfile(null);
        setClassWork(workRes.data);
        setHomeworkList(Array.isArray(hwRes.data) ? hwRes.data : []);
      }
    } catch (e) {
      console.error(e);
      setError('Could not load this class.');
      setClassWork(null);
    }
  }, [id, role]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleExpanded = (studentId) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const classTitle = classWork?.class_name || `Class ${id || ''}`;

  const sortedHomework = useMemo(() => {
    const list = [...homeworkList];
    list.sort((a, b) => {
      const ia = Number(a.id) || 0;
      const ib = Number(b.id) || 0;
      return hwOrder === 'new' ? ib - ia : ia - ib;
    });
    return list;
  }, [homeworkList, hwOrder]);

  if (!id) {
    return null;
  }

  return (
    <div className="teacher-class-page">
      <Link href={r.back} className="teacher-class-page__back">
        {r.backLabel}
      </Link>

      <header
        className={`student-dash-header${role === 'school' ? ' student-dash-header--no-side-badge' : ''}`}
      >
        <h1 className="student-page-title">{classTitle}</h1>
        {role === 'teacher' ? (
          <button
            type="button"
            className="student-dash-header__badge"
            onClick={() => setProfileModalOpen(true)}
            disabled={!profile}
          >
            Teacher account
          </button>
        ) : null}
      </header>

      {error ? <p className="muted">{error}</p> : null}

      <div className="teacher-class-page__tabs" role="tablist" aria-label="Class views">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'students'}
          className={`teacher-class-page__tab${tab === 'students' ? ' is-active' : ''}`}
          onClick={() => setTab('students')}
        >
          Students
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'homework'}
          className={`teacher-class-page__tab${tab === 'homework' ? ' is-active' : ''}`}
          onClick={() => setTab('homework')}
        >
          Homework
        </button>
      </div>

      <div className="teacher-class-page__panel" role="tabpanel">
        {tab === 'students' ? (
          !classWork?.students?.length ? (
            <p className="muted">No students in this class.</p>
          ) : (
            <div className="teacher-class-acc">
              {classWork.students.map((stu) => {
                const isOpen = expanded.has(stu.id);
                return (
                  <div key={stu.id} className="teacher-class-acc__item">
                    <button
                      type="button"
                      className="teacher-class-acc__head"
                      aria-expanded={isOpen}
                      onClick={() => toggleExpanded(stu.id)}
                    >
                      <span className="teacher-class-acc__name">{stu.name}</span>
                      <span className="teacher-class-acc__counts">
                        <span>Pending: {stu.pending_count}</span>
                        <span>Unmarked: {stu.unmarked_count}</span>
                        <span className="teacher-class-acc__chev" aria-hidden>
                          {isOpen ? '−' : '+'}
                        </span>
                      </span>
                    </button>
                    {isOpen ? (
                      <div className="teacher-class-acc__panel">
                        <div className="teacher-class-acc__sub">
                          <h3>Submitted</h3>
                          {!stu.unmarked?.length ? (
                            <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
                              None
                            </p>
                          ) : (
                            stu.unmarked.map((row) => (
                              <div key={row.student_homework_id} className="teacher-class-acc__row">
                                <button
                                  type="button"
                                  className="teacher-class-acc__link"
                                  onClick={() => router.push(r.mark(row.student_homework_id))}
                                >
                                  {row.homework_title}
                                </button>
                                <span className="teacher-class-acc__due">
                                  {row.due_date ? formatDueDate(row.due_date) : '—'}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="teacher-class-acc__sub">
                          <h3>Not yet submitted</h3>
                          {!stu.pending?.length ? (
                            <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
                              None
                            </p>
                          ) : (
                            stu.pending.map((row) => (
                              <div key={row.student_homework_id} className="teacher-class-acc__row">
                                <span>{row.homework_title}</span>
                                <span className="teacher-class-acc__due">
                                  {row.due_date ? formatDueDate(row.due_date) : '—'}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <>
            <div className="teacher-class-page__hw-toolbar">
              <Link href={r.createHw} className="teacher-class-page__create-assignment">
                Create assignment
              </Link>
              <div className="teacher-class-page__hw-toolbar-right">
                <label htmlFor="class-hw-order" className="teacher-class-page__hw-order-label">
                  Order by
                </label>
                <select
                  id="class-hw-order"
                  className="teacher-class-page__hw-order-select"
                  value={hwOrder}
                  onChange={(e) => setHwOrder(e.target.value)}
                  aria-label="Sort homework list"
                >
                  <option value="new">Date (newest first)</option>
                  <option value="old">Date (oldest first)</option>
                </select>
              </div>
            </div>
            {sortedHomework.length ? (
              <div className="teacher-class-page__hw-table-wrap">
                <table className="teacher-class-page__hw-table">
                  <thead>
                    <tr>
                      <th scope="col">Title</th>
                      <th scope="col">Due date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedHomework.map((hw) => {
                      const open = () => router.push(r.hwDetail(hw.id));
                      return (
                        <tr
                          key={hw.id}
                          className="teacher-class-page__hw-row"
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
                          <td>{hw.title}</td>
                          <td>{hw.due_date ? formatDueDate(hw.due_date) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted">No homework templates for this class yet.</p>
            )}
          </>
        )}
      </div>

      {role === 'teacher' && profile ? (
        <TeacherProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          profile={profile}
          onSaved={load}
        />
      ) : null}
    </div>
  );
}
