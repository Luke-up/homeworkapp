'use client';

import { useCallback, useEffect, useState } from 'react';
import './pexels-image-picker.scss';

export default function PexelsImagePicker({ isOpen, onClose, onSelect }) {
  const [query, setQuery] = useState('learning');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runSearch = useCallback(async (q) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/pexels/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Search failed.');
        setPhotos([]);
        return;
      }
      setPhotos(Array.isArray(data.photos) ? data.photos : []);
    } catch {
      setError('Could not reach image search.');
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      runSearch(query);
    }
    // Intentionally only when the dialog opens; search submit calls runSearch directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSubmitSearch = (e) => {
    e.preventDefault();
    runSearch(query.trim() || 'learning');
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="pexels-picker-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pexels-picker-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="pexels-picker" onClick={(e) => e.stopPropagation()}>
        <div className="pexels-picker__header">
          <h2 id="pexels-picker-title" className="pexels-picker__title">
            Choose an image
          </h2>
          <form className="pexels-picker__search" onSubmit={handleSubmitSearch}>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search photos…"
              aria-label="Search query"
            />
            <button type="submit">Search</button>
          </form>
          <button type="button" className="pexels-picker__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {error ? <div className="pexels-picker__error">{error}</div> : null}

        <div className="pexels-picker__grid">
          {loading ? (
            <div className="pexels-picker__empty">Loading…</div>
          ) : photos.length ? (
            photos.map((p) => (
              <button
                key={p.id}
                type="button"
                className="pexels-picker__thumb"
                onClick={() => {
                  const url = p.src?.large || p.src?.medium || p.src?.original;
                  if (url) {
                    onSelect(url);
                  }
                  onClose();
                }}
              >
                <img src={p.src?.small} alt={p.alt || ''} loading="lazy" />
              </button>
            ))
          ) : (
            <div className="pexels-picker__empty">No photos found. Try another search.</div>
          )}
        </div>

        <p className="pexels-picker__meta">
          Photos provided by{' '}
          <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer">
            Pexels
          </a>
        </p>
      </div>
    </div>
  );
}
