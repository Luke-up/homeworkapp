"""Shared access checks for class / homework / student homework scope."""


def school_for_user(user):
    if getattr(user, 'user_type', None) == 'school':
        return user.school_profile
    return None


def teacher_can_access_class(user, class_obj):
    if user.user_type == 'school':
        return class_obj.school_id == user.school_profile.id
    if user.user_type == 'teacher':
        teacher = user.teacher_profile
        return (
            class_obj.school_id == teacher.school_id
            and class_obj.teachers.filter(pk=teacher.pk).exists()
        )
    return False


def user_can_access_student_homework(user, student_homework):
    if user.user_type == 'student':
        return student_homework.student_id == user.student_profile.id
    if user.user_type == 'school':
        return student_homework.student.school_id == user.school_profile.id
    if user.user_type == 'teacher':
        teacher = user.teacher_profile
        hw_class = student_homework.homework.class_field
        return (
            student_homework.student.school_id == teacher.school_id
            and hw_class.teachers.filter(pk=teacher.pk).exists()
        )
    return False
