# Views: `student_views.py`

File: **`backend/core/views/student_views.py`**. Almost every endpoint requires **`user_type == 'student'`** and uses `request.user.student_profile`.

## `StudentSelfProfileView`

- **GET:** Returns `StudentDetailSerializer(student)`—note this is the **same serializer class** as the dashboard, so the profile GET is a large payload; the UI may only need a subset.
- **PATCH:** Allows `avatar_url`, `email` (with uniqueness check), and `password` + `password_confirm` with validation mirrors school admin user updates.

Teaching point: keep **student self-service** rules explicit—students must not change `name` if the product decision is school-managed only (the code omits name PATCH here).

## `StudentDashboardView`

- **GET:** Same `StudentDetailSerializer` as above—powers overdue/new assignment lists, lexicon stats, effort average, etc.

## `StudentHomeworkUpdateView`

- **PATCH:** Core **submission and marking** endpoint keyed by `student_homework_id`.
- **Access:** `user_can_access_student_homework` allows **student** (own), **teacher** (class they teach), or **school** (same school).
- **Branching:**
  - **Teacher/school:** may set `teacher_comment`, `mark_value`, `marked`. When marking with a numeric mark, updates the student’s **`effort_symbol`** using the same weighted formula as elsewhere (rolling blend).
  - **Student:** may set `submitted`, `submission_date`, `answers` **unless** already submitted—then answers are locked.
- **Answers:** Student branch merges incoming answers with homework question templates via `merge_student_answer_rows` to prevent misaligned lengths.

## `StudentLexiconView`

- **GET:** Returns lexicon rows ordered `new` or `old` using `lexicon_rows_for_student` and `StudentLexiconRowSerializer`.

## `StudentHomeworkDetailView`

- **GET:** Single `StudentHomework` by primary key for the signed-in student; access helper ensures ownership.

## `StudentHomeworkView`

- **GET:** Returns `{ enrolled_classes, completed }` where `completed` is marked `StudentHomeworkSerializer` rows—student “library” of finished work.

## Related modules

- **`core/access.py`** — `user_can_access_student_homework`.
- **`core/student_homework_answers.py`** — answer row alignment.
- **`core/lexicon.py`** — lexicon aggregation.
