# Error handling and a learner’s security checklist

This document summarises **how errors move through the stack** and a **checklist** of security topics to study beyond the PoC defaults.

## Backend (DRF)

- **Validation errors:** Serializers return **`400`** with field-keyed JSON; views pass through `serializer.errors`.
- **Auth failures:** **`401`** — missing/invalid JWT, expired refresh, or **`demo_expired`** with a structured body the frontend keys off.
- **Permission failures:** **`403`** — authenticated user not allowed for the object.
- **Missing resources:** **`404`** — sometimes deliberately used for **cross-tenant** ids to avoid leaking existence.

**Teaching point:** keep **error shapes** consistent (`error` string vs `detail`) when adding endpoints so the frontend’s defensive parsing (`typeof payload?.error === 'string'`) stays maintainable.

## Frontend

- **Signup / forms:** Surface API messages in `<p className="auth-page-error">` (or equivalent).
- **Axios interceptor:** On **`401`**, attempts refresh; on failure or **`403`/`401`/`404`** in some branches, clears tokens and redirects **`/`** (product choice—documented in `frontend-utils.md`).
- **Demo expiry:** Special-case **`code === 'demo_expired'`** → clear demo state → redirect to signup query param.

## Security checklist (learning topics)

| Topic | PoC state | Hardening direction |
|-------|-----------|---------------------|
| **HTTPS** | Local HTTP | Terminate TLS; HSTS. |
| **Secrets** | `.env` / `.env.local` | Secret manager, never commit. |
| **CORS** | Single dev origin | Explicit production origins. |
| **ALLOWED_HOSTS** | `*` | Domain list. |
| **CSRF** | JWT APIs often exempt browser CSRF for JSON | If you add cookie sessions, enable CSRF properly. |
| **XSS** | React escapes by default | Avoid `dangerouslySetInnerHTML`; sanitise rich text if added. |
| **Rate limiting** | Not shown | Limit login, signup, demo start. |
| **Password policy** | Minimum length in PATCH handlers | Django validators + unified policy. |
| **Authorization** | `access.py` + view checks | Audit every new endpoint; add tests. |
| **Dependency updates** | Manual | CI + Dependabot. |

## Privacy / compliance

The app stores **education-like demo data** only. A real deployment would need **privacy policy**, **data retention**, **parental consent** where applicable, and **GDPR/FERPA** (or local equivalent) analysis—out of scope for this codebase but essential for coursework comparing “demo” vs “production.”

## Related reading

- `authentication.md` — tokens and demo expiry.
- `permissions-and-access-control.md` — who may access which rows.
- `tests.md` — encode permission rules as automated tests.
