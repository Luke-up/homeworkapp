# Frontend: selected pages (structure and data flow)

Paths use the Next.js App Router under **`frontend/src/app/`**. Pages marked `'use client'` run in the browser and may use hooks, `sessionStorage`, and browser APIs.

---

## Student dashboard — `student/page.jsx`

**Data:** `GET ${NEXT_PUBLIC_BACKEND_URL}/core/student-dashboard/` via `axiosInterceptor` → `StudentDetailSerializer` JSON stored in `profile` state.

**Layout sections:**

1. **Header** — Title + button opening `StudentProfileModal`.
2. **`student-dash-top`** — Two tiles:
   - **Profile + Effort** — Avatar (image or initials from `splitDisplayName`), name lines, `MarkStars` with `profile.latest_marked_mark_value` (**average of up to five recent marked assignments** on the API).
   - **Lexicon block** — Word count + completed reading count strings.
3. **`StudentDashboardAssignments`** — Passes `overdue_assignments` and `new_assignments` arrays.

**Loading state** — Simple “Loading…” text until first successful fetch.

**Teaching point:** the dashboard is almost entirely **serializer-driven**—new stats should usually be added backend-first for consistency across clients.

---

## School dashboard — `school/page.jsx`

**Data:** `GET /core/classes/` → `SchoolDetailSerializer`-shaped JSON (`school` state: `classes`, `teachers`, `students`).

**Interactions:**

- **Create class** inline form: `POST /core/classes/create` with default description/level; refreshes list.
- **`SchoolClassBlock`** per class — expands edit mode, links into class workspace routes.

**Error handling** — `createError` string from API payload on failure.

---

## School student detail — `school/students/[id]/page.jsx`

**Data:** `GET /core/students/<id>/` for full **`SchoolStudentDetailProfileSerializer`** payload: enrollment, rolling averages, assignment directory rows.

**Typical UI elements:**

- Profile header (avatar, name, email).
- **Assignment table** filtered by academic year using `isDateInSchoolYearAprToMar` from `schoolYear.js` where applicable.
- Effort / stats blocks mirroring serializer fields.

**Access:** If API returns 404/403, page should show a friendly message—handled in `catch` or status checks depending on implementation.

---

## Homework creation — `school/class/[id]/homework/new/page.jsx` and teacher equivalent

These route files **render** `HomeworkCreateForm` with `variant="school"` or `variant="teacher"`. See **`resources/frontend-components.md`** for the internal breakdown.

**Navigation context:** `[id]` dynamic segment is the **class id**; form posts to `homework/create/` including that id as `class_field`.

---

## Teacher dashboard — `teacher/page.jsx`

Fetches **`/core/teacher-dashboard/`** to show class summaries, quick links, and pending marking work—similar **load → map to components** pattern as the school dashboard.

---

## Layout shells — `school/layout.jsx`, `student/layout.jsx`, etc.

Often wrap children with **`DashboardSidebar`** or `SchoolAppShell` components, providing consistent nav and timed-demo expiry banners (`TimedDemoExpiry` where used).

---

## Teaching checklist for new pages

1. Choose **authenticated axios** vs raw `fetch` (token refresh is only on the interceptor instance).
2. Match **env vars** (`NEXT_PUBLIC_BACKEND_URL`).
3. Keep **role checks** UX-only; real enforcement is server-side.
4. Prefer **small child components** for tables and forms to keep pages readable.
