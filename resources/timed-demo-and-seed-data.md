# Timed demo and seed data

This project supports two ways to get **realistic fake data**: a **long-lived CLI seed** (`seed_demo`) and a **short-lived browser sandbox** (timed demo + `demo_expires_at`).

## Timed demo (browser)

### Start

- **Frontend:** Home page calls `POST /core/demo-session/start/` via `runTimedLiveDemoFromBrowser` (after optional reCAPTCHA and opening three blank tabs).
- **Backend:** `StartTimedDemoView` (`auth_views.py`) creates:
  - A `User` + `School` with **`demo_expires_at = now + DEMO_SESSION_MINUTES`** (default 20, from `settings.py` / env).
  - A random `email_tag` and strong random **shared password** for demo accounts.
- **`populate_demo_school(school, password, email_tag=tag)`** in `demo_populate.py` fills teachers, students, classes, words, homework, submissions, and marks—same graph as CLI seed but emails are **`timedemo-{tag}-…`** and teacher/student emails include the tag.

### Enforcing expiry

1. **Login / refresh:** `raise_if_demo_expired(user)` in `demo_session.py` — if `now > demo_expires_at`, deletes the demo school + users and raises **`AuthenticationFailed`** with **`code='demo_expired'`**.
2. **Every API request:** `DemoAwareJWTAuthentication` runs after JWT validation and calls the same helper—so an old access token cannot keep working after expiry.
3. **Frontend:** `axiosInterceptor` watches for `demo_expired`, clears `localStorage` demo bundle and tokens, redirects to signup with `?demo_expired=1`.

### Purge without a request

**Management command:** `python manage.py purge_expired_demos`

- Calls **`purge_expired_timed_demo_schools()`** — finds schools with `demo_expires_at` in the past and **`delete_timed_demo_school`** each.
- **`delete_timed_demo_school`** deletes the `School` row (cascades to classes, homework, etc. per FKs), then deletes the collected **user ids** (school admin, teachers, students). **Global `Word` rows** from the demo may remain in the DB (comment in code)—acceptable for a lab; tighten if you need a sterile word bank.

**Operations note:** Run purge from **cron** in production if you use timed demos at scale.

## CLI seed (`seed_demo`)

**Command:** `python manage.py seed_demo` (`management/commands/seed_demo.py`).

- **`--reset`:** Deletes users whose email starts with **`demo-`** or **`timedemo-`**, then allows recreate.
- If `demo-school@example.com` already exists, skips unless `--reset`.
- Calls **`populate_demo_school`** with **`email_tag=None`** → classic emails (`demo-teacher1@…`, etc.).

**Password:** `demo12345` (constant in command + docs).

**Covers:** `demo_populate.py` sets **`cover_image_url`** on each homework from themed Unsplash URLs.

## Shared population module

**`demo_populate.py`** is the **single implementation** of the graph (classes, homework, `StudentHomework` rows, `apply_demo_mark`, etc.). Both timed demo and `seed_demo` call into it—avoid duplicating demo data in fixtures.

## Related reading

- `authentication.md` — JWT + demo expiry.
- `user-creation.md` — public signup vs demo users.
- `models.md` — `School.demo_expires_at`.
