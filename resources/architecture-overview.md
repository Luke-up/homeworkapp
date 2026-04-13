# Architecture overview (learning map)

This document ties the **major pieces** of Granadilla together so you can see how requests flow and where rules live.

## High-level diagram

```text
┌─────────────────┐     HTTPS / JSON      ┌──────────────────────────┐
│  Next.js 14     │ ─────────────────────▶│  Django REST + SimpleJWT │
│  (App Router)   │◀────────────────────── │  `backend/core/`         │
│  `frontend/src` │   Bearer access token   │  mounted at `/core/`   │
└────────┬────────┘                         └────────────┬─────────────┘
         │                                              │
         │  `GET /api/pexels/search`                    │  PostgreSQL or
         ▼                                              ▼  SQLite
┌─────────────────┐                         ┌──────────────────────────┐
│ Next Route       │  server-only env        │  Models + migrations     │
│ Handler (Pexels)│  `PEXELS_API_KEY`       │  `core.models`           │
└─────────────────┘                         └──────────────────────────┘
```

## Responsibility split

| Layer | Responsibility |
|-------|----------------|
| **Browser (React client)** | UI state, `sessionStorage` JWTs, redirects, timed-demo tab coordination. |
| **Next.js server routes** | Hide secrets (Pexels); no auth to Django from these routes in the current design—they are separate. |
| **Django views (`APIView`)** | HTTP verbs, status codes, call serializers and **`core/access.py`** for object-level checks. |
| **Serializers** | Validation, nested creates (e.g. homework + words + student rows), computed dashboard fields. |
| **Models** | Persistence, a few invariants in `save()` (e.g. answer sync before submit). |
| **Pure modules** | `lexicon.py`, `student_homework_answers.py`, `demo_session.py` — testable business logic without HTTP. |

## Two “school for user” helpers (important)

- **`core/access.py` → `school_for_user(user)`** — Returns a `School` instance **only** when `user_type == 'school'`. Used in access patterns focused on the **organisation account**.
- **`core/demo_session.py` → `school_for_user(user)`** — Returns the `School` for **school, teacher, or student** (via profile FKs). Used for **demo expiry** so any role in a timed demo school can be purged consistently.

Same name, different semantics—when reading stack traces, check **which module** was imported.

## Where to learn what

| Concern | Primary doc / code |
|---------|-------------------|
| Login, JWT, demo expiry on auth | `authentication.md`, `demo_jwt_authentication.py`, `demo_session.py` |
| Who may touch a class or submission | `permissions-and-access-control.md`, `access.py` |
| Lexicon not stored per student | `domain-lexicon-and-answers.md`, `lexicon.py` |
| Question JSON + answer rows | `student_homework_answers.py`, `serializers.md` |
| Public signup vs timed sandbox | `user-creation.md`, `timed-demo-and-seed-data.md` |
| Env, DB, CORS, DRF auth class | `django-settings-and-configuration.md` |
| Pages, layouts, Pexels proxy | `nextjs-routing-and-server-routes.md`, `frontend-pages.md` |
| SCSS variables and shells | `frontend-styling.md` |

## Extension points (typical coursework)

- Add a **new role** or permission: models → migrations → `access.py` + views → frontend routes.
- Add a **new resource**: model → serializer → `urls.py` → view → test in `core/tests/`.
- Harden **production**: tighten `ALLOWED_HOSTS`, CORS, HTTPS, `SECRET_KEY`, rate limits (not in PoC).
