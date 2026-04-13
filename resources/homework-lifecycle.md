# Homework lifecycle (end-to-end)

This page traces **one homework assignment** from template creation to lexicon impact—useful for seeing how backend pieces connect.

## 1. Template creation (school or teacher)

- **HTTP:** `POST /core/homework/create/` with nested `words`, `questions`, `class_field`, optional `cover_image_url`, `due_date`, etc.
- **Serializer:** `HomeworkSerializer.create` persists `Homework` and **`StudentHomework`** rows for **every student** enrolled on that class (`get_or_create` per student).
- **Result:** Each student has a row with `submitted=False`, `marked=False`, and `answers` pre-synced from question templates (`StudentHomework.save`).

## 2. Student works (draft)

- **Read:** `GET /core/student-homework/<pk>/` or dashboard/list endpoints expose nested homework + answers.
- **PATCH:** `PATCH /core/student-homework/update/` as **student** with `answers` (and optionally not yet `submitted: true`). Server merges with `merge_student_answer_rows` so indices match `homework.questions`.
- **Guard:** Once `submitted=True`, answers cannot be edited (returns **400**).

## 3. Submit

- Student PATCH sets **`submitted=True`** and **`submission_date`** (typically set server-side or client-side depending on payload).
- **`StudentHomework.save`** no longer re-syncs answers from the template (submitted branch).

## 4. Mark (teacher or school)

- Same **`student-homework/update`** endpoint as **teacher/school** with `marked`, `mark_value`, `teacher_comment`.
- When marking with a numeric mark, **`Student.effort_symbol`** is updated with a weighted formula (rolling blend)—see `student_views.py` and `demo_populate.apply_demo_mark` for parallel demo logic.

## 5. Lexicon

- Words on the homework are linked via **M2M** `homework.words`.
- Only after **`marked=True`** does the word contribute to **`lexicon_rows_for_student`** and counts (`lexicon.py`).
- Student UI: lexicon page and dashboard counts reflect this derived state.

## 6. Delete / archive (out of scope variants)

- School may delete homework via **`homework/delete/`**—cascade behaviour depends on FK `on_delete` on `StudentHomework` (CASCADE from homework)—**destructive**; production apps often “soft delete” or archive.

## Sequence diagram (simplified)

```text
School/Teacher          Student              Teacher/School
     │                     │                        │
     │ POST homework       │                        │
     ├────────────────────►│ SH rows created       │
     │                     │                        │
     │                     │ PATCH answers          │
     │                     ├──────►               │
     │                     │ PATCH submitted      │
     │                     ├──────►               │
     │                     │                        │
     │                     │                        │ PATCH marked + mark
     │                     │                        ├──────►
     │                     │  (effort_symbol,      │
     │                     │   lexicon eligible)  │
```

## Related reading

- `domain-lexicon-and-answers.md` — how answers and lexicon are computed.
- `views-student.md` — `StudentHomeworkUpdateView` branches.
- `serializers.md` — nested homework payloads.
