'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import axiosInterceptor from '@/utils/axiosInterceptor';
import ConfirmDialog from '@/components/ConfirmDialog/ConfirmDialog';
import PexelsImagePicker from '@/components/PexelsImagePicker/PexelsImagePicker';
import '@/styles/student-pages.scss';
import '@/app/teacher/mark/[id]/teacher-mark.scss';
import './homework-create-form.scss';

export default function HomeworkCreateForm({ variant }) {
  const params = useParams();
  const router = useRouter();
  const classId = params?.id;
  const [classLevel, setClassLevel] = useState(1);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [reading, setReading] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [words, setWords] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const idPrefix = variant === 'school' ? 'school-hw' : 'hw';

  const loadClassMeta = useCallback(async () => {
    if (!classId) return;
    try {
      if (variant === 'teacher') {
        const res = await axiosInterceptor.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/core/teacher-dashboard/`
        );
        const summaries = res.data?.class_summaries || [];
        const row = summaries.find((c) => String(c.id) === String(classId));
        if (row && row.level != null) {
          setClassLevel(Number(row.level) || 1);
        }
      } else {
        const res = await axiosInterceptor.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/classes/`);
        const classes = Array.isArray(res.data?.classes) ? res.data.classes : [];
        const row = classes.find((c) => String(c.id) === String(classId));
        if (row && row.level != null) {
          setClassLevel(Number(row.level) || 1);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [classId, variant]);

  useEffect(() => {
    loadClassMeta();
  }, [loadClassMeta]);

  const backHref =
    variant === 'school'
      ? `/school/class/${classId}?tab=homework`
      : `/teacher/class/${classId}?tab=homework`;

  const addWordRow = () => {
    setWords((prev) => [...prev, { word: '', example_sentence: '' }]);
  };

  const updateWord = (index, field, value) => {
    setWords((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, '']);
  };

  const updateQuestion = (index, value) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const removeWord = (index) => {
    setWords((prev) => prev.filter((_, j) => j !== index));
  };

  const removeQuestion = (index) => {
    setQuestions((prev) => prev.filter((_, j) => j !== index));
  };

  const runSubmit = async () => {
    if (!classId) return;
    setSaving(true);
    setError('');
    try {
      const wordPayload = words
        .map((w) => ({
          word: String(w.word || '').trim(),
          example_sentence: String(w.example_sentence || '').trim(),
        }))
        .filter((w) => w.word && w.example_sentence);

      const questionPayload = questions
        .map((q) => String(q || '').trim())
        .filter(Boolean)
        .map((text) => ({ q: text, type: 'short' }));

      if (!dueDate) {
        setError('Please choose a due date.');
        setSaving(false);
        setConfirmOpen(false);
        return;
      }

      await axiosInterceptor.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/homework/create/`, {
        title: title.trim() || 'Untitled assignment',
        summary: summary.trim(),
        reading: reading.trim(),
        class_field: Number(classId),
        level: classLevel,
        due_date: dueDate,
        words: wordPayload,
        questions: questionPayload,
        cover_image_url: (coverImageUrl || '').trim(),
      });
      setConfirmOpen(false);
      router.push(backHref);
    } catch (err) {
      const d = err.response?.data;
      const msg =
        (typeof d?.error === 'string' && d.error) ||
        (typeof d?.detail === 'string' && d.detail) ||
        (d && typeof d === 'object' && JSON.stringify(d)) ||
        'Could not create assignment.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!classId) {
    return null;
  }

  return (
    <div className="teacher-mark teacher-homework-create">
      <Link href={backHref} className="teacher-mark__back">
        ← Back to class
      </Link>

      <header className="teacher-mark__head">
        <h1 className="teacher-mark__title">Create assignment</h1>
      </header>

      <div className="teacher-homework-create__form">
        <div className="teacher-homework-create__top-grid">
          <div className="teacher-homework-create__top-fields">
            <label className="teacher-homework-create__label" htmlFor={`${idPrefix}-title`}>
              Task title
            </label>
            <input
              id={`${idPrefix}-title`}
              className="teacher-homework-create__input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoComplete="off"
            />

            <label className="teacher-homework-create__label" htmlFor={`${idPrefix}-summary`}>
              Summary
            </label>
            <textarea
              id={`${idPrefix}-summary`}
              className="teacher-homework-create__textarea"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
            />
          </div>

          <div className="teacher-homework-create__cover-col">
            <p className="teacher-homework-create__cover-label">Cover image</p>
            {coverImageUrl ? (
              <img
                src={coverImageUrl}
                alt=""
                className="teacher-homework-create__cover-preview"
              />
            ) : (
              <div className="teacher-homework-create__cover-placeholder">No image selected</div>
            )}
            <button
              type="button"
              className="teacher-homework-create__cover-btn"
              onClick={() => setPickerOpen(true)}
            >
              Choose image
            </button>
          </div>
        </div>

        <label className="teacher-homework-create__label" htmlFor={`${idPrefix}-reading`}>
          Reading
        </label>
        <textarea
          id={`${idPrefix}-reading`}
          className="teacher-homework-create__textarea"
          value={reading}
          onChange={(e) => setReading(e.target.value)}
          rows={6}
        />

        <h2 className="teacher-homework-create__section-title">Vocabulary</h2>
        {words.map((w, i) => (
          <div className="teacher-homework-create__word-row" key={`word-${i}`}>
            <div className="teacher-homework-create__word-row-inputs">
              <input
                className="teacher-homework-create__input"
                aria-label={`Word ${i + 1}`}
                placeholder="Word"
                value={w.word}
                onChange={(e) => updateWord(i, 'word', e.target.value)}
              />
              <input
                className="teacher-homework-create__input"
                aria-label={`Example sentence ${i + 1}`}
                placeholder="Example sentence"
                value={w.example_sentence}
                onChange={(e) => updateWord(i, 'example_sentence', e.target.value)}
              />
            </div>
            <button
              type="button"
              className="teacher-homework-create__remove-btn"
              onClick={() => removeWord(i)}
            >
              Remove word
            </button>
          </div>
        ))}
        <button type="button" className="teacher-homework-create__row-button" onClick={addWordRow}>
          + Add word
        </button>

        <h2 className="teacher-homework-create__section-title">Questions</h2>
        {questions.map((q, i) => (
          <div className="teacher-homework-create__question-row" key={`q-${i}`}>
            <input
              className="teacher-homework-create__input"
              aria-label={`Question ${i + 1}`}
              placeholder="Question"
              value={q}
              onChange={(e) => updateQuestion(i, e.target.value)}
            />
            <button
              type="button"
              className="teacher-homework-create__remove-btn"
              onClick={() => removeQuestion(i)}
            >
              Remove question
            </button>
          </div>
        ))}
        <button type="button" className="teacher-homework-create__row-button" onClick={addQuestion}>
          + Add question
        </button>

        <div className="teacher-homework-create__footer-row">
          <div className="teacher-homework-create__due-wrap">
            <label className="teacher-homework-create__label" htmlFor={`${idPrefix}-due`}>
              Due date
            </label>
            <input
              id={`${idPrefix}-due`}
              type="date"
              className="teacher-homework-create__input teacher-homework-create__input--narrow"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="teacher-mark__submit teacher-homework-create__submit"
            disabled={saving}
            onClick={() => setConfirmOpen(true)}
          >
            {saving ? 'Creating…' : 'Create assignment'}
          </button>
        </div>

        {error ? <p className="teacher-mark__error">{error}</p> : null}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Create this assignment?"
        message="Are you sure? Students in this class will receive this assignment."
        confirmLabel="Yes, create"
        cancelLabel="Cancel"
        busy={saving}
        onCancel={() => !saving && setConfirmOpen(false)}
        onConfirm={() => runSubmit()}
      />

      <PexelsImagePicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => setCoverImageUrl(url)}
      />
    </div>
  );
}
