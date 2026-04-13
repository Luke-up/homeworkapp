'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import axiosInterceptor from '@/utils/axiosInterceptor';
import ConfirmDialog from '@/components/ConfirmDialog/ConfirmDialog';
import { markValueToStarCount, starCountToMarkValue } from '@/utils/markStars';
import '@/styles/student-pages.scss';
import '../../../teacher/mark/[id]/teacher-mark.scss';

function normalizeAnswerRows(answers) {
  if (!Array.isArray(answers)) return [];
  return answers.map((a) => {
    if (a != null && typeof a === 'object') {
      return {
        question: String(a.question || '').trim(),
        answer: a.answer != null ? String(a.answer) : '',
      };
    }
    return { question: '', answer: String(a) };
  });
}

export default function SchoolMarkHomeworkPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [row, setRow] = useState(null);
  const [comment, setComment] = useState('');
  const [stars, setStars] = useState('0');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError('');
    try {
      const res = await axiosInterceptor.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/core/teacher-homework/${id}/`
      );
      setRow(res.data);
      setComment((res.data?.teacher_comment || '').trim());
      const filled = markValueToStarCount(res.data?.mark_value);
      setStars(String(filled));
    } catch (e) {
      console.error(e);
      setRow(null);
      setError('Could not load this submission.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const backHref = useMemo(() => {
    const cf = row?.homework?.class_field;
    if (cf != null && cf !== '') {
      return `/school/class/${cf}?tab=students`;
    }
    return '/school';
  }, [row]);

  const runSubmit = async () => {
    if (!row) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await axiosInterceptor.patch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/student-homework/update/`, {
        student_homework_id: row.id,
        teacher_comment: comment,
        mark_value: starCountToMarkValue(stars),
        marked: true,
      });
      setMessage('Saved.');
      setConfirmOpen(false);
      router.push(backHref);
    } catch (err) {
      const d = err.response?.data;
      setError(
        (typeof d?.error === 'string' && d.error) ||
          (typeof d?.detail === 'string' && d.detail) ||
          'Could not save.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="muted">Loading…</p>;
  }

  if (!row) {
    return (
      <div className="teacher-mark">
        <p className="muted">{loadError || 'Not found.'}</p>
        <Link href="/school" className="teacher-mark__back">
          ← Back to school dashboard
        </Link>
      </div>
    );
  }

  const hw = row.homework || {};
  const title = hw.title || 'Homework';
  const studentLabel = row.student_name || `Student #${row.student}`;
  const answerRows = normalizeAnswerRows(row.answers);

  return (
    <div className="teacher-mark">
      <Link href={backHref} className="teacher-mark__back">
        ← Back to class
      </Link>

      <header className="teacher-mark__head">
        <h1 className="teacher-mark__title">{title}</h1>
        <p className="teacher-mark__student">{studentLabel}</p>
      </header>

      {hw.reading ? (
        <section className="teacher-mark__reading">
          <h2>Reading</h2>
          <p>{hw.reading}</p>
        </section>
      ) : null}

      {answerRows.length ? (
        <section className="teacher-mark__answers">
          <h2>Answers</h2>
          {answerRows.map((r, i) => (
            <div className="teacher-mark__answer-item" key={`a-${i}`}>
              <strong>{r.question || `Question ${i + 1}`}</strong>
              <div>{r.answer || '—'}</div>
            </div>
          ))}
        </section>
      ) : (
        <p className="muted">No answers submitted.</p>
      )}

      <div className="teacher-mark__mark-block">
        <label htmlFor="school-mark-stars" className="teacher-mark__label">
          Effort
        </label>
        <select
          id="school-mark-stars"
          className="teacher-mark__select"
          value={stars}
          onChange={(e) => setStars(e.target.value)}
        >
          <option value="0">0</option>
          <option value="1">★</option>
          <option value="2">★★</option>
          <option value="3">★★★</option>
        </select>

        <label htmlFor="school-mark-comment" className="teacher-mark__label">
          Comment
        </label>
        <textarea
          id="school-mark-comment"
          className="teacher-mark__comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Feedback for the student"
        />

        <button
          type="button"
          className="teacher-mark__submit"
          disabled={saving}
          onClick={() => setConfirmOpen(true)}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>

        {message ? <p className="teacher-mark__done">{message}</p> : null}
        {error ? <p className="teacher-mark__error">{error}</p> : null}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Save marks?"
        message="Save the effort rating and comment for this student?"
        confirmLabel="Save"
        cancelLabel="Cancel"
        busy={saving}
        onCancel={() => !saving && setConfirmOpen(false)}
        onConfirm={() => runSubmit()}
      />
    </div>
  );
}
