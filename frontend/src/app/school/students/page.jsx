'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import axiosInterceptor from '@/utils/axiosInterceptor';
import MarkStars from '@/components/MarkStars/MarkStars';
import SchoolPersonModal from '@/components/SchoolPersonModal/SchoolPersonModal';
import '../school-directory.scss';

export default function SchoolStudentsSearchPage() {
  const [schoolData, setSchoolData] = useState(null);
  const [students, setStudents] = useState([]);
  const [classFilter, setClassFilter] = useState('');
  const [nameQuery, setNameQuery] = useState('');
  const [appliedClass, setAppliedClass] = useState('');
  const [appliedName, setAppliedName] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [schoolRes, stuRes] = await Promise.all([
        axiosInterceptor.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/classes/`),
        axiosInterceptor.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/students/`),
      ]);
      setSchoolData(schoolRes.data);
      setStudents(Array.isArray(stuRes.data) ? stuRes.data : []);
    } catch (e) {
      console.error(e);
      setSchoolData(null);
      setStudents([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const classes = useMemo(() => {
    const raw = schoolData?.classes;
    return Array.isArray(raw) ? raw : [];
  }, [schoolData]);

  const filtered = useMemo(() => {
    const q = appliedName.trim().toLowerCase();
    const cid = appliedClass ? Number(appliedClass) : null;
    return students.filter((s) => {
      if (cid && !(Array.isArray(s.enrolled_class_ids) && s.enrolled_class_ids.includes(cid))) {
        return false;
      }
      if (q && !(s.name || '').toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [students, appliedName, appliedClass]);

  const runSearch = (e) => {
    e?.preventDefault();
    setAppliedClass(classFilter);
    setAppliedName(nameQuery);
  };

  return (
    <div className="school-dir-page">
      <h1 className="school-dir-page__title">Student search</h1>

      <form className="school-dir-page__toolbar" onSubmit={runSearch}>
        <select
          className="school-dir-page__select"
          value={classFilter}
          onChange={(e) => {
            const v = e.target.value;
            setClassFilter(v);
            setAppliedClass(v);
          }}
          aria-label="Filter by classroom"
        >
          <option value="">All classrooms</option>
          {classes.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          className="school-dir-page__input"
          placeholder="Student name"
          value={nameQuery}
          onChange={(e) => setNameQuery(e.target.value)}
          aria-label="Student name"
        />
        <button type="submit" className="school-dir-page__search-btn">
          Search
        </button>
      </form>

      <div className="school-dir-page__strip">
        <div className="school-dir-page__strip-inner">
          <div className="school-dir-page__dark-head">
            <h2 className="school-dir-page__dark-title">Students</h2>
          <button
            type="button"
            className="school-dir-page__add-btn"
            onClick={() => setCreateOpen(true)}
          >
            Add new student
          </button>
        </div>

        {!students.length ? (
          <p className="school-dir-page__empty-msg">No students in this school yet.</p>
        ) : filtered.length ? (
          <div className="school-dir-page__grid">
            {filtered.map((s) => (
              <Link
                key={s.id}
                href={`/school/students/${s.id}`}
                className="school-dir-card school-dir-card--student-row"
              >
                <div className="school-dir-card__left">
                  {s.avatar_url ? (
                    <img className="school-dir-card__avatar" src={s.avatar_url} alt="" />
                  ) : (
                    <div className="school-dir-card__avatar-ph" aria-hidden>
                      {(s.first_name || s.name || '?').slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="school-dir-card__names">
                    <div>{s.first_name || '—'}</div>
                    <div>{s.last_name || ''}</div>
                  </div>
                </div>
                <div className="school-dir-card__right">
                  <MarkStars markValue={s.recent_five_avg_mark} variant="light" />
                  <div className="school-dir-card__stats">
                    Submitted: {s.assignments_active ?? 0}
                    <br />
                    Overdue: {s.assignments_overdue ?? 0}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="school-dir-page__empty-msg">No students match this search.</p>
        )}
        </div>
      </div>

      <SchoolPersonModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        variant="student"
        mode="create"
        recordId={null}
        initialName=""
        initialEmail=""
        onSuccess={load}
      />
    </div>
  );
}
