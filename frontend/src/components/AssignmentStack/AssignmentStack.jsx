'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { formatDueDate } from '@/utils/formatDueDate';
import './assignment-stack.scss';

function hueFromId(id) {
  const n = typeof id === 'number' ? id : parseInt(String(id), 10) || 0;
  return (n * 47) % 360;
}

export default function AssignmentStack({ kind, items }) {
  const [index, setIndex] = useState(0);

  const list = Array.isArray(items) ? items : [];
  const count = list.length;

  useEffect(() => {
    setIndex(0);
  }, [count]);

  const safeIndex = count ? Math.min(index, count - 1) : 0;
  const current = list[safeIndex];
  const hw = current?.homework;

  const hue = useMemo(() => hueFromId(hw?.id ?? safeIndex), [hw?.id, safeIndex]);

  if (!count) {
    return null;
  }

  const headline =
    kind === 'overdue'
      ? `You have ${count} overdue assignment${count === 1 ? '' : 's'}`
      : `You have ${count} new assignment${count === 1 ? '' : 's'}`;

  const words = hw?.words && Array.isArray(hw.words) ? hw.words : [];
  const className = hw?.class_name || 'Class';
  const due = hw?.due_date ? formatDueDate(hw.due_date) : 'No due date set';

  const go = (delta) => {
    setIndex((i) => {
      const next = i + delta;
      if (next < 0) return count - 1;
      if (next >= count) return 0;
      return next;
    });
  };

  return (
    <div className={`assignment-stack assignment-stack--${kind}`}>
      <p className="assignment-stack__headline">{headline}</p>
      <div className="assignment-stack__card">
        <Link href={`/student/homework/${current.id}`} className="assignment-stack__main-link">
          <div className="assignment-stack__main">
            <h3 className="assignment-stack__title">{hw?.title || 'Homework'}</h3>
            {words.length ? (
              <div className="assignment-stack__chips" aria-label="Vocabulary in this homework">
                {words.map((w, i) => (
                  <span className="assignment-stack__chip" key={`${w.word}-${i}`}>
                    {w.word}
                  </span>
                ))}
              </div>
            ) : (
              <p className="assignment-stack__muted">No vocabulary words listed for this homework.</p>
            )}
          </div>
        </Link>
        <Link href={`/student/homework/${current.id}`} className="assignment-stack__hero-link">
          <div
            className="assignment-stack__hero"
            style={{
              background: `linear-gradient(145deg, hsl(${hue}, 42%, 32%), hsl(${hue}, 55%, 16%))`,
            }}
          >
            <div className="assignment-stack__hero-inner">
              <p className="assignment-stack__hero-meta">{className}</p>
              <p className="assignment-stack__hero-due">Due {due}</p>
            </div>
          </div>
        </Link>
        {count > 1 ? (
          <div className="assignment-stack__hero-nav">
            <button type="button" className="assignment-stack__nav-btn" onClick={() => go(-1)}>
              ←
            </button>
            <span className="assignment-stack__nav-count">
              {safeIndex + 1} of {count}
            </span>
            <button type="button" className="assignment-stack__nav-btn" onClick={() => go(1)}>
              →
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
