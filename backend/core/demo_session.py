"""Timed demo schools: expiry checks, purge, and helpers for JWT + refresh."""

from __future__ import annotations

from django.utils import timezone
from rest_framework.exceptions import AuthenticationFailed

from core.models import School, User


def school_for_user(user: User) -> School | None:
    if getattr(user, "user_type", None) == "school":
        return getattr(user, "school_profile", None)
    if getattr(user, "user_type", None) == "teacher":
        prof = getattr(user, "teacher_profile", None)
        return prof.school if prof else None
    if getattr(user, "user_type", None) == "student":
        prof = getattr(user, "student_profile", None)
        return prof.school if prof else None
    return None


def delete_timed_demo_school(school: School) -> None:
    """Remove a timed demo school and all associated users (Word bank rows may remain)."""
    if school.demo_expires_at is None:
        return
    user_ids = {school.user_id}
    user_ids.update(school.teachers.values_list("user_id", flat=True))
    user_ids.update(school.students.values_list("user_id", flat=True))
    school.delete()
    User.objects.filter(pk__in=user_ids).delete()


def purge_expired_timed_demo_schools() -> int:
    """Delete all timed demo schools past expiry. Returns count removed."""
    now = timezone.now()
    qs = School.objects.filter(demo_expires_at__isnull=False, demo_expires_at__lt=now)
    schools = list(qs)
    for sch in schools:
        delete_timed_demo_school(sch)
    return len(schools)


def raise_if_demo_expired(user: User) -> None:
    """
    If the user belongs to a timed demo school that is past expiry, purge it and reject auth.
    Call from JWT authentication and token refresh.
    """
    school = school_for_user(user)
    if school is None or school.demo_expires_at is None:
        return
    if timezone.now() <= school.demo_expires_at:
        return
    delete_timed_demo_school(school)
    raise AuthenticationFailed(
        detail="Demo session expired.",
        code="demo_expired",
    )
