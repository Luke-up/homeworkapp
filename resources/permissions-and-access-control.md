# Permissions and access control

Granadilla uses **two complementary mechanisms**: DRF **permission classes** (declarative, class-level) and **plain Python helpers** in `access.py` (object-level, called from views). Many views still use **inline `request.user.user_type` checks**; the permission classes exist for reuse or stricter class defaults.

## `core/access.py` (object-level)

### `school_for_user(user)`

- Returns **`user.school_profile`** only if `user_type == 'school'`.
- Otherwise returns **`None`**.
- Use when the operation is strictly the **school admin** acting as the tenant owner.

### `teacher_can_access_class(user, class_obj)`

- **School user:** allowed if `class_obj.school_id == user.school_profile.id` (same tenant).
- **Teacher:** allowed if same school **and** the teacher appears in `class_obj.teachers` M2M.
- **Student / other:** `False`.

Used before listing homework, opening rosters, or any class-scoped mutation where the teacher must be **assigned**.

### `user_can_access_student_homework(user, student_homework)`

Central gate for a **`StudentHomework`** row:

| User type | Rule |
|-----------|------|
| **Student** | `student_homework.student_id` must equal `user.student_profile.id`. |
| **School** | Student’s `school_id` must equal the school admin’s school. |
| **Teacher** | Same school as teacher **and** teacher is in `homework.class_field.teachers`. |
| **Other** | `False`. |

**Teaching point:** this is **object-level** authorization—you must load `StudentHomework` (with `select_related` as needed) before calling. It does not replace authentication.

## `core/permissions.py` (class-level)

Defines `BasePermission` subclasses:

- **`IsSchoolUser`**, **`IsTeacherUser`**, **`IsStudentUser`** — `has_permission` checks `user.is_authenticated` and exact `user_type`.
- **`IsSchoolOrTeacher`** — union of school and teacher.

**Current codebase note:** grep shows these classes are **defined** in `permissions.py`; many views still use `if request.user.user_type != 'school'` instead of `permission_classes = [IsAuthenticated, IsSchoolUser]`. Both styles are valid; mixing them is a **maintainability** choice—prefer one pattern in new code.

## HTTP status patterns (tenant safety)

- **403 Forbidden** — Authenticated but not allowed (e.g. teacher not on class).
- **404 Not Found** — Sometimes used for **cross-tenant** ids so attackers cannot distinguish “exists elsewhere” from “does not exist” (check each view).

## Relationship to authentication

- **Authentication** answers *who is this user?* (`DemoAwareJWTAuthentication` + JWT).
- **Access helpers** answer *may this user act on this row?*

Demo expiry is handled in **`demo_session.raise_if_demo_expired`** at auth time, not inside `access.py`.

## Related reading

- `authentication.md` — JWT and demo expiry.
- `views-student.md` — `StudentHomeworkUpdateView` branches by role after `user_can_access_student_homework`.
- `tests.md` — `test_access.py` encodes the matrix for `access.py`.
