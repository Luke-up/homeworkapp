'use client';

import { Suspense } from 'react';
import ClassWorkspacePage from '@/components/ClassWorkspacePage/ClassWorkspacePage';
import '@/app/teacher/class/teacher-class-page.scss';

export default function SchoolClassPage() {
  return (
    <Suspense
      fallback={
        <div className="teacher-class-page">
          <p className="muted">Loading…</p>
        </div>
      }
    >
      <ClassWorkspacePage role="school" />
    </Suspense>
  );
}
