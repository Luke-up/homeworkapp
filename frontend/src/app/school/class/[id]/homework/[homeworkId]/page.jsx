'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import axiosInterceptor from '@/utils/axiosInterceptor';
import { formatDueDate } from '@/utils/formatDueDate';
import '@/styles/student-pages.scss';
import '../../../../../teacher/mark/[id]/teacher-mark.scss';

function questionText(q) {
  if (!q || typeof q !== 'object') return '';
  return String(q.question || q.q || '').trim();
}

export default function SchoolHomeworkTemplateViewPage() {
  const params = useParams();
  const classId = params?.id;
  const homeworkId = params?.homeworkId;
  const [hw, setHw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!homeworkId) return;
    setLoading(true);
    setError('');
    try {
      const res = await axiosInterceptor.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/core/homework/${homeworkId}/`
      );
      setHw(res.data);
    } catch (e) {
      console.error(e);
      setHw(null);
      setError('Could not load this assignment.');
    } finally {
      setLoading(false);
    }
  }, [homeworkId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <p className="muted">Loading…</p>;
  }

  if (!hw || error) {
    return (
      <div className="teacher-mark">
        <p className="muted">{error || 'Not found.'}</p>
        <Link href={`/school/class/${classId}?tab=homework`} className="teacher-mark__back">
          ← Back to class
        </Link>
      </div>
    );
  }

  const title = hw.title || 'Assignment';
  const questions = Array.isArray(hw.questions) ? hw.questions : [];
  const words = Array.isArray(hw.words) ? hw.words : [];

  return (
    <div className="teacher-mark">
      <Link href={`/school/class/${classId}?tab=homework`} className="teacher-mark__back">
        ← Back to class
      </Link>

      <header className="teacher-mark__head">
        <h1 className="teacher-mark__title">{title}</h1>
        {hw.due_date ? (
          <p className="teacher-mark__student">Due {formatDueDate(hw.due_date)}</p>
        ) : null}
      </header>

      {hw.summary ? (
        <section className="teacher-mark__reading">
          <h2>Summary</h2>
          <p>{hw.summary}</p>
        </section>
      ) : null}

      {hw.reading ? (
        <section className="teacher-mark__reading">
          <h2>Reading</h2>
          <p>{hw.reading}</p>
        </section>
      ) : null}

      {words.length ? (
        <section className="teacher-mark__answers">
          <h2>Vocabulary</h2>
          {words.map((w, i) => (
            <div className="teacher-mark__answer-item" key={`w-${i}`}>
              <strong>{w.word || `Word ${i + 1}`}</strong>
              <div>{w.example_sentence || '—'}</div>
            </div>
          ))}
        </section>
      ) : null}

      {questions.length ? (
        <section className="teacher-mark__answers">
          <h2>Questions</h2>
          {questions.map((q, i) => (
            <div className="teacher-mark__answer-item" key={`q-${i}`}>
              <strong>{questionText(q) || `Question ${i + 1}`}</strong>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
