# Deploy: Render (API) + Vercel (frontend)

Split hosting for this repo: **Django** on [Render](https://render.com), **Next.js** on [Vercel](https://vercel.com).

## Prerequisites

- GitHub (or GitLab) repo connected to both platforms.
- A Vercel project for `frontend/` (or the monorepo with **Root Directory** = `frontend`).

---

## 1. Render — PostgreSQL

1. In the Render dashboard, **New +** → **PostgreSQL**.
2. Note the **Internal Database URL** (or use a Blueprint — see `render.yaml`).

Render injects **`DATABASE_URL`** when you link the database to a web service.

---

## 2. Render — Web service (Django)

**Option A — Blueprint**

1. **New +** → **Blueprint**.
2. Point at this repo; Render reads `render.yaml`.
3. After the first deploy fails or succeeds, open the web service → **Environment** and set:
   - **`ALLOWED_HOSTS`** — your service hostname only, e.g. `granadilla-api.onrender.com` (no `https://`).
   - **`CORS_ALLOWED_ORIGINS`** — your Vercel URL(s), comma-separated, **with scheme**, e.g. `https://granadilla.vercel.app`.
   - **`CSRF_TRUSTED_ORIGINS`** — if you use **Django admin** on the API URL, add `https://granadilla-api.onrender.com` (same comma-separated style as Django expects).

**Option B — Manual**

| Setting | Example / notes |
|---------|------------------|
| **Root directory** | `backend` |
| **Build command** | `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate --noinput` |
| **Start command** | `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT` |
| **Runtime** | Python 3.12 |

**Environment variables**

| Key | Required | Notes |
|-----|----------|--------|
| `SECRET_KEY` | Yes | Long random string; Render can generate one. |
| `DEBUG` | Yes | `False` |
| `DATABASE_URL` | Yes | From linked Postgres (or paste from dashboard). |
| `ALLOWED_HOSTS` | Yes (prod) | Comma-separated hostnames, e.g. `granadilla-api.onrender.com` |
| `CORS_ALLOWED_ORIGINS` | Yes | `https://your-app.vercel.app` (comma-separated if several) |
| `CSRF_TRUSTED_ORIGINS` | If using admin | `https://granadilla-api.onrender.com` |
| `RECAPTCHA_SECRET_KEY` | Recommended | For signup + timed demo when going public |
| `DEMO_SESSION_MINUTES` | Optional | Default `20` |

**Do not** set `USE_SQLITE=True` on Render.

Copy the public **web service URL** (e.g. `https://granadilla-api.onrender.com`) — you need it for Vercel.

---

## 3. Vercel — Next.js

1. **New project** → import the repo.
2. **Root Directory**: `frontend` (or set in project settings).
3. **Framework preset**: Next.js (auto).
4. **Environment variables**:

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_BACKEND_URL` | `https://granadilla-api.onrender.com` (no trailing slash) |
| `NEXT_PUBLIC_FRONTEND_URL` | `https://your-app.vercel.app` (your production site URL) |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | If using reCAPTCHA (must pair with `RECAPTCHA_SECRET_KEY` on Render) |
| `PEXELS_API_KEY` | For homework cover search (server route only — **not** `NEXT_PUBLIC_`) |

5. Deploy. Then **update Render** `CORS_ALLOWED_ORIGINS` to include the exact Vercel URL (including `https://`) and redeploy or clear cache if needed.

---

## 4. First-time API setup

- **Create superuser** (optional, for admin): use Render **Shell**:
  `python manage.py createsuperuser`
- **Demo data**: `python manage.py seed_demo` from Shell if you want fixed demo logins (do not run `--reset` on production without intent).

---

## 5. Ongoing jobs (timed demo)

If you keep **live demo**, add a Render **Cron Job** or external scheduler:

```bash
python manage.py purge_expired_demos
```

Use the same repo, root `backend`, and link the same env / `DATABASE_URL` as the web service.

---

## 6. Local development

Unchanged: `USE_SQLITE=True`, `DEBUG=True`, and leave `CORS_ALLOWED_ORIGINS` unset to get localhost defaults from `settings.py`.

---

## Troubleshooting

| Symptom | Likely fix |
|---------|------------|
| CORS error in browser | Add exact frontend origin to `CORS_ALLOWED_ORIGINS` on Render (scheme + host, no path). |
| `DisallowedHost` | Add API hostname to `ALLOWED_HOSTS` (no `https://`). |
| 500 on static/admin | Run `collectstatic` in build (already in `render.yaml`); check `WhiteNoise` in `MIDDLEWARE`. |
| DB connection errors | Ensure `DATABASE_URL` is set and migrations ran; free DBs spin down — first request may be slow. |

---

## Files touched for this setup

- `backend/config/settings.py` — `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`, `DATABASE_URL`, `STATIC_ROOT`, WhiteNoise.
- `backend/requirements.txt` — `whitenoise`.
- `render.yaml` — optional Blueprint.
- This `DEPLOY.md`.
