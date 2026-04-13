# Views: `teacher_views.py`

File: **`backend/core/views/teacher_views.py`**. Targets **`user_type == 'teacher'`** unless a view explicitly allows school users too (some list endpoints mirror school capabilities for shared routes).

## `TeacherSelfProfileView`

- **GET:** `TeacherDetailSerializer` for dashboard + profile editing.
- **PATCH:** Avatar, display name (keeps `User.name` in sync), email, password—same validation style as student self-profile.

## `TeacherMarkHomeworkDetailView`

- **GET:** One `StudentHomework` row with nested homework for the marking UI.
- **Access:** `user_can_access_student_homework` ensures the teacher teaches the class that owns the homework template.

## `TeacherDashboardView`

- **GET:** Aggregates classes the teacher teaches, pending work counts, and other summary fields consumed by `/teacher` in the frontend.

## `TeacherClassStudentsWorkView`

- **GET:** Per-class roster with each student’s pending/unmarked counts—supports both teacher and school callers where noted in code (check `permission` branches in file). Used for “who still owes work” boards.

## `HomeworkTemplateDetailView`

- **GET:** Homework template by id with **`HomeworkSerializer`** shape; forbids teachers not assigned to the class (`teacher_can_access_class`).

## `ListHomeworkForClassView`

- **GET:** Requires `class_id` query param; lists homework templates for that class if caller may access the class.

## `ClassRosterView`

- **GET:** Students in a class with access checks—used when drilling into a class from the teacher UI.

## Relationship to school views

Teachers **cannot** create school-wide users, but they may share **read** paths with schools for instructional data (class homework lists, rosters). Any write that changes marks still flows through **`StudentHomeworkUpdateView`** in `student_views.py`—teachers PATCH the same endpoint with teacher fields.
