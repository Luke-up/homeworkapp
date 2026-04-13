'use client';

import { useCallback, useEffect, useState } from 'react';
import axiosInterceptor from '@/utils/axiosInterceptor';
import './lexicon-page.scss';

const StudentLexiconPage = () => {
  const [words, setWords] = useState([]);
  const [order, setOrder] = useState('new');

  const load = useCallback(async () => {
    try {
      const res = await axiosInterceptor.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/core/student-lexicon/`,
        { params: { order } }
      );
      setWords(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
    }
  }, [order]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="lexicon-page">
      <header className="lexicon-page__intro">
        <h1 className="student-page-title">My Lexicon</h1>
        <div className="lexicon-page__orderby">
          <label htmlFor="lexicon-order" className="lexicon-page__orderby-label">
            Order by
          </label>
          <select
            id="lexicon-order"
            className="lexicon-page__select"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            aria-label="Sort lexicon by date added"
          >
            <option value="new">Date (new)</option>
            <option value="old">Date (old)</option>
          </select>
        </div>
      </header>

      {!words.length ? (
        <p className="muted">
          Your personal word list is empty. Words appear here when homework is returned with teacher feedback.
        </p>
      ) : (
        <div className="lexicon-page__table-wrap">
          <table className="lexicon-page__table">
            <thead>
              <tr>
                <th scope="col">Word</th>
                <th scope="col">Example sentence</th>
              </tr>
            </thead>
            <tbody>
              {words.map((w, idx) => (
                <tr key={`${w.word}-${idx}`}>
                  <td className="lexicon-page__cell-word">{w.word}</td>
                  <td className="lexicon-page__cell-sentence">{w.example_sentence || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudentLexiconPage;
