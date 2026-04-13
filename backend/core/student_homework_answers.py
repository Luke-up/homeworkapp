"""Helpers for homework questions and student answer rows stored as JSON."""

from __future__ import annotations

from typing import Any


def homework_question_prompt(q: Any) -> str:
    """Return display text for one homework question dict (supports ``q`` or ``question``)."""
    if not isinstance(q, dict):
        return ''
    return str(q.get('question') or q.get('q') or '').strip()


def normalize_homework_questions_payload(questions: Any) -> list:
    """
    Homework.questions: list of dicts. Each item gets both ``q`` and ``question`` set to the same text
    so APIs and templates can use either key.
    """
    if questions is None:
        return []
    if not isinstance(questions, list):
        return []
    out: list = []
    for item in questions:
        if not isinstance(item, dict):
            continue
        text = homework_question_prompt(item)
        row = dict(item)
        row['q'] = text
        row['question'] = text
        out.append(row)
    return out


def merge_student_answer_rows(questions: list, previous: Any) -> list[dict[str, str]]:
    """
    Build ``[{"question": "...", "answer": "..."}, ...]`` aligned with ``questions``.

    ``previous`` may be a legacy parallel list of strings, a list of dicts with ``answer`` (and optional
    ``question``), or missing entries — answers are preserved by index; question text always comes from
    the current homework template (until the row is submitted and sync is no longer applied).
    """
    if not isinstance(questions, list):
        questions = []
    prev_list = previous if isinstance(previous, list) else []
    rows: list[dict[str, str]] = []
    for i, q in enumerate(questions):
        prompt = homework_question_prompt(q)
        ans = ''
        if i < len(prev_list):
            cell = prev_list[i]
            if isinstance(cell, dict):
                raw = cell.get('answer')
                ans = '' if raw is None else str(raw)
            else:
                ans = str(cell) if cell is not None else ''
        rows.append({'question': prompt, 'answer': ans})
    return rows
