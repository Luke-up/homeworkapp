from rest_framework.permissions import BasePermission


class IsSchoolUser(BasePermission):
    """School (organisation) account."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'user_type', None) == 'school'
        )


class IsTeacherUser(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'user_type', None) == 'teacher'
        )


class IsStudentUser(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'user_type', None) == 'student'
        )


class IsSchoolOrTeacher(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'user_type', None) in ('school', 'teacher')
        )


