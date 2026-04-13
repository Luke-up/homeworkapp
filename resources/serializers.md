# Serializers — overview and complex cases

Serializers live in **`backend/core/serializers.py`**. They translate Django models to JSON and enforce validation on writes.

## Simple serializers

- **`UserSerializer`** — registration: `email`, `password` (write-only), `name`, `user_type`. `create()` calls `User.objects.create_user`.
- **`SchoolSerializer`** — `name`, `user` (id on write).
- **`TeacherSerializer`**, **`StudentSerializer`** — directory CRUD shapes.
- **`WordSerializer`** — `word`, `example_sentence`.
- **`StudentLexiconRowSerializer`** — plain `Serializer` (not `ModelSerializer`) for computed lexicon rows: `word`, `example_sentence`, `added_at`.

## HomeworkBriefSerializer

Subset of homework fields for list views where nested words are not required—keeps payloads smaller.

## HomeworkSerializer (nested create)

**Fields:** id, title, level (write-only on read in some contexts), `class_field`, `class_name` (method), `cover_image_url`, `words` (nested), `reading`, `summary`, `questions`, `due_date`.

**Complexity:**

- **`validate_questions`** delegates to `normalize_homework_questions_payload` so each question gains consistent keys (`question` text, etc.).
- **`get_class_name`** reads `homework.class_field.name` for display.
- **`create()`** pops nested `words`, creates `Homework`, then **`get_or_create`s `StudentHomework`** for every student enrolled on that class so everyone receives a row automatically. Then it resolves word dicts into `Word` rows (get_or_create) and `homework.words.set(...)`.

This pattern bundles **template + roster expansion** in one transaction from the API consumer’s perspective.

## StudentHomeworkSerializer

Embeds full **`HomeworkSerializer`** as `homework` plus submission/mark fields. Used anywhere the client needs the template **and** the student’s progress in one JSON object (dashboard cards, marking screens).

## StudentDetailSerializer (student dashboard)

Extends `ModelSerializer` on `Student` with many **`SerializerMethodField`** entries:

- **`homework_assignments`** — open work: not submitted or not marked.
- **`overdue_assignments` / `new_assignments`** — split by due date vs today and submitted flag; each row is a `StudentHomeworkSerializer`.
- **`latest_marked_mark_value`** — **mean of up to five** most recently submitted **marked** rows (`order_by('-submission_date', '-id')[:5]`), rounded to three decimals. Feeds the student dashboard “Effort” stars.
- **`lexicon_word_count`**, **`completed_homework_count`** — aggregates via lexicon helpers and `StudentHomework` counts.
- **`words`** — ordered lexicon for sidebar/widgets.

## SchoolStudentDirectorySerializer

Light rows for grids: split name, enrolled class ids, **`recent_five_avg_mark`** (same averaging idea as the student dashboard), assignment totals/overdue/active counts.

## SchoolStudentDetailProfileSerializer

Heavy profile for **`GET /core/students/<id>/`** when the caller is the school:

- **`assignment_directory`** — loops all `StudentHomework` for the student, attaches homework/class metadata, computes **`is_overdue`** and **`in_academic_year`** using `academic_year_bounds()` (UK-style April–March window in code).

Teaching point: this method field is **O(n)** in assignments; acceptable for school-scale datasets, but pagination would be needed at very large n.

## SchoolDetailSerializer

Nested `classes`, `teachers`, `students` each with child serializers—used when the API returns a whole school graph in one response (some admin screens).

## TeacherDetailSerializer

Teacher-facing profile/dashboard aggregation (defined later in the file)—often includes class summaries for the teacher dashboard.

## Related reading

- `resources/url-endpoints.md` — which views use which serializers.
- `resources/models.md` — fields being serialized.
