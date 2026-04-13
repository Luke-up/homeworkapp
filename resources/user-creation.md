# User creation (tools, safety, method, permissions)

## Roles

The `User` model (`core/models.py`) defines `user_type`: `school`, `teacher`, `student`, or `admin`. Each role has a **profile** table:

- **School** → `School` (OneToOne `user`).
- **Teacher** → `Teacher` (`ForeignKey` to `School`).
- **Student** → `Student` (`ForeignKey` to `School`).

Permissions in views are enforced by checking `request.user.user_type` and, where needed, **`core/access.py`** helpers (e.g. same school, teacher assigned to class).

## School self-signup (public)

**Endpoint:** `POST /core/create-school/` (`CreateSchoolView`).

**Tools:**

- **`UserSerializer`** — creates `User` with hashed password (`create_user`).
- **`SchoolSerializer`** — creates `School` linked to that user.
- **`verify_recaptcha_v2`** — optional in dev (no secret), required when `RECAPTCHA_SECRET_KEY` is set.

**Safety:**

- Incoming `user_type` from the client is **overridden** to `school` so callers cannot mint teacher/student accounts through this endpoint.
- reCAPTCHA reduces automated abuse.
- Email uniqueness is enforced at the database level.

**Process:**

1. Validate reCAPTCHA token.
2. Validate and save `User` (email, password, name, forced `school` type).
3. Validate and save `School` with `user` id and organisation `name`.

## School-created teachers and students

**Teachers:** `POST /core/teachers/create/` (`CreateTeacherView` in `school_views.py`).

- Only `request.user.user_type == 'school'` may call.
- Creates a `User` with `user_type='teacher'` and a `Teacher` row scoped to the school admin’s `school_profile`.

**Students:** `POST /core/students/create/` (`CreateStudentView`).

- Same school-only guard.
- Creates `User` (`student`) + `Student` + enrollments as provided by the API contract.

Passwords are set at creation time using Django’s normal hashing.

## Timed demo users

**`POST /core/demo-session/start/`** (`StartTimedDemoView`):

- Creates a **fresh school** with `demo_expires_at` set (now + N minutes).
- Calls `populate_demo_school()` to add teachers, students, classes, homework, etc.
- Emails are prefixed with `timedemo-` tags so `seed_demo --reset` can clean them up.

reCAPTCHA uses the same verifier as signup when the secret is configured.

## Permissions summary

| Action | Who |
|--------|-----|
| List/edit own school directory | School user for their school |
| Create class / homework / word | School |
| Mark homework, view class roster | Teacher assigned to class (or school override where implemented) |
| Submit answers, view own dashboard | Student |
| Cross-school access | Denied (404/403 patterns in views) |

## Related reading

- `resources/models.md` — schema for `User`, `School`, `Teacher`, `Student`.
- `resources/views-school.md` — create/list/update endpoints.
