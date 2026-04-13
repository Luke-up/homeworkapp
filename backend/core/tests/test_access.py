from django.test import TestCase

from core.access import teacher_can_access_class, user_can_access_student_homework
from core.models import Homework, StudentHomework
from core.tests.helpers import create_class, create_school_user, create_student, create_teacher


class TeacherCanAccessClassTests(TestCase):
    def test_school_user_can_access_own_class(self):
        school_user, school = create_school_user()
        class_obj = create_class(school)
        self.assertTrue(teacher_can_access_class(school_user, class_obj))

    def test_school_user_cannot_access_other_school_class(self):
        user_a, school_a = create_school_user(email="a@t.com")
        _, school_b = create_school_user(email="b@t.com")
        class_b = create_class(school_b)
        self.assertFalse(teacher_can_access_class(user_a, class_b))

    def test_teacher_assigned_to_class_can_access(self):
        _, school = create_school_user()
        teacher_user, teacher = create_teacher(school)
        class_obj = create_class(school)
        class_obj.teachers.add(teacher)
        self.assertTrue(teacher_can_access_class(teacher_user, class_obj))

    def test_teacher_not_assigned_cannot_access(self):
        _, school = create_school_user()
        teacher_user, teacher = create_teacher(school)
        class_obj = create_class(school)
        self.assertFalse(teacher_can_access_class(teacher_user, class_obj))


class UserCanAccessStudentHomeworkTests(TestCase):
    def setUp(self):
        self.school_user, self.school = create_school_user()
        self.teacher_user, self.teacher = create_teacher(self.school)
        self.student_user, self.student = create_student(self.school)
        self.other_student_user, self.other_student = create_student(
            self.school, email="other@t.com", name="Other"
        )
        self.class_obj = create_class(self.school)
        self.class_obj.teachers.add(self.teacher)
        self.class_obj.students.add(self.student)
        self.hw = Homework.objects.create(
            title="H",
            level=1,
            class_field=self.class_obj,
        )
        self.sh, _ = StudentHomework.objects.get_or_create(
            student=self.student,
            homework=self.hw,
        )

    def test_student_can_access_own(self):
        self.assertTrue(user_can_access_student_homework(self.student_user, self.sh))

    def test_student_cannot_access_others(self):
        self.assertFalse(user_can_access_student_homework(self.other_student_user, self.sh))

    def test_school_user_same_school(self):
        self.assertTrue(user_can_access_student_homework(self.school_user, self.sh))

    def test_teacher_teaching_class_can_access(self):
        self.assertTrue(user_can_access_student_homework(self.teacher_user, self.sh))

    def test_teacher_not_teaching_class_cannot_access(self):
        t2_user, _teacher2 = create_teacher(self.school, email="t2@t.com", name="T2")
        self.assertFalse(user_can_access_student_homework(t2_user, self.sh))
