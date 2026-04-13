'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import axiosInterceptor from '@/utils/axiosInterceptor';
import './school-class-block.scss';

const MAX_SUGGEST = 10;

function useOnClickOutside(ref, handler, enabled) {
  useEffect(() => {
    if (!enabled) return undefined;
    const fn = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        handler();
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [ref, handler, enabled]);
}

export default function SchoolClassBlock({ classItem, allTeachers, allStudents, onChanged, editing, onToggleEdit }) {
  const teacherIds = Array.isArray(classItem.teachers) ? classItem.teachers : [];
  const studentIds = Array.isArray(classItem.students) ? classItem.students : [];
  const [nameDraft, setNameDraft] = useState(classItem.name || '');
  const [savingName, setSavingName] = useState(false);

  const [teacherQuery, setTeacherQuery] = useState('');
  const [studentQuery, setStudentQuery] = useState('');
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [studentOpen, setStudentOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const teacherWrapRef = useRef(null);
  const studentWrapRef = useRef(null);

  useEffect(() => {
    setNameDraft(classItem.name || '');
  }, [classItem.name]);

  const teachersInClass = useMemo(() => {
    return teacherIds
      .map((id) => allTeachers.find((t) => t.id === id))
      .filter(Boolean);
  }, [teacherIds, allTeachers]);

  const studentsInClass = useMemo(() => {
    return studentIds
      .map((id) => allStudents.find((s) => s.id === id))
      .filter(Boolean)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [studentIds, allStudents]);

  const teacherSuggestions = useMemo(() => {
    const q = teacherQuery.trim().toLowerCase();
    if (q.length < 1) return [];
    return allTeachers
      .filter((t) => !teacherIds.includes(t.id))
      .filter((t) => (t.name || '').toLowerCase().includes(q))
      .slice(0, MAX_SUGGEST);
  }, [allTeachers, teacherIds, teacherQuery]);

  const studentSuggestions = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    if (q.length < 1) return [];
    return allStudents
      .filter((s) => !studentIds.includes(s.id))
      .filter((s) => (s.name || '').toLowerCase().includes(q))
      .slice(0, MAX_SUGGEST);
  }, [allStudents, studentIds, studentQuery]);

  const closeTeacherSuggest = useCallback(() => setTeacherOpen(false), []);
  const closeStudentSuggest = useCallback(() => setStudentOpen(false), []);
  useOnClickOutside(teacherWrapRef, closeTeacherSuggest, teacherOpen);
  useOnClickOutside(studentWrapRef, closeStudentSuggest, studentOpen);

  const isEmpty = teacherIds.length === 0 && studentIds.length === 0;

  const saveClassName = async () => {
    const next = nameDraft.trim();
    if (!next || next === classItem.name) {
      return;
    }
    setSavingName(true);
    try {
      await axiosInterceptor.patch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/classes/edit/`, {
        class_id: classItem.id,
        name: next,
      });
      await onChanged();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingName(false);
    }
  };

  const assignTeacher = async (teacherId) => {
    setBusy(true);
    try {
      await axiosInterceptor.patch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/classes/update/`, {
        class_id: classItem.id,
        teacher_id: teacherId,
      });
      setTeacherQuery('');
      setTeacherOpen(false);
      await onChanged();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const assignStudent = async (studentId) => {
    setBusy(true);
    try {
      await axiosInterceptor.patch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/classes/update/`, {
        class_id: classItem.id,
        student_id: studentId,
      });
      setStudentQuery('');
      setStudentOpen(false);
      await onChanged();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const removeTeacher = async (teacherId) => {
    setBusy(true);
    try {
      await axiosInterceptor.patch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/classes/update/`, {
        class_id: classItem.id,
        teacher_id: teacherId,
        remove: true,
      });
      await onChanged();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const removeStudent = async (studentId) => {
    setBusy(true);
    try {
      await axiosInterceptor.patch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/classes/update/`, {
        class_id: classItem.id,
        student_id: studentId,
        remove: true,
      });
      await onChanged();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const deleteClass = async () => {
    if (!isEmpty) return;
    setBusy(true);
    try {
      await axiosInterceptor.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/classes/delete/`, {
        data: { class_id: classItem.id },
      });
      await onChanged();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const addTeacherFromInput = async () => {
    if (busy) return;
    if (teacherSuggestions.length === 1) {
      await assignTeacher(teacherSuggestions[0].id);
      return;
    }
    const q = teacherQuery.trim().toLowerCase();
    if (!q) {
      setTeacherOpen(true);
      return;
    }
    const exact = allTeachers.find(
      (t) => !teacherIds.includes(t.id) && (t.name || '').trim().toLowerCase() === q
    );
    if (exact) {
      await assignTeacher(exact.id);
      return;
    }
    setTeacherOpen(true);
  };

  const addStudentFromInput = async () => {
    if (busy) return;
    if (studentSuggestions.length === 1) {
      await assignStudent(studentSuggestions[0].id);
      return;
    }
    const q = studentQuery.trim().toLowerCase();
    if (!q) {
      setStudentOpen(true);
      return;
    }
    const exact = allStudents.find(
      (s) => !studentIds.includes(s.id) && (s.name || '').trim().toLowerCase() === q
    );
    if (exact) {
      await assignStudent(exact.id);
      return;
    }
    setStudentOpen(true);
  };

  const handleEditToggleClick = async () => {
    if (editing) {
      await saveClassName();
      setTeacherOpen(false);
      setStudentOpen(false);
      onToggleEdit();
    } else {
      setNameDraft(classItem.name || '');
      setTeacherOpen(false);
      setStudentOpen(false);
      onToggleEdit();
    }
  };

  return (
    <section className="school-class-block">
      <div className="school-class-block__head">
        <div className="school-class-block__title-row">
          <div className="school-class-block__title-line">
            {!editing ? (
              <Link href={`/school/class/${classItem.id}`} className="school-class-block__title-link">
                <h2 className="school-class-block__title">{classItem.name}</h2>
              </Link>
            ) : (
              <div className="school-class-block__rename">
                <input
                  className="school-class-block__name-input"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  aria-label="Class name"
                  disabled={savingName}
                />
              </div>
            )}

            {teachersInClass.length ? (
              <span className="school-class-block__title-sep" aria-hidden>
                ·
              </span>
            ) : null}

            <div className="school-class-block__teachers-inline">
              {teachersInClass.map((t) => (
                <span key={t.id} className="school-class-block__teacher-chip">
                  {editing ? (
                    <button
                      type="button"
                      className="school-class-block__chip-remove"
                      aria-label={`Remove ${t.name} from class`}
                      disabled={busy}
                      onClick={() => removeTeacher(t.id)}
                    >
                      ×
                    </button>
                  ) : null}
                  <span className="school-class-block__chip-label">{t.name}</span>
                </span>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="school-class-block__edit-btn"
            aria-label={editing ? 'Save and stop editing class' : 'Edit class'}
            aria-expanded={editing}
            disabled={savingName}
            onClick={() => handleEditToggleClick()}
          >
            {editing ? (
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden fill="none">
                <path
                  d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"
                  fill="currentColor"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="none">
                <path
                  d="M4 16.5V20h3.5L17.5 10 14 6.5 4 16.5zM20.7 7a1 1 0 0 0 0-1.4L18.4 3.3a1 1 0 0 0-1.4 0l-1.8 1.8L18 8.5l1.7-1.7z"
                  fill="currentColor"
                />
              </svg>
            )}
          </button>
        </div>

        {editing ? (
          <div className="school-class-block__teacher-add-bar">
            <span className="school-class-block__add-label">Add teacher</span>
            <div className="school-class-block__add-inline school-class-block__add-inline--teacher">
              <div className="school-class-block__typeahead" ref={teacherWrapRef}>
                <input
                  type="text"
                  className="school-class-block__typeahead-input"
                  placeholder="Type a teacher name…"
                  value={teacherQuery}
                  disabled={busy}
                  onChange={(e) => {
                    setTeacherQuery(e.target.value);
                    setTeacherOpen(true);
                  }}
                  onFocus={() => setTeacherOpen(true)}
                  autoComplete="off"
                />
                {teacherOpen && teacherSuggestions.length ? (
                  <ul className="school-class-block__suggestions" role="listbox">
                    {teacherSuggestions.map((t) => (
                      <li key={t.id}>
                        <button
                          type="button"
                          className="school-class-block__suggestion"
                          role="option"
                          onClick={() => assignTeacher(t.id)}
                        >
                          {t.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <button
                type="button"
                className="school-class-block__add-confirm"
                disabled={busy}
                onClick={() => addTeacherFromInput()}
              >
                Add
              </button>
            </div>
          </div>
        ) : null}

        {editing ? (
          <div className="school-class-block__edit-panel">
            <div className="school-class-block__add-row school-class-block__add-row--student-full">
              <span className="school-class-block__add-label">Add student</span>
              <div className="school-class-block__add-inline school-class-block__add-inline--stretch">
                <div className="school-class-block__typeahead" ref={studentWrapRef}>
                  <input
                    type="text"
                    className="school-class-block__typeahead-input"
                    placeholder="Type a student name…"
                    value={studentQuery}
                    disabled={busy}
                    onChange={(e) => {
                      setStudentQuery(e.target.value);
                      setStudentOpen(true);
                    }}
                    onFocus={() => setStudentOpen(true)}
                    autoComplete="off"
                  />
                  {studentOpen && studentSuggestions.length ? (
                    <ul className="school-class-block__suggestions" role="listbox">
                      {studentSuggestions.map((s) => (
                        <li key={s.id}>
                          <button
                            type="button"
                            className="school-class-block__suggestion"
                            role="option"
                            onClick={() => assignStudent(s.id)}
                          >
                            {s.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="school-class-block__add-confirm"
                  disabled={busy}
                  onClick={() => addStudentFromInput()}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="school-class-block__student-table" role="table" aria-label="Students in this class">
        <div role="rowgroup">
          {studentsInClass.length ? (
            studentsInClass.map((s, i) => (
              <div
                key={s.id}
                className={`school-class-block__student-row${i % 2 === 0 ? ' is-a' : ' is-b'}`}
                role="row"
              >
                <span role="cell">{s.name}</span>
                {editing ? (
                  <button
                    type="button"
                    className="school-class-block__row-x"
                    aria-label={`Remove ${s.name}`}
                    disabled={busy}
                    role="cell"
                    onClick={() => removeStudent(s.id)}
                  >
                    ×
                  </button>
                ) : (
                  <span className="school-class-block__row-spacer" role="cell" />
                )}
              </div>
            ))
          ) : (
            <div className="school-class-block__student-row is-a school-class-block__empty-students" role="row">
              <span role="cell">No students in this class yet.</span>
            </div>
          )}
        </div>
      </div>

      {isEmpty ? (
        <div className="school-class-block__danger-zone">
          <button
            type="button"
            className="school-class-block__remove-class"
            disabled={busy}
            onClick={() => deleteClass()}
          >
            Remove classroom
          </button>
        </div>
      ) : null}
    </section>
  );
}
