'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { formatDueDate } from '@/utils/formatDueDate';
import './student-dashboard-assignments.scss';

function hueFromId(id) {
  const n = typeof id === 'number' ? id : parseInt(String(id), 10) || 0;
  return (n * 47) % 360;
}

function OverdueGlyph() {
  return (
    <svg className="student-hw-showcase__status-icon" viewBox="0 0 56 56" width={50} height={50} aria-hidden>
      <circle cx="28" cy="32" r="14" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="M28 24v9M28 37h.01" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      <path
        d="M12 14h32v8H12z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M18 14V10h20v4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function NewAssignmentGlyph() {
  return (
    <svg className="student-hw-showcase__status-icon" viewBox="0 0 56 56" width={50} height={50} aria-hidden>
      <path
        d="M16 6h20l12 12v32a3 3 0 0 1-3 3H16a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M34 6v14h14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="28" cy="36" r="3" fill="currentColor" />
      <path d="M28 29v4M35 36h-4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export default function StudentDashboardAssignments({ overdue = [], newItems = [] }) {
  const slides = useMemo(() => {
    const o = (Array.isArray(overdue) ? overdue : []).map((item) => ({ item, kind: 'overdue' }));
    const n = (Array.isArray(newItems) ? newItems : []).map((item) => ({ item, kind: 'new' }));
    return [...o, ...n];
  }, [overdue, newItems]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [slides.length]);

  const count = slides.length;
  const safeIndex = count ? Math.min(index, count - 1) : 0;
  const current = slides[safeIndex];
  const hw = current?.item?.homework;
  const words = hw?.words && Array.isArray(hw.words) ? hw.words : [];
  const coverUrl = (hw?.cover_image_url || '').trim();
  const hue = hueFromId(hw?.id ?? safeIndex);
  const dueLabel = hw?.due_date ? formatDueDate(hw.due_date) : 'No due date set';

  const go = (delta) => {
    setIndex((i) => {
      const next = i + delta;
      if (next < 0) return count - 1;
      if (next >= count) return 0;
      return next;
    });
  };

  if (!count) {
    return (
      <section className="student-hw-showcase-empty" aria-label="Assignments">
        <p className="student-hw-showcase-empty__line">No assignments due or new right now.</p>
      </section>
    );
  }

  return (
    <section className="student-hw-showcase" aria-label="Assignments">
      <div className="student-hw-showcase__card">
        <div className="student-hw-showcase__dark">
          <h3 className="student-hw-showcase__title">{hw?.title || 'Homework'}</h3>

          {words.length ? (
            <div className="student-hw-showcase__chips" aria-label="Vocabulary">
              {words.map((w, i) => (
                <span className="student-hw-showcase__chip" key={`${w.word}-${i}`}>
                  {w.word}
                </span>
              ))}
            </div>
          ) : (
            <p className="student-hw-showcase__no-words">No vocabulary listed.</p>
          )}

          <div
            className={`student-hw-showcase__status student-hw-showcase__status--${current.kind}`}
            aria-label={current.kind === 'overdue' ? 'Overdue assignment' : 'New assignment'}
          >
            {current.kind === 'overdue' ? <OverdueGlyph /> : <NewAssignmentGlyph />}
            <span className="student-hw-showcase__status-label">
              {current.kind === 'overdue' ? 'Overdue' : 'New assignment'}
            </span>
          </div>

          {count > 1 ? (
            <div className="student-hw-showcase__nav">
              <button type="button" className="student-hw-showcase__nav-tri" onClick={() => go(-1)} aria-label="Previous">
                ◀
              </button>
              <span className="student-hw-showcase__nav-count">
                {safeIndex + 1} of {count}
              </span>
              <button type="button" className="student-hw-showcase__nav-tri" onClick={() => go(1)} aria-label="Next">
                ▶
              </button>
            </div>
          ) : null}
        </div>

        <div className="student-hw-showcase__visual">
          {coverUrl ? (
            <div className="student-hw-showcase__cover" style={{ backgroundImage: `url(${coverUrl})` }} />
          ) : (
            <div
              className="student-hw-showcase__cover student-hw-showcase__cover--fallback"
              style={{
                background: `linear-gradient(160deg, hsl(${hue}, 42%, 32%), hsl(${hue}, 55%, 14%))`,
              }}
            />
          )}
          <div className="student-hw-showcase__visual-overlay" />
          <div className="student-hw-showcase__visual-meta">
            <p className="student-hw-showcase__class">{hw?.class_name || 'Class'}</p>
            <p className="student-hw-showcase__due">Due {dueLabel}</p>
          </div>
          <Link href={`/student/homework/${current.item.id}`} className="student-hw-showcase__start">
            Start
          </Link>
        </div>
      </div>
    </section>
  );
}
