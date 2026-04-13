# Views: `auth_views.py`

File: **`backend/core/views/auth_views.py`**.

## `AuthStatusView`

- **Permission:** `IsAuthenticated`.
- **GET:** Returns `{ isAuthenticated: true, userType }` from `request.user.user_type`. Used by the Next.js home page to redirect logged-in users to the correct dashboard.

## `LoginView`

- **Permission:** `AllowAny`.
- **POST:** Reads `email`, `password`; calls `authenticate(email=email, password=password)`.
- **Demo guard:** `raise_if_demo_expired(user)` before issuing tokens—timed demos cannot log in after expiry.
- **Success:** Returns SimpleJWT `refresh` + `access` strings and `user_type`.
- **Failure:** `400` with `{ error: 'Invalid credentials' }`.

## `LogoutView`

- **Permission:** `AllowAny` (no server-side session to destroy).
- **POST:** Returns a polite success message; clients delete stored JWTs.

## `CreateSchoolView`

- **Permission:** `AllowAny`.
- **POST:** Verifies reCAPTCHA when configured; copies request data, **forces** `user_type` to `school`; validates `UserSerializer` then `SchoolSerializer` chain. Returns `201` on success or serializer errors as `400`.

## `RefreshTokenView`

- **Permission:** `AllowAny`.
- **POST:** Accepts refresh token under `refresh_token` or `refresh`; loads `RefreshToken`, checks embedded `user_id` against `raise_if_demo_expired`, returns new access/refresh pair.
- **Errors:** `demo_expired` → `401` with detail; invalid token → `400`.

## `StartTimedDemoView`

- **Permission:** `AllowAny`.
- **POST:** reCAPTCHA when secret configured.
- **Transaction:** Creates `User` + `School` with `demo_expires_at`, random tag, random password; calls `populate_demo_school(school, password, email_tag=tag)`.
- **Response:** `201` with `expires_at`, `demo_session_minutes`, `password`, and `accounts` emails for school/teacher/student so the frontend can open three tabs and log each in.

Teaching angle: this is the **only** path that should create timedemo-prefixed users at scale; keep purge/management commands aligned (`purge_expired_demos`, `seed_demo --reset`).
