# Tests — structure, behaviour, and extending

Backend tests live in **`backend/core/tests/`**. The suite uses Django’s **`TestCase`** and DRF’s **`APIClient`** for HTTP-level checks against the real URLconf (`/core/...`). The test runner creates a **temporary database** (often in-memory SQLite per Django defaults), so migrations still run and your development `db.sqlite3` is untouched.

## `helpers.py`

Factory-style helpers: `create_school_user`, `create_teacher`, `create_student`, `create_class`, etc. They keep tests short and ensure consistent school/student graphs.

**When adding tests:** prefer extending helpers over copy-pasting user creation blocks—reduces drift when `User` or profile fields change.

## `test_access.py`

Pure **unit tests** for `core/access.py`—no HTTP.

### `TeacherCanAccessClassTests`

- Confirms the **school user** may access their own classes.
- Confirms they **cannot** access another school’s class.
- Confirms an **assigned teacher** may access, and an **unassigned** teacher may not.

### `UserCanAccessStudentHomeworkTests`

Builds a minimal class, homework, and `StudentHomework` row; asserts:

- Student sees **own** attempt.
- **Other student** in same school cannot.
- **School admin** of same school can.
- **Assigned teacher** can; **other teacher** in same school without assignment cannot.

**Teaching point:** access rules are centralized so serializers/views stay thin—tests here guard **authorization invariants** without standing up full view classes.

## `test_api.py`

### `LoginAndAuthStatusTests`

- Login returns **200** + `access`/`refresh`/`user_type`.
- Wrong password → **400**.
- `auth-status` without token → **401**.
- With `force_authenticate`, returns authenticated payload.

### `SchoolStudentDetailTests`

- School can **GET** own student detail.
- School gets **404** for other school’s student id (information hiding).
- Teacher gets **403** for student detail (role separation).

### `HomeworkListTests`

- School and assigned teacher can list homework with `class_id`.
- Missing `class_id` → **400**.
- Teacher can fetch homework **template detail**; unassigned teacher from another school → **403**.

### `CreateSchoolTests`

- Even if client sends `user_type: student`, created user is **forced to school**—locks down public registration.

### `StudentHomeworkPatchTests`

- Student can PATCH own row to submitted.
- Other student cannot PATCH foreign row.
- After submit, student cannot PATCH **answers** (immutability rule).

### `StudentHomeworkDetailTests`

- Student can load own detail JSON with aligned answers.
- Foreign student → **403**.

### `TeacherClassStudentsWorkTests`

- Teacher and school can load students-work summary for a class they manage.

### `TeacherMarkHomeworkDetailTests`

- Assigned teacher can open mark detail; other school’s teacher → **403**.

### `SchoolClassAssignRemoveTests`

- PATCH `classes/update/` with `remove: true` for teacher and student detaches M2M links.

### `RefreshTokenTests`

- Refresh endpoint accepts **`refresh_token`** key alias and returns new access.

## Running tests

```bash
cd backend
python manage.py test core.tests -v 2
```

## Building more tests

1. **Name tests** `test_<behaviour>_<expected>` for readability in verbose output.
2. **Prefer APIClient** when verifying permission matrixes end-to-end.
3. **Use `force_authenticate`** when you only need an authenticated user without going through login.
4. **Assert status codes and payload keys** that the frontend depends on—those are your contract tests.
5. For new views, add at least: **happy path**, **wrong role**, **wrong school**, **missing required query/body**.

## Related reading

- `resources/views-*.md` — which branch of logic you are locking down.
- `resources/authentication.md` — token and demo-expiry behaviour tested indirectly through login/refresh.
