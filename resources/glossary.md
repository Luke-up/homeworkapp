# Glossary

Short definitions of **domain terms** and **easy-to-confuse** names in this codebase.

| Term | Meaning |
|------|---------|
| **Homework** | A class-scoped **template**: reading, summary, due date, questions JSON, vocabulary words, optional cover URL. One row per assignment definition. |
| **StudentHomework** | One **student’s attempt** at a Homework template—submission flag, answers JSON, marks, comments. Primary key used in URLs like `/student/homework/[id]` when `id` is the student-homework id (verify in router). |
| **Class** | A cohort within a school; M2M to teachers and students; owns homework templates. |
| **School** | Organisation row linked OneToOne to a **school admin User**; owns classes, teachers, students. |
| **Lexicon** | **Derived** list of words the student encountered on **marked** homework—not a separate manually edited vocabulary table. |
| **Effort / mark_value** | Decimal **0–5** scale stored on `StudentHomework`; UI maps to **0–3 stars** in places (`markStars.js`). Dashboard “effort” may show an **average of recent marks** (see serializers). |
| **effort_symbol** | Rolling decimal on **`Student`** updated when new marks arrive—distinct from per-assignment `mark_value`. |
| **Timed demo** | A school with **`demo_expires_at`** set; isolated emails and auto-deletion; not the same as **`seed_demo`**. |
| **seed_demo** | Management command creating long-lived **`demo-*@example.com`** accounts. |
| **`/core/`** | URL prefix for all REST endpoints in this project. |
| **DemoAwareJWTAuthentication** | Custom DRF auth class: valid JWT **then** reject if demo school expired. |
| **`school_for_user`** | **Two functions** with the same name: in **`access.py`** (school admin only) vs **`demo_session.py`** (school for any role in tenant)—import path matters. |

## Related reading

- `architecture-overview.md` — big-picture map.
- `models.md` — field-level detail.
