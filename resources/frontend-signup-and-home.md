# Frontend: signup flow and initial (home) page

## Home page — `frontend/src/app/page.js`

**Purpose:** Marketing shell + FAQ accordion + **redirect authenticated users** to the correct dashboard.

### Auth redirect (`useEffect`)

- Reads `sessionStorage.access_token`.
- If present, `fetch` **`/core/auth-status/`** with `Authorization: Bearer`.
- On success, `router.push` to `/school`, `/teacher`, or `/student` based on `userType`.
- On failure, clears tokens (stale session).

Teaching point: this runs **client-side only** (`'use client'`), so there is a brief flash of the marketing page before redirect—acceptable for a PoC; SSR middleware would be the production-grade approach.

### FAQ

- `FAQ_ITEMS` constant holds structured content (title + JSX body).
- Accordion toggles `openFaqId` and uses `aria-expanded`, `aria-controls`, `hidden` for accessibility.

### Live demo entry

- Under the italic “proof of concept” line, a **gold text button** (`home-live-demo-link`) starts the timed demo via **`runTimedLiveDemoFromBrowser`**.
- If `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` exists, renders **reCAPTCHA** above the link (required before `demo-session/start/` when the backend secret is set).
- **`runTimedLiveDemoFromBrowser`** opens three blank tabs first (pop-up discipline), then POSTs and assigns tab URLs.
- Error text uses `home-live-demo-error`; hint copy explains the 20-minute sandbox.

### Styling

- `homepage.scss` — `.homewelcome` dark card, CTA buttons, new live-demo block scoped under `.homewelcome`.

---

## Signup page — `frontend/src/app/signup/page.jsx`

**Purpose:** Create a **real school** via public API, then auto-login and redirect to `/school`.

### State and refs

- Form fields: email, password, school name.
- `recaptchaToken`, `recaptchaRef` when site key configured.
- `demoEndedMessage` when query `?demo_expired=1` (timed demo ended); copy points users to the **home page** to start another demo.

### `handleSignup`

1. Validates optional reCAPTCHA.
2. `POST /core/create-school/` with JSON body (`recaptcha_token` when needed).
3. Parses error payloads defensively (string `error`, `detail`, or field arrays).
4. On success, **`POST /core/login/`** with same email/password.
5. Stores JWTs in `sessionStorage`, clears timed-demo local state, `router.replace(dashboardPathForUserType(...))`.

Teaching point: **two round trips** (signup then login) keep server responsibilities separated—signup endpoint does not need to return JWTs if that complicates throttling/logging.

### Styling

- `auth-pages.scss` — `.signup`, `.signup-recaptcha`.

---

## Cross-page teaching topics

| Topic | Implementation |
|-------|----------------|
| Env validation | Both pages check `NEXT_PUBLIC_BACKEND_URL` before fetch. |
| Pop-ups | Demo (home page only) requires three `window.open` calls—users must allow pop-ups. |
| Token storage | Real accounts: `sessionStorage`; demo metadata: `localStorage` key from `timedDemo.js`. |
