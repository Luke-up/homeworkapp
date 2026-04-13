# Frontend: complex components (line-by-line themes)

This document explains **what major blocks of code achieve** in a few representative components. Path prefix: `frontend/src/components/`.

---

## `StudentDashboardAssignments/StudentDashboardAssignments.jsx`

**Role:** Carousel-style card for **overdue** and **new** assignments on the student dashboard.

- **`hueFromId(id)`** — Deterministic pseudo-random hue for gradient fallbacks when no `cover_image_url` exists—keeps cards visually distinct without storing a colour per assignment.
- **`OverdueGlyph` / `NewAssignmentGlyph`** — Inline SVGs using `currentColor` so parent SCSS (`.student-hw-showcase__status--overdue/new`) can tint both icons **gold** (`$SecondaryColor`).
- **`slides` `useMemo`** — Flattens two API arrays into `{ item, kind }` objects interleaving overdue first, then new items—drives a single renderer for both states.
- **Navigation** — `index` state with wraparound `go(±1)`; resets index when slide count changes (`useEffect`).
- **Empty state** — Early return with accessible `aria-label` on the section.
- **Layout split** — Left column: title, vocabulary chips, status row, optional prev/next. Right: cover image or CSS gradient fallback, overlay gradient, due date meta, **`Link`** to `/student/homework/[studentHomeworkId]` (note: `current.item.id` is the **StudentHomework** id).

Teaching point: the component is **purely presentational**—all business rules about “overdue” live in the serializer; the UI only renders buckets it receives.

---

## `HomeworkCreateForm/HomeworkCreateForm.jsx`

**Role:** Large form for teachers **or** school admins to define homework (reading, summary, due date, cover image, vocabulary rows, short questions).

- **`variant`** — `'school' | 'teacher'` switches API sources for **class metadata** (`loadClassMeta`): teacher dashboard vs school classes list, to read `level` for the template.
- **Local arrays `words` / `questions`** — Controlled inputs with add/remove row helpers (`addWordRow`, `updateWord`, …)—classic React list editing.
- **`PexelsImagePicker`** — Optional modal to search images via Next API route; result sets `coverImageUrl`.
- **`ConfirmDialog`** — Confirms destructive or heavy submit actions if used in the remainder of the file (pattern for teacher/school safety).
- **Submit payload** — Builds JSON matching `HomeworkSerializer`: nested `words`, `questions` as `{ q, type }` objects, `class_field` id, `cover_image_url`, `due_date`, etc., then POST `homework/create/`.
- **Navigation** — `backHref` returns to class homework tab depending on variant.

Teaching point: **one component, two roles** reduces duplication but requires careful access checks on the server—never trust `variant` alone for authorization.

---

## `SchoolPersonModal/SchoolPersonModal.jsx`

**Role:** Modal to view/edit a **teacher or student** from school directory UIs (avatar, name, email, password change).

- **Props:** `isOpen`, `onClose`, `role` (`teacher` | `student`), `person` object from parent list, `onSaved` callback to refetch directory.
- **Controlled fields** mirror `person` when modal opens (`useEffect` on `isOpen` + `person.id`)—resets dirty state when switching rows.
- **PATCH targets** — Different endpoints for teacher vs student profile (`/core/teachers/<id>/` vs `/core/students/<id>/`) with shared validation UX (password match, length).
- **Avatar** — May integrate `PexelsImagePicker` or URL field depending on code path—teaching point: **avatar is a URL**, not multipart upload in this PoC.

Read the file for exact field names; the architecture is **modal shell + form + optimistic toasts/errors**.

---

## `MarkStars/MarkStars.jsx` + `axiosInterceptor` (cross-cutting)

`MarkStars` maps a numeric **`markValue`** through `markValueToStarCount` and renders either:

- **Filled-only mode** (dashboard): only filled stars, or `0` text if none—compact.
- **Default mode** (marking UI): three slots with stars vs hollow circles.

---

## How to study another component

1. Identify **data source** (props vs fetch in `useEffect`).
2. Map **each `useState`** to a UI section.
3. Note **accessibility** (`aria-*`, `role`).
4. Cross-reference **serializer fields** from Network tab—UI should mirror API names intentionally.
