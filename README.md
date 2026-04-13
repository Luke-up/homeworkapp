# Granadilla (homeworkapp)

Granadilla is a proof-of-concept learning platform: schools manage classes and people, teachers set homework and mark submissions, and students complete readings, answer questions, and grow a personal lexicon. This repository contains a **Django REST** API (`backend/`) and a **Next.js 14** frontend (`frontend/`).

Teaching-oriented documentation for contributors and students of the stack lives in **`resources/`** (next to `STARTUP.md` at the repo root). Open **`resources/README.md`** for a grouped index of all topics (architecture, domain logic, security, frontend, tests).

---

## Prerequisites

- **Python 3.10+** (backend virtualenv recommended).
- **Node.js 18+** for the frontend on the host.
- **Docker Desktop** (optional): Postgres + API via Compose, as described below.

---

## Environment variables

### Backend (`backend/.env`)

Django reads this via `backend/config/settings.py`. At minimum:

- `SECRET_KEY` — required in non-debug deployments.
- `DEBUG=True` — typical for local work.

Database:

- **SQLite (simplest laptop setup):** set `USE_SQLITE=True` and skip Docker for the database.
- **Postgres (Docker or hosted):** leave `USE_SQLITE` unset or `False`. Either set **`DATABASE_URL`** (Render, Railway, etc.) or discrete `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`. With the provided Compose file, the API container uses host `db` and database/user/password `postgres` by default.
- **Production:** set **`ALLOWED_HOSTS`** (comma-separated hostnames), **`CORS_ALLOWED_ORIGINS`** (comma-separated full origins, e.g. `https://app.vercel.app`), and optionally **`CSRF_TRUSTED_ORIGINS`** for Django admin on HTTPS. See **`DEPLOY.md`** for Render + Vercel.

JWT / CORS:

- Configure allowed origins and JWT lifetimes as in `settings.py` (see `resources/authentication.md` for the teaching narrative).

Optional:

- `RECAPTCHA_SECRET_KEY` — if unset, reCAPTCHA verification is skipped (convenient for local dev; **set in production** for signup and timed demo start).

### Root `.env` (Docker Compose)

`docker-compose.yml` references `env_file: .env` for the backend service. Keep critical values (e.g. `SECRET_KEY`) aligned with `backend/.env` if you duplicate variables.

### Frontend (`frontend/.env.local`)

- `NEXT_PUBLIC_BACKEND_URL` — API base, e.g. `http://localhost:8000`.
- `NEXT_PUBLIC_FRONTEND_URL` — used by the shared axios instance base URL in some calls.
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` — optional; required when the backend has `RECAPTCHA_SECRET_KEY` for signup and live demo.
- `PEXELS_API_KEY` (server-side for Next route handlers) — optional; powers the Pexels-backed image picker without exposing the key to the browser.

---

## Database migrations

**From repo root (Docker):**

```bash
docker compose run --rm backend python manage.py migrate
```

**From `backend/` with a local venv:**

```bash
python manage.py migrate
```

---

## Demo data (optional)

Management command: `seed_demo` (see `backend/core/management/commands/seed_demo.py`). **Password for all demo accounts:** `demo12345`.

| Role | Example email |
|------|----------------|
| School | `demo-school@example.com` |
| Teachers | `demo-teacher1@example.com`, `demo-teacher2@example.com` |
| Students | `demo-student1@example.com` … `demo-student3@example.com` |

```bash
cd backend
.\.venv\Scripts\python.exe manage.py seed_demo
```

Rebuild demo data (deletes users whose emails start with `demo-` or `timedemo-`, then recreates):

```bash
python manage.py seed_demo --reset
```

Docker equivalent:

```bash
docker compose run --rm backend python manage.py seed_demo
```

Seeded homework includes **cover image URLs** (Unsplash) for richer UI during demos.

---

## Running the API + Postgres with Docker

From the **repository root**:

```bash
docker compose up --build
```

This starts Postgres (`db`) and Django on **http://localhost:8000**. The frontend service in Compose is commented out; run Next.js on the host (next section).

Detached mode:

```bash
docker compose up --build -d
```

---

## Running the backend locally (venv + SQLite)

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate   # Windows; on macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
# Configure backend/.env (e.g. USE_SQLITE=True, SECRET_KEY, DEBUG=True)
python manage.py migrate
python manage.py runserver
```

---

## Running the frontend

In a **second terminal**:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**. Ensure `NEXT_PUBLIC_BACKEND_URL` matches your API (including scheme and port). Django CORS must allow the frontend origin (configured in `settings.py` for local dev).

Production-style frontend build:

```bash
npm run build
npm start
```

---

## Automated tests (backend)

Tests live in `backend/core/tests/`. Django uses a **temporary database** for the test run.

```bash
cd backend
python manage.py test core.tests -v 2
```

`-v 2` increases verbosity so failures are easier to read. See `resources/tests.md` for what each module covers and how to extend them.

---

## API route prefix

HTTP routes are mounted under **`/core/`** (see `backend/core/urls.py`). Examples:

- Auth: `login/`, `logout/`, `refresh/`, `auth-status/`, `create-school/`, `demo-session/start/`
- School admin: `students/`, `teachers/`, `classes/`, `homework/`, `words/`, …
- Student: `student-dashboard/`, `student-homework/`, `student-lexicon/`, …
- Teacher: `teacher-dashboard/`, `teacher-homework/<id>/`, …

A fuller map is in `resources/url-endpoints.md`.

---

## Timed live demo

From the **home page**, users can start a **~20 minute** isolated school with three browser tabs (school / teacher / student). Implementation details: `resources/authentication.md` and `frontend/src/utils/runTimedLiveDemoFromBrowser.js`. Pop-ups must be allowed for three blank tabs to open.

---

## Production deploy (Render + Vercel)

Split hosting: **Django API on Render**, **Next.js on Vercel**. Step-by-step env vars, build/start commands, Postgres, and CORS are in **`DEPLOY.md`**. Optional **`render.yaml`** defines a Postgres instance + web service blueprint (set `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` after you know both URLs).

---

## Project layout (high level)

| Path | Role |
|------|------|
| `backend/config/` | Django project settings, URLs, WSGI. |
| `backend/core/` | Models, serializers, views, permissions, management commands, tests. |
| `frontend/src/app/` | Next.js App Router pages (student, teacher, school, auth, timed demo). |
| `frontend/src/components/` | Reusable UI. |
| `frontend/src/utils/` | Client helpers (auth redirect, axios wrapper, demo session, marks, dates). |
| `resources/` | Teaching notes; see `resources/README.md` for the full index (architecture, permissions, lexicon, homework lifecycle, Next.js routes, styling, security checklist, etc.). |
| `STARTUP.md` | Shorter startup cheat sheet (still valid alongside this README). |
| `DEPLOY.md` | Render (API) + Vercel (frontend) deployment. |
| `render.yaml` | Optional Render Blueprint (Postgres + web service). |

---

## Licence / status

This build is intended for **learning and demonstration**. It is not represented as production-hardened software. Review security settings before any public deployment.
