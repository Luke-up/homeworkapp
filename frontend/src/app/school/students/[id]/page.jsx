'use client';

import '../../school-directory.scss';
import './styles.scss';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axiosInterceptor from '@/utils/axiosInterceptor';
import MarkStars from '@/components/MarkStars/MarkStars';
import SchoolPersonModal from '@/components/SchoolPersonModal/SchoolPersonModal';
import { formatDueDate } from '@/utils/formatDueDate';
import { splitDisplayName } from '@/utils/splitDisplayName';

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

function dueTs(row) {
  if (!row.due_date) return null;
  const parts = String(row.due_date).split('T')[0].split('-').map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]).getTime();
}

function submittedTs(row) {
  if (!row.date_submitted) return null;
  const t = new Date(row.date_submitted).getTime();
  return Number.isNaN(t) ? null : t;
}

export default function SchoolStudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [student, setStudent] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [filterMode, setFilterMode] = useState('all');
  const [order, setOrder] = useState('new');

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await axiosInterceptor.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/core/students/${id}/`
      );
      setStudent(res.data);
    } catch (e) {
      console.error(e);
      setStudent(null);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const raw = student?.assignment_directory;
    if (!Array.isArray(raw)) return [];
    let list = [...raw];
    if (filterMode === 'overdue') list = list.filter((r) => r.is_overdue);
    else if (filterMode === 'completed') list = list.filter((r) => r.submitted);
    else if (filterMode === 'recent') list = list.filter((r) => r.in_academic_year);

    const mult = order === 'new' ? -1 : 1;
    list.sort((a, b) => {
      const da = dueTs(a);
      const db = dueTs(b);
      if (da != null && db != null && da !== db) return (da - db) * mult;
      if (da != null && db == null) return -1 * mult;
      if (da == null && db != null) return 1 * mult;
      const sa = submittedTs(a);
      const sb = submittedTs(b);
      if (sa != null && sb != null && sa !== sb) return (sa - sb) * mult;
      return (a.id - b.id) * mult;
    });
    return list;
  }, [student, filterMode, order]);

  if (!student) {
    return <p className="school-dashboard__muted">Loading…</p>;
  }

  const enrolled = Array.isArray(student.enrolled_classes) ? student.enrolled_classes : [];
  const { first: hFirst, last: hLast } = splitDisplayName(student.name);

  return (
    <div className="school-student-profile school-student-profile--constrained">
      <Link href="/school/students" className="school-student-profile__back">
        ← Student search
      </Link>

      <header className="school-student-profile__header">
        <div className="school-student-profile__effort">
          <MarkStars markValue={student.recent_five_avg_mark} />
        </div>
        <div className="school-student-profile__title-wrap">
          <h1 className="school-student-profile__title">
            {[hFirst, hLast].filter(Boolean).join(' ') || student.name}
          </h1>
        </div>
        <button type="button" className="school-student-profile__update" onClick={() => setEditOpen(true)}>
          Update
        </button>
      </header>

      <SchoolPersonModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        variant="student"
        mode="edit"
        recordId={student.id}
        initialName={student.name || ''}
        initialEmail={student.email || ''}
        onSuccess={load}
        onDeleted={() => router.push('/school/students')}
      />

      <h2 className="school-student-profile__section-title">Classes</h2>
      <div className="school-student-profile__class-grid">
        {enrolled.length ? (
          enrolled.map((c) => {
            const h = hueFromId(c.id);
            return (
              <Link
                key={c.id}
                href={`/school/class/${c.id}`}
                className="school-student-profile__class-tile"
              >
                <div
                  className="school-student-profile__class-tile-bg"
                  style={{
                    background: `linear-gradient(145deg, hsl(${h}, 42%, 32%), hsl(${h}, 55%, 16%))`,
                  }}
                />
                <div className="school-student-profile__class-tile-overlay">{c.name}</div>
              </Link>
            );
          })
        ) : (
          <p className="school-dashboard__muted">Not assigned to any class.</p>
        )}
      </div>

      <div className="school-student-profile__assign-head">
        <h2 className="school-student-profile__section-title">Assignments</h2>
      </div>

      <div className="school-student-profile__assign-toolbar">
        <div className="school-student-profile__filters" role="radiogroup" aria-label="Assignment filter">
          <label className="school-student-profile__radio">
            <input
              type="radio"
              name="assign-filter"
              checked={filterMode === 'all'}
              onChange={() => setFilterMode('all')}
            />
            All
          </label>
          <label className="school-student-profile__radio">
            <input
              type="radio"
              name="assign-filter"
              checked={filterMode === 'overdue'}
              onChange={() => setFilterMode('overdue')}
            />
            Overdue
          </label>
          <label className="school-student-profile__radio">
            <input
              type="radio"
              name="assign-filter"
              checked={filterMode === 'completed'}
              onChange={() => setFilterMode('completed')}
            />
            Completed
          </label>
          <label className="school-student-profile__radio">
            <input
              type="radio"
              name="assign-filter"
              checked={filterMode === 'recent'}
              onChange={() => setFilterMode('recent')}
            />
            Recent
          </label>
        </div>
        <div className="school-student-profile__order">
          <span>Order by</span>
          <select value={order} onChange={(e) => setOrder(e.target.value)} aria-label="Sort assignments">
            <option value="new">Date (newest first)</option>
            <option value="old">Date (oldest first)</option>
          </select>
        </div>
      </div>

      <div className="school-student-profile__table-wrap">
        <table className="school-student-profile__table">
          <thead>
            <tr>
              <th scope="col">Assignment name</th>
              <th scope="col">Classroom</th>
              <th scope="col">Date submitted</th>
              <th scope="col">Due date</th>
              <th scope="col">Effort</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.assignment_name || '—'}</td>
                  <td>{r.classroom || '—'}</td>
                  <td>{r.submitted ? formatSubmittedAt(r.date_submitted) : '—'}</td>
                  <td>{r.due_date ? formatDueDate(r.due_date) : '—'}</td>
                  <td>
                    {r.marked && r.mark_value != null ? <MarkStars markValue={r.mark_value} /> : '—'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ opacity: 0.75 }}>
                  No assignments in this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
