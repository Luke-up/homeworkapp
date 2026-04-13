"""Derive a student's lexicon from marked homework only (no persisted per-student word bank)."""

from __future__ import annotations

from datetime import datetime, timezone as py_tz

from core.models import Student, StudentHomework, Word


def _marked_student_homework_for_lexicon(student: Student):
    return (
        StudentHomework.objects.filter(student=student, marked=True)
        .select_related('homework')
        .prefetch_related('homework__words')
        .order_by('id')
    )


def _lexicon_word_entries(student: Student) -> list[tuple[Word, object]]:
    """(Word, added_at) in first-seen order while walking marked assignments by ``StudentHomework.id``."""
    seen: set[int] = set()
    entries: list[tuple[Word, object]] = []
    for sh in _marked_student_homework_for_lexicon(student):
        dt = sh.submission_date
        for w in sh.homework.words.all():
            if w.id in seen:
                continue
            seen.add(w.id)
            entries.append((w, dt))
    return entries


def _sort_entries_by_added_at(entries: list[tuple[Word, object]], order: str) -> list[tuple[Word, object]]:
    if order == 'old':

        def key_old_first(e):
            dt = e[1]
            return dt if dt is not None else datetime.max.replace(tzinfo=py_tz.utc)

        return sorted(entries, key=key_old_first, reverse=False)

    def key_new_first(e):
        dt = e[1]
        return dt if dt is not None else datetime.min.replace(tzinfo=py_tz.utc)

    return sorted(entries, key=key_new_first, reverse=True)


def lexicon_rows_for_student(student: Student, order: str = 'new') -> list[dict]:
    o = order if order in ('new', 'old') else 'new'
    entries = _sort_entries_by_added_at(_lexicon_word_entries(student), o)
    return [
        {
            'word': w.word,
            'example_sentence': w.example_sentence,
            'added_at': dt,
        }
        for w, dt in entries
    ]


def ordered_lexicon_words_for_student(student: Student, order: str = 'new') -> list[Word]:
    o = order if order in ('new', 'old') else 'new'
    entries = _sort_entries_by_added_at(_lexicon_word_entries(student), o)
    return [w for w, _ in entries]


def lexicon_word_count_for_student(student: Student) -> int:
    return (
        Word.objects.filter(
            homework_related__student_details__student=student,
            homework_related__student_details__marked=True,
        )
        .distinct()
        .count()
    )
