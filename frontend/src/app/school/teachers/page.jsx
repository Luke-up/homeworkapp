'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import axiosInterceptor from '@/utils/axiosInterceptor';
import SchoolPersonModal from '@/components/SchoolPersonModal/SchoolPersonModal';
import '../school-directory.scss';

export default function SchoolTeachersSearchPage() {
  const [schoolData, setSchoolData] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [classFilter, setClassFilter] = useState('');
  const [nameQuery, setNameQuery] = useState('');
  const [appliedClass, setAppliedClass] = useState('');
  const [appliedName, setAppliedName] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  const load = useCallback(async () => {
    try {
      const [schoolRes, tRes] = await Promise.all([
        axiosInterceptor.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/classes/`),
        axiosInterceptor.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/teachers/`),
      ]);
      setSchoolData(schoolRes.data);
      setTeachers(Array.isArray(tRes.data) ? tRes.data : []);
    } catch (e) {
      console.error(e);
      setSchoolData(null);
      setTeachers([]);
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
    return teachers.filter((t) => {
      if (cid && !(Array.isArray(t.class_ids) && t.class_ids.includes(cid))) {
        return false;
      }
      if (q && !(t.name || '').toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [teachers, appliedName, appliedClass]);

  const runSearch = (e) => {
    e?.preventDefault();
    setAppliedClass(classFilter);
    setAppliedName(nameQuery);
  };

  const openTeacherEdit = async (tid) => {
    try {
      const res = await axiosInterceptor.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/core/teachers/${tid}/`
      );
      setEditId(tid);
      setEditName(res.data?.name || '');
      setEditEmail(res.data?.email || '');
      setEditOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="school-dir-page">
      <h1 className="school-dir-page__title">Teacher search</h1>

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
          placeholder="Teacher name"
          value={nameQuery}
          onChange={(e) => setNameQuery(e.target.value)}
          aria-label="Teacher name"
        />
        <button type="submit" className="school-dir-page__search-btn">
          Search
        </button>
      </form>

      <div className="school-dir-page__strip">
        <div className="school-dir-page__strip-inner">
          <div className="school-dir-page__dark-head">
            <h2 className="school-dir-page__dark-title">Teachers</h2>
          <button
            type="button"
            className="school-dir-page__add-btn"
            onClick={() => setCreateOpen(true)}
          >
            Add new teacher
          </button>
        </div>

        {!teachers.length ? (
          <p className="school-dir-page__empty-msg">No teachers in this school yet.</p>
        ) : filtered.length ? (
          <div className="school-dir-page__grid">
            {filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                className="school-dir-card school-dir-card--teacher school-dir-card--teacher-split"
                onClick={() => openTeacherEdit(t.id)}
              >
                <div className="school-dir-card__teacher-left">
                  <div className="school-dir-card__teacher-avatar-wrap">
                    {t.avatar_url ? (
                      <img className="school-dir-card__avatar" src={t.avatar_url} alt="" />
                    ) : (
                      <div className="school-dir-card__avatar-ph" aria-hidden>
                        {(t.first_name || t.name || '?').slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="school-dir-card__names-stack">
                    <span>{t.first_name || '—'}</span>
                    <span>{t.last_name || ''}</span>
                  </div>
                </div>
                <div className="school-dir-card__teacher-classes">
                  {Array.isArray(t.class_names) && t.class_names.length ? (
                    t.class_names.map((name, i) => (
                      <span key={`${name}-${i}`} className="school-dir-card__class-line">
                        {name}
                      </span>
                    ))
                  ) : (
                    <span className="school-dir-card__class-line">No classes</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="school-dir-page__empty-msg">No teachers match this search.</p>
        )}
        </div>
      </div>

      <SchoolPersonModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        variant="teacher"
        mode="create"
        recordId={null}
        initialName=""
        initialEmail=""
        onSuccess={load}
      />

      <SchoolPersonModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditId(null);
        }}
        variant="teacher"
        mode="edit"
        recordId={editId}
        initialName={editName}
        initialEmail={editEmail}
        onSuccess={load}
      />
    </div>
  );
}
