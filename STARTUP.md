# Startup (local dev)

For a consolidated guide (startup, env, tests, layout), see **`README.md`** at the repository root. Teaching notes for contributors live in **`resources/`**.

See also **`PROJECT_CHANGES.md`** for a short log of recent API and tooling changes.

## Prerequisites

- Docker Desktop (or Docker Engine + Compose)
- Node.js 18+ (for the frontend on the host)

## 1. Environment

- **`backend/.env`** — Django reads this file (see `config/settings.py`). At minimum set `SECRET_KEY` and `DEBUG=True` for local work.
- **Docker / Postgres** — With Compose, leave `USE_SQLITE` unset or `False`, and use the defaults (`DB_HOST=db`, user/password/db `postgres`) so the API container talks to the `db` service.
- **Local SQLite** — If you use `USE_SQLITE=True` in `backend/.env`, you skip Postgres entirely (handy on a laptop without Docker).
- **Root `.env`** — Referenced by `docker-compose.yml` as `env_file` for the backend service; keep it aligned with what the container needs (e.g. same `SECRET_KEY` if you duplicate vars there).
- **Frontend** — `frontend/.env.local` should define `NEXT_PUBLIC_BACKEND_URL` (e.g. `http://localhost:8000`) and `NEXT_PUBLIC_FRONTEND_URL` if your axios setup uses it. For the Pexels-backed image picker (student profile and future homework cover), add **`PEXELS_API_KEY`** (no `NEXT_PUBLIC_` prefix) so Next.js route handlers can call Pexels without exposing the key in the browser.

## 2. Database (first time or after schema changes)

From the **repository root** (Docker):

```bash
docker compose run --rm backend python manage.py migrate
```

From **`backend/`** with a local venv:

```bash
python manage.py migrate
```

## 3. Demo data (optional)

A **management command** creates a fake school, teachers, students, classes, words, and homework. 

**Password for all demo accounts:** `demo12345`

| Role   | Email |
|--------|--------|
| School | `demo-school@example.com` |
| Teachers | `demo-teacher1@example.com`, `demo-teacher2@example.com` |
| Students | `demo-student1@example.com` … `demo-student3@example.com` |

**Run once** (from `backend/` or via Docker):

```bash
python manage.py seed_demo
```

**Rebuild demo data** (deletes users whose emails start with `demo-`, then recreates):

```bash
python manage.py seed_demo --reset
```

Docker example:

```bash
docker compose run --rm backend python manage.py seed_demo
```

## 4. Backend + database (containers)

From the **repository root**:

```bash
docker compose up --build
```

This starts Postgres (`db`) and Django on **http://localhost:8000**. The frontend service in Compose is commented out; Next.js is started separately.

## 5. Frontend (host)

In a **second terminal**:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** (allowed by Django CORS).

## 6. Automated tests

Tests live in **`backend/core/tests/`**. They use Django’s test runner, which creates a **temporary database** (often in-memory SQLite) so your real dev DB is untouched.

From **`backend/`**:

```bash
python manage.py test core.tests -v 2
```

`-v 2` is **verbosity**: more lines per test so failures are easier to read.

## 7. API map (high level)

All routes are prefixed with **`/core/`** (see `backend/core/urls.py`). Examples:

- **Auth:** `login/`, `logout/`, `refresh/`, `auth-status/`, `create-school/`
- **School admin:** `students/`, `students/<id>/`, `teachers/`, `teachers/<id>/`, `classes/`, `classes/edit/`, `classes/update/` (assign), `homework/`, `words/`, etc.
- **Student:** `student-dashboard/`, `student-homework/`, `student-homework/update/`, `student-lexicon/`, `student-profile/`
- **Teacher:** `teacher-dashboard/`, `teacher-profile/`

## Optional

- **Detached containers:** `docker compose up --build -d`
- **Frontend in Docker:** Uncomment the `frontend` service in `docker-compose.yml`, then use Compose for the UI as well.
