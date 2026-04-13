# Resources (teaching notes)

These documents sit beside `STARTUP.md` at the repository root. They explain **how** and **why** the Granadilla codebase is structured—not user-facing product copy.

The main **[README.md](../README.md)** at the repo root contains **startup and operations** procedures.

---

## Start here

| Document | Purpose |
|----------|---------|
| [architecture-overview.md](./architecture-overview.md) | How layers connect; two `school_for_user` functions; where to read next. |
| [glossary.md](./glossary.md) | Domain terms (Homework vs StudentHomework, lexicon, demos). |

---

## Backend — security and configuration

| Document | Topics |
|----------|--------|
| [authentication.md](./authentication.md) | JWT, refresh, demo expiry, CORS. |
| [permissions-and-access-control.md](./permissions-and-access-control.md) | `access.py`, `permissions.py`, 403 vs 404. |
| [user-creation.md](./user-creation.md) | Signup, roles, timed demo user creation. |
| [django-settings-and-configuration.md](./django-settings-and-configuration.md) | `settings.py`, env, DB switch, DRF auth, CORS, reCAPTCHA. |
| [error-handling-and-security-checklist.md](./error-handling-and-security-checklist.md) | API errors, XSS/CORS checklist, production hardening. |

---

## Backend — data and domain

| Document | Topics |
|----------|--------|
| [models.md](./models.md) | Models, relationships, field types. |
| [serializers.md](./serializers.md) | DRF serializers, complex method fields. |
| [domain-lexicon-and-answers.md](./domain-lexicon-and-answers.md) | `lexicon.py`, `student_homework_answers.py`. |
| [homework-lifecycle.md](./homework-lifecycle.md) | Template → submit → mark → lexicon flow. |
| [timed-demo-and-seed-data.md](./timed-demo-and-seed-data.md) | Live demo, `seed_demo`, `purge_expired_demos`, `demo_populate`. |

---

## Backend — HTTP surface

| Document | Topics |
|----------|--------|
| [url-endpoints.md](./url-endpoints.md) | `/core/` route map. |
| [views-auth.md](./views-auth.md) | `auth_views.py` |
| [views-school.md](./views-school.md) | `school_views.py` |
| [views-student.md](./views-student.md) | `student_views.py` |
| [views-teacher.md](./views-teacher.md) | `teacher_views.py` |

---

## Backend — quality

| Document | Topics |
|----------|--------|
| [tests.md](./tests.md) | `core/tests/`, cases, extending tests. |

---

## Frontend

| Document | Topics |
|----------|--------|
| [nextjs-routing-and-server-routes.md](./nextjs-routing-and-server-routes.md) | App Router, layouts, `/api/pexels` proxy. |
| [frontend-styling.md](./frontend-styling.md) | Global SCSS tokens, colocated styles. |
| [frontend-components.md](./frontend-components.md) | Deep dives on selected components. |
| [frontend-signup-and-home.md](./frontend-signup-and-home.md) | Signup + landing page. |
| [frontend-pages.md](./frontend-pages.md) | Dashboards, student detail, homework create. |
| [frontend-utils.md](./frontend-utils.md) | All `frontend/src/utils` helpers. |
