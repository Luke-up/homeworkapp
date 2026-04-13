'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import axiosInterceptor from '@/utils/axiosInterceptor';
import '../styles.scss';
import MarkStars from '@/components/MarkStars/MarkStars';
import { completedHomeworkSortDate, isDateInSchoolYearAprToMar } from '@/utils/schoolYear';
import './homework-page.scss';

function hueFromId(id) {
  const n = typeof id === 'number' ? id : parseInt(String(id), 10) || 0;
  return (n * 47) % 360;
}

function sortCompleted(list, order) {
  const copy = [...list];
  const dateVal = (sh) => completedHomeworkSortDate(sh)?.getTime() ?? 0;

  if (order === 'date_old') {
    copy.sort((a, b) => dateVal(a) - dateVal(b));
  } else {
    copy.sort((a, b) => dateVal(b) - dateVal(a));
  }
  return copy;
}

export default function StudentHomeworkPage() {
  const [completed, setCompleted] = useState([]);
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classId, setClassId] = useState('');
  const [thisYearOnly, setThisYearOnly] = useState(false);
  const [order, setOrder] = useState('date_new');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInterceptor.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/core/student-homework/`
      );
      const body = res.data;
      if (body && Array.isArray(body.completed)) {
        setCompleted(body.completed);
        setEnrolledClasses(Array.isArray(body.enrolled_classes) ? body.enrolled_classes : []);
      } else if (Array.isArray(body)) {
        setCompleted(body);
        setEnrolledClasses([]);
      } else {
        setCompleted([]);
        setEnrolledClasses([]);
      }
    } catch (e) {
      console.error(e);
      setCompleted([]);
      setEnrolledClasses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    let rows = completed;
    const cid = classId ? Number(classId) : null;
    if (cid && !Number.isNaN(cid)) {
      rows = rows.filter((sh) => Number(sh.homework?.class_field) === cid);
    }
    if (thisYearOnly) {
      rows = rows.filter((sh) => {
        const d = completedHomeworkSortDate(sh);
        return isDateInSchoolYearAprToMar(d, new Date());
      });
    }
    return sortCompleted(rows, order);
  }, [completed, classId, thisYearOnly, order]);

  if (loading) {
    return <p className="muted">Loading…</p>;
  }

  return (
    <div className="homework-page">
      <header className="homework-page__intro">
        <h1 className="student-page-title">My Homework</h1>
      </header>

      <div className="homework-page__toolbar">
        <div className="homework-page__toolbar-left">
          <span className="homework-page__field-label" id="hw-show-label">
            Show:
          </span>
          <select
            className="homework-page__select"
            aria-labelledby="hw-show-label"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            <option value="">All classes</option>
            {enrolledClasses.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>

          <label className="homework-page__checkbox-label">
            <input
              type="checkbox"
              checked={thisYearOnly}
              onChange={(e) => setThisYearOnly(e.target.checked)}
            />
            This school year only (Apr–Mar)
          </label>
        </div>

        <div className="homework-page__toolbar-right">
          <span className="homework-page__field-label" id="hw-order-label">
            Order by
          </span>
          <select
            className="homework-page__select"
            aria-labelledby="hw-order-label"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
          >
            <option value="date_new">Date (new)</option>
            <option value="date_old">Date (old)</option>
          </select>
        </div>
      </div>

      {!filtered.length ? (
        <div className="homework-page__empty">
          <p>No completed homework to show yet.</p>
          <p className="homework-page__empty-hint muted">
            Assignments returned with feedback appear here. Open active work from{' '}
            <Link href="/student">My dashboard</Link>.
          </p>
        </div>
      ) : (
        <div className="homework-page__grid">
          {filtered.map((sh) => {
            const hw = sh.homework || {};
            const title = hw.title || 'Homework';
            const url = (hw.cover_image_url || '').trim();
            const hue = hueFromId(hw.id ?? sh.id);
            return (
              <Link href={`/student/homework/${sh.id}`} className="homework-tile-link" key={sh.id}>
                <article className="homework-tile">
                  {url ? (
                    <div className="homework-tile__bg" style={{ backgroundImage: `url(${url})` }} />
                  ) : (
                    <div
                      className="homework-tile__fallback"
                      style={{
                        background: `linear-gradient(145deg, hsl(${hue}, 42%, 36%), hsl(${hue}, 50%, 18%))`,
                      }}
                    />
                  )}
                  <div className="homework-tile__overlay">
                    <h2 className="homework-tile__title">{title}</h2>
                    <div className="homework-tile__marks">
                      <MarkStars markValue={sh.mark_value} />
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
