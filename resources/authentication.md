# Authentication (method, safety, process, considerations)

## Method

Granadilla uses **JSON Web Tokens (JWT)** via **djangorestframework-simplejwt**. After a successful `POST /core/login/`, the API returns:

- **`access`** — short-lived bearer token sent on each API request (`Authorization: Bearer …`).
- **`refresh`** — longer-lived token used to obtain a new access token without re-entering the password.

The frontend stores both in **`sessionStorage`** (cleared when the browser tab session ends), not `localStorage`, except for the **timed demo** bundle (credentials + expiry) which uses `localStorage` under a dedicated key so three tabs can share the demo password.

**Auth status:** `GET /core/auth-status/` with the access token returns `{ isAuthenticated, userType }` so the client can route to `/school`, `/teacher`, or `/student`.

**Logout:** JWTs are stateless; `POST /core/logout/` returns success while the **client discards** tokens.

## Process (request lifecycle)

1. User submits email/password to `LoginView` (`backend/core/views/auth_views.py`).
2. Django `authenticate()` validates credentials against the custom `User` model (`USERNAME_FIELD = 'email'`).
3. **Timed demo guard:** if the user belongs to a school whose `demo_expires_at` is in the past, login and refresh are rejected with `AuthenticationFailed` / `demo_expired` (see `core/demo_session.py`, `core/demo_jwt_authentication.py`).
4. On success, `RefreshToken.for_user(user)` mints tokens; access token claims include user id for refresh validation.
5. Authenticated views use `IsAuthenticated` and optionally check `request.user.user_type` or domain helpers in `core/access.py`.

## Refresh flow

`POST /core/refresh/` accepts `refresh` or `refresh_token`. It validates the refresh token, re-checks demo expiry for the embedded user id, and returns rotated access (and refresh) strings.

The frontend **`axiosInterceptor`** (`frontend/src/utils/axiosInterceptor.js`) intercepts **401** responses: if a refresh token exists, it calls `/core/refresh/`, updates `sessionStorage`, and retries the original request once.

## Safety considerations

| Topic | Approach / risk |
|-------|------------------|
| Token storage | `sessionStorage` limits exposure to other sites (XSS still steals tokens—see below). |
| XSS | Any script on the page can read tokens. Mitigate with strict CSP, dependency hygiene, and avoiding `dangerouslySetInnerHTML` with untrusted data. |
| CSRF | JWT in `Authorization` header is not automatically sent cross-site; still avoid lax CORS. |
| HTTPS | Production must terminate TLS; never send tokens over plain HTTP. |
| Password storage | Django hashes passwords (`AbstractBaseUser`); passwords are never stored in plaintext. |
| Demo schools | Isolated dataset with auto-expiry; purge command removes expired rows (`purge_expired_demos`). |
| reCAPTCHA | Public signup and timed demo **start** verify tokens when `RECAPTCHA_SECRET_KEY` is set (`core/recaptcha.py`). If the secret is missing, verification **passes** to ease local development—**do not** ship production without keys. |

## Custom authentication class

`demo_jwt_authentication.py` wraps JWT authentication so that **every authenticated request** by a timed-demo user can be blocked once the school’s `demo_expires_at` has passed—preventing long-lived access tokens from outliving the sandbox.

## CORS

`django-cors-headers` in `settings.py` allows the Next.js dev origin (e.g. `http://localhost:3000`). Tighten `CORS_ALLOWED_ORIGINS` in production to real frontend hostnames.

## Related reading

- `resources/user-creation.md` — account creation paths.
- `resources/url-endpoints.md` — auth routes.
- `resources/frontend-utils.md` — axios interceptor behaviour in detail.
