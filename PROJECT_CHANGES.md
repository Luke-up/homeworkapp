# Project changes log (recent work)

Short notes on what changed and **why it matters** for how you run and develop the app.

## API surface

- **New endpoints** for profiles, class edit, homework list/delete, class roster, word list/delete, and school-scoped student/teacher detail CRUD. See `backend/core/urls.py` for the full list.
- **Effect**: The backend can support flows that the UI only partly uses today; you can test them with curl, Postman, or automated tests.

## Security and correctness

- **JWT logout** no longer assumes a revocable server token; clients clear tokens locally (normal for stateless JWT).
- **Homework / student-homework updates** check **who** is allowed to change a row (student vs teacher vs school), using helpers in `backend/core/access.py`.
- **Removed** unused `core/authentication.py` (`MultiModelBackend` was not wired in settings and did not match the `User` model).

## Developer experience

- **`seed_demo` management command** loads a fake school, users, classes, words, and sample homework so you can click through the app without manual data entry. (Passwords are shared and documented in `STARTUP.md` — not for production.)
- **Tests** under `backend/core/tests/` cover auth, access helpers, and several API behaviours.
- **Frontend**: school logout hits `/core/logout/`, teacher detail page uses the correct API path, detail pages use App Router `useParams`, axios handles missing `error.response`.

## Files worth knowing

| Area | Location |
|------|-----------|
| URL routes | `backend/core/urls.py` |
| HTTP views by role | `backend/core/views/school_views.py`, `teacher_views.py`, `student_views.py`, `auth_views.py` |
| Shared permission logic | `backend/core/access.py`, `backend/core/permissions.py` (permissions ready to adopt in views) |
| Demo data command | `backend/core/management/commands/seed_demo.py` |

## Docs, rules, demo data, tests

- **`STARTUP.md`** — Demo accounts, `seed_demo` command, how to run tests, high-level API map.
- **`.cursor/rules/homeworkapp-conventions.mdc`** — Cursor rule: match existing style, flag large architectural shifts, learner-friendly explanations.
- **`python manage.py seed_demo`** — Idempotent demo dataset; `--reset` clears `demo-*@example.com` users and rebuilds.
- **`backend/core/tests/`** — Helpers plus tests for `access` helpers and API behaviour (auth, school student detail, homework list, student homework patch permissions).

## What we did *not* do

- No production deploy config, no JWT blacklist, no full UI for every new endpoint (light wiring: e.g. **Add Student** on the school class block calls `PATCH /core/classes/update/`).
