'use client';

import { useCallback, useEffect, useState } from 'react';
import axiosInterceptor from '@/utils/axiosInterceptor';
import StudentDashboardAssignments from '@/components/StudentDashboardAssignments/StudentDashboardAssignments';
import MarkStars from '@/components/MarkStars/MarkStars';
import StudentProfileModal from '@/components/StudentProfileModal/StudentProfileModal';
import { splitDisplayName } from '@/utils/splitDisplayName';
import './dashboard-page.scss';

const StudentHomePage = () => {
  const [profile, setProfile] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const res = await axiosInterceptor.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/core/student-dashboard/`
      );
      setProfile(res.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (!profile) {
    return <p className="student-dash-loading">Loading…</p>;
  }

  const overdue = profile.overdue_assignments || [];
  const newItems = profile.new_assignments || [];
  const lexiconTotal = profile.lexicon_word_count ?? 0;
  const completedCount = profile.completed_homework_count ?? 0;
  const latestMark = profile.latest_marked_mark_value;
  const doneLabel =
    completedCount === 1
      ? "You've completed 1 reading."
      : `You've completed ${completedCount} readings.`;

  const { first: pFirst, last: pLast } = splitDisplayName(profile.name);
  const initials =
    `${(pFirst || profile.name || '?').slice(0, 1)}${(pLast || '').slice(0, 1)}`.toUpperCase() || '?';

  return (
    <>
      <header className="student-dash-header">
        <h1 className="student-page-title">My dashboard</h1>
        <button
          type="button"
          className="student-dash-header__badge"
          onClick={() => setProfileModalOpen(true)}
        >
          Student account
        </button>
      </header>

      <section className="student-dash-top" aria-labelledby="dash-overview">
        <span id="dash-overview" className="visually-hidden">
          Overview
        </span>
        <div className="student-effort-split">
          <div className="student-effort-split__profile">
            <div className="student-effort-split__avatar-wrap">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="student-effort-split__avatar-img" />
              ) : (
                <div className="student-effort-split__avatar-ph" aria-hidden>
                  {initials}
                </div>
              )}
            </div>
            <div className="student-effort-split__names">
              <div className="student-effort-split__first">{pFirst || profile.name || '—'}</div>
              {pLast ? <div className="student-effort-split__last">{pLast}</div> : null}
            </div>
          </div>
          <div className="student-effort-split__effort">
            <p className="student-dash-stat-label">Effort</p>
            <div
              className="student-effort-split__stars"
              aria-label="Average effort from your last five graded assignments"
            >
              <MarkStars markValue={latestMark} variant="dashboard" filledOnly />
            </div>
          </div>
        </div>

        <div className="student-words-block">
          <p className="student-dash-stat-label">Lexicon</p>
          <p className="student-words-block__count">{lexiconTotal}</p>
          <p className="student-words-block__caption">{doneLabel}</p>
        </div>
      </section>

      <StudentDashboardAssignments overdue={overdue} newItems={newItems} />

      <StudentProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        profile={profile}
        onSaved={loadProfile}
      />
    </>
  );
};

export default StudentHomePage;
