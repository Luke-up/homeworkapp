# Frontend utilities (`frontend/src/utils`)

Small, pure or nearly-pure helpers and one **axios façade**. Teaching goal: centralise cross-page rules so pages stay declarative.

## `authRedirect.js`

- **`dashboardPathForUserType(userType)`** — maps API string `school` | `teacher` | `student` to App Router paths `/school`, `/teacher`, `/student`. Used after login/signup to `router.replace(...)`.

## `formatDueDate.js`

- **`formatDueDate(value)`** — Accepts API `YYYY-MM-DD` or ISO datetime strings. Splits on `T`, parses year/month/day as **local** integers, then `toLocaleDateString` with `dateStyle: 'medium'` to avoid UTC shifting calendar dates. Falls back to `new Date(value)` for odd formats.

## `markStars.js`

- **`markValueToStarCount(markValue)`** — Maps backend **0–5** effort scale to **0–3** filled stars via `Math.round((n/5)*3)` clamped to `[0,3]`.
- **`starCountToMarkValue(starCount)`** — Inverse for teacher UI: discrete 0–3 selection → string decimal on 0–5 scale for PATCH payloads.

## `schoolYear.js`

- **`parseApiDate(value)`** — Same YYYY-MM-DD parsing strategy as due dates: local calendar date without UTC slip.
- **`isDateInSchoolYearAprToMar(date, ref)`** — UK-style academic window April→March relative to `ref` (defaults now). Used to filter tables (e.g. assignment directory) to “this school year”.
- **`completedHomeworkSortDate(sh)`** — Picks submission date or homework due date for sorting completed cards.

## `splitDisplayName.js`

- **`splitDisplayName(full)`** — Splits on **first space** into `{ first, last }` for avatars and two-line name layouts. Mirrors backend `split_display_name` in serializers.

## `timedDemo.js`

- **`TIMED_DEMO_STORAGE_KEY`**, **`DEMO_SESSION_EXPIRES_AT_KEY`** — constants for storage keys.
- **`readTimedDemoSession()`** — Parses JSON demo bundle from `localStorage`.
- **`clearTimedDemoLocalState()`** — Removes demo bundle + session expiry marker (used on successful real signup and on demo expiry redirects).
- **`getDemoSessionExpiresAtIso()`** — Unified read of expiry for countdown UIs.

## `runTimedLiveDemoFromBrowser.js`

- **`runTimedLiveDemoFromBrowser({ recaptchaToken, blankWindows })`** — After caller opens **three** `about:blank` windows, POSTs `demo-session/start/`, writes `TIMED_DEMO_STORAGE_KEY`, assigns each window `location.href` to `/timed-demo?role=...`. Returns `{ ok, error? }` or `{ ok: true, payload }`. Closes windows on failure paths.

## `axiosInterceptor.js`

Creates an `axios` instance with:

1. **Request interceptor** — Attaches `Authorization: Bearer <access>` from `sessionStorage` if present.
2. **Response interceptor** — On `401`:
   - If response `code === 'demo_expired'`, clears demo + tokens and sends user to **`/signup?demo_expired=1`**.
   - Else if refresh token exists, POST `/core/refresh/`; on success updates tokens and **retries** original request with `axios(originalRequest)` (note: uses root `axios`, not the instance—worth knowing when debugging).
   - On refresh failure, clears storage and redirects home or signup depending on `demo_expired`.
3. **403/401/404** (non-refresh path) — Clears tokens and redirects `/` (product choice: treat as session invalid).

**Teaching note:** `baseURL` is set to `NEXT_PUBLIC_FRONTEND_URL` while most calls still pass absolute `NEXT_PUBLIC_BACKEND_URL` URLs—double-check envs in new code to avoid accidental cross-origin confusion.
