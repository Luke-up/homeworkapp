'use client';

import { markValueToStarCount } from '@/utils/markStars';
import './mark-stars.scss';

function StarSvg() {
  return (
    <svg className="mark-stars__svg mark-stars__svg--star" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
      />
    </svg>
  );
}

function CircleSvg() {
  return (
    <svg className="mark-stars__svg mark-stars__svg--circle" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

export default function MarkStars({
  markValue,
  className = '',
  variant = 'dark',
  filledOnly = false,
}) {
  const filled = markValueToStarCount(markValue);
  const parts = [
    'mark-stars',
    variant === 'light' ? 'mark-stars--light' : '',
    variant === 'dashboard' ? 'mark-stars--dashboard' : '',
    filledOnly ? 'mark-stars--filled-only' : '',
    className,
  ].filter(Boolean);

  if (filledOnly) {
    if (filled === 0) {
      return (
        <span className={parts.join(' ')} aria-label="No effort stars yet">
          0
        </span>
      );
    }
    return (
      <span className={parts.join(' ')} role="img" aria-label={`${filled} stars`}>
        {Array.from({ length: filled }, (_, i) => (
          <span key={i} className="mark-stars__slot" aria-hidden>
            <StarSvg />
          </span>
        ))}
      </span>
    );
  }

  return (
    <span
      className={parts.join(' ')}
      role="img"
      aria-label={`${filled} out of 3 stars`}
    >
      {[0, 1, 2].map((i) => (
        <span key={i} className="mark-stars__slot" aria-hidden>
          {i < filled ? <StarSvg /> : <CircleSvg />}
        </span>
      ))}
    </span>
  );
}
