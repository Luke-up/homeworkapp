'use client';

import { Suspense } from 'react';
import ClassWorkspacePage from '@/components/ClassWorkspacePage/ClassWorkspacePage';

export default function TeacherClassPage() {
  return (
    <Suspense
      fallback={
        <div className="teacher-class-page">
          <p className="muted">Loading…</p>
        </div>
      }
    >
      <ClassWorkspacePage role="teacher" />
    </Suspense>
  );
}
