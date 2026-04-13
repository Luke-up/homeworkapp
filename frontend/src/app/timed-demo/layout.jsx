import { Suspense } from 'react';

export default function TimedDemoLayout({ children }) {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
          Loading demo…
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
