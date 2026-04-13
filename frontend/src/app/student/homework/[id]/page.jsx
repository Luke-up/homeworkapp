'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import axiosInterceptor from '@/utils/axiosInterceptor';
import MarkStars from '@/components/MarkStars/MarkStars';
import ConfirmDialog from '@/components/ConfirmDialog/ConfirmDialog';
import '../../styles.scss';
import './homework-detail.scss';

function questionPrompt(q) {
  if (!q || typeof q !== 'object') return '';
  return String(q.question || q.q || '').trim();
}

/** Build local state: list of { question, answer } from API + homework template. */
function normalizeAnswerRows(questions, existing) {
  if (Array.isArray(existing) && existing.length > 0) {
    const first = existing[0];
    if (first && typeof first === 'object' && ('answer' in first || 'question' in first)) {
      const qs = Array.isArray(questions) ? questions : [];
      return existing.map((row, i) => ({
        question: String(row.question || (qs[i] ? questionPrompt(qs[i]) : '') || ''),
        answer: row.answer != null ? String(row.answer) : '',
      }));
    }
  }
  const qs = Array.isArray(questions) ? questions : [];
  const prev = Array.isArray(existing) ? existing : [];
  return qs.map((q, i) => ({
    question: questionPrompt(q),
    answer:
      prev[i] != null
        ? String(typeof prev[i] === 'object' && prev[i] !== null && 'answer' in prev[i] ? prev[i].answer : prev[i])
        : '',
  }));
}

export default function StudentHomeworkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [row, setRow] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await axiosInterceptor.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/core/student-homework/${id}/`
      );
      setRow(res.data);
      const hw = res.data?.homework || {};
      setDrafts(normalizeAnswerRows(hw.questions, res.data?.answers));
    } catch (e) {
      console.error(e);
      setRow(null);
      setError('Could not load this assignment.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const hw = row?.homework || {};
  const words = Array.isArray(hw.words) ? hw.words : [];
  const submitted = Boolean(row?.submitted);
  const marked = Boolean(row?.marked);
  const editable = !submitted;

  const setAnswer = (index, value) => {
    setDrafts((prev) => {
      const line = prev.map((r, j) =>
        j === index ? { ...r, answer: value } : r
      );
      return line;
    });
  };

  const runSubmit = async () => {
    if (!row || submitted) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await axiosInterceptor.patch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/student-homework/update/`, {
        student_homework_id: row.id,
        answers: drafts,
        submitted: true,
        submission_date: new Date().toISOString(),
      });
      setMessage('Submitted.');
      setSubmitConfirmOpen(false);
      router.push('/student');
    } catch (err) {
      const d = err.response?.data;
      setError(
        (typeof d?.error === 'string' && d.error) ||
          (typeof d?.detail === 'string' && d.detail) ||
          'Could not submit.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="muted">Loading…</p>;
  }

  if (!row || error) {
    return (
      <div className="hw-detail">
        <p className="muted">{error || 'Assignment not found.'}</p>
        <Link href="/student" className="hw-detail__back">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const title = hw.title || 'Homework';
  const comment = (row.teacher_comment || '').trim();

  return (
    <div className="hw-detail">
      <Link href="/student" className="hw-detail__back">
        ← Back to dashboard
      </Link>

      <header className="hw-detail__header">
        <div className="hw-detail__mark-badge" aria-label="Effort">
          <MarkStars markValue={row.mark_value} />
        </div>
        <h1 className="student-page-title">{title}</h1>
      </header>

      {marked && comment ? (
        <section className="hw-detail__teacher-box" aria-labelledby="hw-teacher-comment">
          <h2 id="hw-teacher-comment">Teacher comment</h2>
          <p>{comment}</p>
        </section>
      ) : null}

      {hw.reading ? (
        <section className="hw-detail__reading" aria-labelledby="hw-reading-h">
          <strong id="hw-reading-h">Reading</strong>
          <p>{hw.reading}</p>
        </section>
      ) : null}

      {words.length ? (
        <section className="hw-detail__words" aria-label="Vocabulary">
          <h2 className="hw-detail__words-title">Words</h2>
          {words.map((w, i) => (
            <div className="hw-detail__word-row" key={`${w.word}-${i}`}>
              <span className="hw-detail__word-term">{w.word}</span>
              <span className="hw-detail__word-sent">{w.example_sentence || ''}</span>
            </div>
          ))}
        </section>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!submitted) setSubmitConfirmOpen(true);
        }}
      >
        {drafts.map((d, i) => (
          <div className="hw-detail__question-block" key={`q-${i}-${d.question.slice(0, 24)}`}>
            <label htmlFor={`hw-q-${row.id}-${i}`}>{d.question || `Question ${i + 1}`}</label>
            <textarea
              id={`hw-q-${row.id}-${i}`}
              value={d.answer}
              disabled={!editable}
              onChange={(e) => setAnswer(i, e.target.value)}
              placeholder="Your answer"
            />
          </div>
        ))}

        {!drafts.length ? <p className="muted">No questions for this assignment.</p> : null}

        <div className="hw-detail__footer">
          {editable ? (
            <button type="submit" className="hw-detail__submit" disabled={saving}>
              {saving ? 'Submitting…' : 'Submit'}
            </button>
          ) : (
            <p className="hw-detail__status">
              Submitted
              {marked ? ' with teacher feedback.' : '; awaiting teacher feedback.'}
            </p>
          )}
          {message ? <span className="hw-detail__status">{message}</span> : null}
        </div>
        {error ? <p className="hw-detail__error">{error}</p> : null}
      </form>

      <ConfirmDialog
        open={submitConfirmOpen}
        title="Submit homework?"
        message="Are you sure you want to submit? You will not be able to change your answers after submitting."
        confirmLabel="Yes, submit"
        cancelLabel="Keep editing"
        busy={saving}
        onCancel={() => !saving && setSubmitConfirmOpen(false)}
        onConfirm={() => runSubmit()}
      />
    </div>
  );
}
