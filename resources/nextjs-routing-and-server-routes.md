# Next.js: routing, layouts, and server routes

The frontend uses the **App Router** (`frontend/src/app/`). File conventions: **`page.jsx`** / **`page.js`** define routes, **`layout.jsx`** wraps subtrees, **`loading.js`** / **`error.js`** may appear for UX (add as needed).

## Route groups by role

| Path prefix | Audience |
|-------------|----------|
| `/` | Marketing home + FAQ (`page.js`). |
| `/login`, `/signup` | Auth forms. |
| `/school/**` | School admin shell (classes, students, teachers, homework, mark flows). |
| `/teacher/**` | Teacher dashboard and class workspaces. |
| `/student/**` | Student dashboard, homework list, lexicon, profile. |
| `/timed-demo` | Boots one of three tabs with demo credentials from `localStorage`. |

Layouts under **`school/layout.jsx`**, **`student/layout.jsx`**, etc., typically inject **sidebars**, **headers**, and **`TimedDemoExpiry`** banners so behaviour stays consistent across nested pages.

## Dynamic segments

Examples: **`school/students/[id]/page.jsx`**, **`school/class/[id]/homework/new/page.jsx`**. The **`useParams()`** hook reads `id` (or other segment names) for API URLs.

## Client vs server components

Pages that touch **`sessionStorage`**, **`window`**, or React hooks like **`useState`** are marked **`'use client'`** at the top. The root **`layout.js`** may stay a server component wrapping children—check current file: if it only imports global CSS and children, it can remain minimal.

## Server-only route: Pexels proxy

**File:** `frontend/src/app/api/pexels/search/route.js`

- **Method:** `GET`.
- **Query:** `q` — search string (default `'education'`).
- **Auth to Pexels:** Reads **`PEXELS_API_KEY`** or legacy **`REACT_APP_PEXELS_API_KEY`** from **server** env (never `NEXT_PUBLIC_`), then calls `https://api.pexels.com/v1/search`.
- **Response:** Forwards JSON (or `503` if key missing, `502` if upstream fails).

**Why it exists:** Browsers cannot keep the Pexels secret. Next runs this handler on the server so **`PexelsImagePicker`** can `fetch('/api/pexels/search?q=...')` without exposing the key.

**Teaching point:** this route does **not** reuse the Django JWT—it's a separate trust boundary. If you needed per-user Pexels quotas, you would add session or token checks here.

## Navigation after login

**`dashboardPathForUserType`** (`utils/authRedirect.js`) maps API `user_type` to `/school`, `/teacher`, or `/student`. Home page **`useEffect`** uses **`auth-status`** to redirect returning users.

## Related reading

- `frontend-pages.md` — individual screens.
- `frontend-signup-and-home.md` — home + signup flows.
- `frontend-utils.md` — axios and demo helpers.
