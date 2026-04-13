# Views: `school_views.py`

File: **`backend/core/views/school_views.py`**. These endpoints are intended for **`user_type == 'school'`** unless each view states otherwise. Most mutations check the school admin’s `school_profile` id against the target rows.

## Helper: `_apply_user_email_and_password`

Shared PATCH logic for **User** rows owned by teachers/students: optional email uniqueness check, optional password change with confirmation and minimum length. Returns a `Response` error or `None` on success.

## `CreateTeacherView` / `CreateStudentView`

- **POST:** Validate required fields; create `User` with appropriate `user_type`; create `Teacher` or `Student` bound to the same school as `request.user.school_profile`.
- Typical teaching point: **always** create `User` first so authentication and permissions have a stable primary key.

## `CreateClassView`

- **POST:** Creates `Class` under the caller’s school with name/description/level from JSON.

## `ListClassesView`

- **GET:** Returns **`SchoolDetailSerializer`** for the authenticated school—nested classes, teachers, students. This is the payload the **school dashboard** consumes.

## `CreateHomeworkView`

- **POST:** Validates `HomeworkSerializer` including nested words; serializer `create()` ensures `StudentHomework` rows exist for enrolled students.

## `AssignToClassView`

- **PATCH:** Adds or removes teachers/students on a class via ids in JSON (`teacher_id`, `student_id`, optional `remove` flag). Validates class belongs to caller’s school.

## `DeleteClassView` / `DeleteHomeworkView` / `DeleteWordView`

- **POST:** Destroys rows scoped to the school (or global word bank for words—check implementation for school vs global).

## `ListStudentsView` / `ListTeachersView`

- **GET:** Directory listings using lightweight serializers (`SchoolStudentDirectorySerializer`, `SchoolTeacherDirectorySerializer`) for performant grids.

## `StudentDetailView` / `TeacherDetailView`

- **GET:** Full profile for own-school id; foreign ids should return **404** (hide existence) or **403** per implementation—teaching moment: avoid leaking whether an id exists in another tenancy.
- **PATCH:** Partial updates for profile fields; may delegate user email/password to `_apply_user_email_and_password`.

## `UpdateClassView`

- **PATCH:** Updates class metadata (name, description, level) for a class owned by the school.

## `ListWordsView`

- **GET:** Global word bank for homework authoring.

## Design pattern

School views form the **administrative backbone**: they orchestrate users, classes, and templates. Teacher views reuse **access** helpers (`teacher_can_access_class`) for instructional workflows—see `resources/views-teacher.md`.
