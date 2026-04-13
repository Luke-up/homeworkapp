# Domain logic: lexicon and homework answers

Two modules hold **non-trivial domain rules** without depending on HTTP: **`core/lexicon.py`** and **`core/student_homework_answers.py`**. Understanding them clarifies why there is no separate “student vocabulary” table for completed work.

## Lexicon (`lexicon.py`)

**Design choice:** A student’s **lexicon is derived**, not stored as a duplicate word list per student.

**Source of truth:** Only **`StudentHomework`** rows that are **`marked=True`**. For each, the code walks `homework.words` in assignment order (`StudentHomework.id` ascending for stability).

**Deduplication:** The first time a `Word` id appears across that walk, it is added with an “added at” timestamp taken from **`submission_date`** of that assignment (may be `None`—sort helpers use min/max sentinel datetimes).

**Ordering:**

- **`lexicon_rows_for_student(student, order)`** — `'new'` or `'old'`; returns dicts for the API (`word`, `example_sentence`, `added_at`).
- **`ordered_lexicon_words_for_student`** — same ordering, returns `Word` model instances (e.g. nested serializers).
- **`lexicon_word_count_for_student`** — `distinct()` count via the ORM through the homework ↔ student_homework graph.

**Why derive?** One homework edit or remark does not require syncing a shadow lexicon table; the lexicon **always** reflects “words from marked work.” Trade-off: historical re-marking could change perceived order if submission dates move—acceptable for this PoC.

## Homework answers (`student_homework_answers.py`)

**Problem:** `Homework.questions` and `StudentHomework.answers` are **JSON**. Templates evolve; clients may send partial data.

### `homework_question_prompt(q)`

Normalises one question dict to display text, accepting either **`q`** or **`question`** key (legacy vs normalised).

### `normalize_homework_questions_payload(questions)`

Used in **`HomeworkSerializer.validate_questions`**: ensures each item is a dict with **both** `q` and `question` set to the same string. Drops invalid list entries.

### `merge_student_answer_rows(questions, previous)`

Builds a list of **`{"question": "...", "answer": "..."}`** aligned **by index** with the current `questions` list.

- **`previous`** may be: a list of dicts with `answer`, legacy list of strings, or shorter than `questions` — missing indices become empty answers.
- **Question text** always comes from the **current template** (`homework_question_prompt`), not stale copies in `previous`, until the teacher/student workflow freezes answers on submit (see `StudentHomework.save` in models).

**Teaching point:** index alignment is simple and robust for ordered short-answer homework; if you add reorderable questions, you would switch to stable **question ids** in JSON.

## Model hook

`StudentHomework.save()` calls **`sync_answers_from_homework_questions`** when **not** submitted, re-merging template questions into `answers` so the row stays aligned when teachers edit the template.

## Related reading

- `models.md` — `StudentHomework`, `Homework` fields.
- `serializers.md` — `HomeworkSerializer`, `StudentHomeworkSerializer`.
- `views-student.md` — PATCH answer paths.
