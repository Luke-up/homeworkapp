'use client';

import { useCallback, useEffect, useState } from 'react';
import axiosInterceptor from '@/utils/axiosInterceptor';
import SchoolClassBlock from '@/components/SchoolClassBlock/SchoolClassBlock';
import './school-dashboard.scss';

export default function SchoolDashboardPage() {
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingClassId, setEditingClassId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await axiosInterceptor.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/classes/`);
      setSchool(res.data);
    } catch (e) {
      console.error(e);
      setSchool(null);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  useEffect(() => {
    if (editingClassId == null || !school?.classes) return;
    const exists = school.classes.some((c) => c.id === editingClassId);
    if (!exists) setEditingClassId(null);
  }, [school, editingClassId]);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    const name = newClassName.trim();
    if (!name) return;
    setCreating(true);
    setCreateError('');
    try {
      await axiosInterceptor.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/classes/create`, {
        name,
        description: '',
        level: 1,
      });
      setNewClassName('');
      setShowCreate(false);
      setEditingClassId(null);
      await load(true);
    } catch (err) {
      const d = err.response?.data;
      setCreateError(
        (typeof d?.error === 'string' && d.error) ||
          (typeof d?.detail === 'string' && d.detail) ||
          'Could not create class.'
      );
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <p className="school-dashboard__muted">Loading…</p>;
  }

  if (!school) {
    return <p className="school-dashboard__muted">Could not load school data.</p>;
  }

  const classes = Array.isArray(school.classes) ? school.classes : [];
  const teachers = Array.isArray(school.teachers) ? school.teachers : [];
  const students = Array.isArray(school.students) ? school.students : [];

  return (
    <div className="school-dashboard">
      <header className="school-dashboard__intro">
        <h1 className="school-dashboard__school-name">{school.name || 'School'}</h1>
        <p className="school-dashboard__stats">
          <strong>{teachers.length}</strong> teacher{teachers.length === 1 ? '' : 's'} ·{' '}
          <strong>{students.length}</strong> student{students.length === 1 ? '' : 's'}
        </p>
      </header>

      <div className="school-dashboard__classes">
        {classes.length ? (
          classes.map((c) => (
            <SchoolClassBlock
              key={c.id}
              classItem={c}
              allTeachers={teachers}
              allStudents={students}
              onChanged={() => load(true)}
              editing={editingClassId === c.id}
              onToggleEdit={() =>
                setEditingClassId((cur) => (cur === c.id ? null : c.id))
              }
            />
          ))
        ) : (
          <p className="school-dashboard__muted">No classes yet. Create one below.</p>
        )}
      </div>

      <button
        type="button"
        className="school-dashboard__create-toggle"
        onClick={() => {
          setEditingClassId(null);
          setShowCreate((v) => !v);
          setCreateError('');
        }}
      >
        {showCreate ? 'Cancel' : 'Create class'}
      </button>

      {showCreate ? (
        <div className="school-dashboard__create-panel">
          <form className="school-dashboard__create-form" onSubmit={handleCreateClass}>
            <input
              className="school-dashboard__create-input"
              placeholder="Class name"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              aria-label="New class name"
              required
            />
            <button type="submit" className="school-dashboard__create-submit" disabled={creating}>
              {creating ? 'Creating…' : 'Add class'}
            </button>
          </form>
          {createError ? <p className="school-dashboard__muted">{createError}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
