# Django settings and configuration

Primary file: **`backend/config/settings.py`**. The project uses **`django-environ`** to load **`backend/.env`**.

## Critical settings

| Setting | Role |
|---------|------|
| **`SECRET_KEY`** | Required from env; signs sessions, CSRF, Django crypto—never commit real production keys. |
| **`DEBUG`** | Boolean; extra error pages and static behaviour—**False** in production. |
| **`ALLOWED_HOSTS`** | Comma-separated list via **`ALLOWED_HOSTS`** env (`django-environ` `env.list`). With **`DEBUG=True`**, defaults include `localhost`, `127.0.0.1`, and `*`. With **`DEBUG=False`**, set explicitly (e.g. `api.example.onrender.com`). |
| **`CSRF_TRUSTED_ORIGINS`** | Comma-separated HTTPS origins for admin/forms behind HTTPS (e.g. `https://api.example.onrender.com`). |
| **`AUTH_USER_MODEL`** | `'core.User'` — custom user with email login. |

## Database switch

- **`USE_SQLITE=True`** (env bool) → SQLite file at `BASE_DIR / 'db.sqlite3'`.
- Else if **`DATABASE_URL`** is set (Render, Heroku-style) → `env.db()` parses it for PostgreSQL.
- Otherwise → **PostgreSQL** with discrete `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST` (default host `db` for Docker), `DB_PORT`.

Teaching point: one codebase supports **laptop SQLite** and **Compose Postgres** without code forks—only env changes.

## Django REST Framework

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'core.demo_jwt_authentication.DemoAwareJWTAuthentication',
    ),
}
```

Every view that uses `IsAuthenticated` gets **`DemoAwareJWTAuthentication`** by default: JWT validation **plus** timed-demo expiry (see `authentication.md`).

**Note:** There is no project-level `DEFAULT_PERMISSION_CLASSES` in the snippet you have—each `APIView` sets `permission_classes` explicitly (often `[IsAuthenticated]`).

## Static files (production)

**`STATIC_ROOT`** is `BASE_DIR / 'staticfiles'`. **WhiteNoise** (`whitenoise.middleware.WhiteNoiseMiddleware`) serves collected static files when you run **`collectstatic`** (e.g. on Render build).

## CORS

`django-cors-headers` is first in **`MIDDLEWARE`**. **`CORS_ALLOWED_ORIGINS`** is built from the **`CORS_ALLOWED_ORIGINS`** env var (comma-separated full origins, e.g. `https://app.vercel.app`). When **`DEBUG`** is true, `http://localhost:3000` and `http://127.0.0.1:3000` are appended automatically if missing.

## reCAPTCHA

**`RECAPTCHA_SECRET_KEY`** — optional; empty means `verify_recaptcha_v2` returns success without calling Google (`recaptcha.py`). **Set in production** for signup and demo start.

## Demo session length

**`DEMO_SESSION_MINUTES`** — env int, default **20**. Drives `School.demo_expires_at` at demo creation.

## URL routing

**`ROOT_URLCONF = 'config.urls'`** mounts:

- `admin/` — Django admin.
- `core/` — all API routes from `core.urls`.

There is no global `/api/` prefix—the frontend uses **`NEXT_PUBLIC_BACKEND_URL`** pointing at `http://localhost:8000` and paths like `/core/login/`.

## Time zone

**`TIME_ZONE = 'UTC'`** with **`USE_TZ = True`**. Date comparisons for “overdue” use **`timezone.localdate()`** in serializers—keep server and client expectations aligned when displaying due dates.

## Related reading

- Root **`README.md`** — env file locations and examples.
- **`architecture-overview.md`** — how settings connect to auth and DB.
