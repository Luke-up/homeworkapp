# Models — relationships and data types

All models below live in **`backend/core/models.py`** unless noted.

## User

- **Purpose:** Authentication identity and global display name.
- **Key fields:**
  - `email` — `EmailField`, unique; used as `USERNAME_FIELD`.
  - `password` — managed by `AbstractBaseUser` (hashed).
  - `name` — `CharField(max_length=255)`.
  - `user_type` — `CharField` with choices: `school`, `teacher`, `student`, `admin`.
  - `is_staff`, `is_active`, `is_superuser` — standard Django flags.
- **Manager:** `CustomUserManager` with `create_user` / `create_superuser`.

## School

- **Relationship:** `user` — **OneToOneField** to `User` (`related_name='school_profile'`). Each school admin account owns exactly one school row.
- **Fields:**
  - `name` — `CharField(255)`.
  - `demo_expires_at` — `DateTimeField`, null/blank. When set, the school is a **timed live demo** sandbox scheduled for deletion (`demo_session`).

## Class

- **Relationships:**
  - `school` — **ForeignKey** to `School` (`related_name='classes'`). Every class belongs to one school.
  - `teachers` — **ManyToManyField** to `Teacher` (`related_name='classes_teaching'`).
  - `students` — **ManyToManyField** to `Student` (`related_name='classes_enrolled'`).
- **Fields:** `name`, `description` (Text, blank), `level` (Integer).

## Teacher

- `user` — **OneToOneField** to `User` (`teacher_profile`).
- `school` — **ForeignKey** to `School` (`teachers` reverse).
- `name`, `avatar_url` (`URLField`, max 500, blank).

## Student

- `user` — **OneToOneField** to `User` (`student_profile`).
- `school` — **ForeignKey** to `School`.
- `name`, `avatar_url`.
- `effort_symbol` — `DecimalField(max_digits=5, decimal_places=2, default=0)`. Rolling value updated when teachers mark homework (weighted blend with new mark in `student_views` / `demo_populate`).

## Homework

- `class_field` — **ForeignKey** to `Class` (`related_name='homework_classes'`).
- `title` — `CharField(255)`.
- `level` — `IntegerField` (also used when creating via API).
- `cover_image_url` — `URLField(500)`, blank — hero image for cards and student UI.
- `words` — **ManyToMany** to `Word`, blank.
- `reading`, `summary` — `TextField`, blank.
- `questions` — **`JSONField`** (nullable) — list of question objects (`q`, `type`, etc.); normalised in serializers.
- `due_date` — `DateField`, null/blank.

## StudentHomework

Join table for a student’s attempt at one homework template.

- `student` — **ForeignKey** (`related_name='homework_details'`).
- `homework` — **ForeignKey** (`related_name='student_details'`).
- `submitted` — `BooleanField`, default False.
- `marked` — `BooleanField`.
- `mark_value` — `DecimalField`, null/blank — teacher “effort” score (0–5 scale in product logic).
- `submission_date` — `DateTimeField`, null/blank.
- `teacher_comment` — `TextField`, blank.
- `answers` — **`JSONField`** — aligned list of `{question, answer}` rows; synced from template while not submitted (`save()` override).

## Word

- Global lexicon entries: `word` (`CharField`), `example_sentence` (`TextField`).

## Relationship diagram (conceptual)

```text
User 1──1 School
User 1──1 Teacher ──* Class *──* Student
School 1──* Class
Class  1──* Homework *──* Word (M2M)
Student *──* StudentHomework *──1 Homework
```

## Data type rationale

- **JSONField** for `questions` and `answers` allows evolving question shapes without migrations for every template tweak (trade-off: fewer DB-level constraints—validation lives in serializers/Python).
- **DecimalField** for marks avoids float rounding surprises in averages and displays.
- **URLField** for avatars and covers stores HTTPS links (e.g. Pexels/Unsplash) rather than binary blobs—simpler hosting, CDN-friendly.
