import { NextResponse } from 'next/server';

/**
 * Server-side proxy for Pexels search so the API key is not exposed to the browser.
 * Set `PEXELS_API_KEY` in `frontend/.env.local` (or legacy `REACT_APP_PEXELS_API_KEY`).
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || 'education';
  const key = process.env.PEXELS_API_KEY || process.env.REACT_APP_PEXELS_API_KEY;

  if (!key) {
    return NextResponse.json(
      { error: 'PEXELS_API_KEY is not configured.', photos: [] },
      { status: 503 }
    );
  }

  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=3`;
  const upstream = await fetch(url, {
    headers: { Authorization: key },
    cache: 'no-store',
  });

  if (!upstream.ok) {
    return NextResponse.json(
      { error: 'Pexels request failed.', photos: [] },
      { status: 502 }
    );
  }

  const data = await upstream.json();
  return NextResponse.json(data);
}
