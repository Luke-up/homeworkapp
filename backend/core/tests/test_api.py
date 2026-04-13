from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from core.models import Homework, School, Student, StudentHomework, User
from core.tests.helpers import create_class, create_school_user, create_student, create_teacher


class LoginAndAuthStatusTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="login@t.com",
            password="secret123",
            name="L",
            user_type="student",
        )
        _, school = create_school_user(email="sch@t.com")
        Student.objects.create(user=self.user, school=school, name="L")

    def test_login_returns_tokens(self):
        res = self.client.post(
            "/core/login/",
            {"email": "login@t.com", "password": "secret123"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)
        self.assertEqual(res.data.get("user_type"), "student")

    def test_login_rejects_bad_password(self):
        res = self.client.post(
            "/core/login/",
            {"email": "login@t.com", "password": "wrong"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_auth_status_requires_token(self):
        res = self.client.get("/core/auth-status/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_auth_status_with_bearer(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.get("/core/auth-status/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["isAuthenticated"])
        self.assertEqual(res.data["userType"], "student")


class SchoolStudentDetailTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.school_user, self.school = create_school_user()
        self.student_user, self.student = create_student(self.school, email="stu@t.com")
        _, other_school = create_school_user(email="other@t.com")
        self.other_student_user, self.other_student = create_student(
            other_school, email="stu2@t.com", name="Away"
        )

    def test_school_can_get_student_detail(self):
        self.client.force_authenticate(user=self.school_user)
        res = self.client.get(f"/core/students/{self.student.id}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["name"], self.student.name)

    def test_school_cannot_get_foreign_student(self):
        self.client.force_authenticate(user=self.school_user)
        res = self.client.get(f"/core/students/{self.other_student.id}/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_teacher_forbidden_student_detail(self):
        teacher_user, _teacher = create_teacher(self.school)
        self.client.force_authenticate(user=teacher_user)
        res = self.client.get(f"/core/students/{self.student.id}/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class HomeworkListTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.school_user, self.school = create_school_user()
        self.class_obj = create_class(self.school)
        self.teacher_user, self.teacher = create_teacher(self.school)
        self.class_obj.teachers.add(self.teacher)
        Homework.objects.create(title="HW", level=1, class_field=self.class_obj)

    def test_school_lists_homework_for_class(self):
        self.client.force_authenticate(user=self.school_user)
        res = self.client.get(
            "/core/homework/",
            {"class_id": self.class_obj.id},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["title"], "HW")

    def test_teacher_lists_homework_when_assigned_to_class(self):
        self.client.force_authenticate(user=self.teacher_user)
        res = self.client.get(
            "/core/homework/",
            {"class_id": self.class_obj.id},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

    def test_missing_class_id_400(self):
        self.client.force_authenticate(user=self.school_user)
        res = self.client.get("/core/homework/")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_teacher_gets_homework_template_detail(self):
        hw = Homework.objects.get(title="HW")
        self.client.force_authenticate(user=self.teacher_user)
        res = self.client.get(f"/core/homework/{hw.id}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["title"], "HW")
        self.assertNotIn("level", res.data)

    def test_homework_template_detail_forbidden_for_unassigned_teacher(self):
        hw = Homework.objects.get(title="HW")
        _, other_school = create_school_user(email="nosch@t.com")
        other_teacher_user, _ = create_teacher(other_school, email="ncls@t.com", name="N")
        self.client.force_authenticate(user=other_teacher_user)
        res = self.client.get(f"/core/homework/{hw.id}/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class CreateSchoolTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_create_school_sets_user_type(self):
        res = self.client.post(
            "/core/create-school/",
            {
                "email": "newschool@t.com",
                "password": "pw12345678",
                "name": "Springfield High",
                "user_type": "student",
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email="newschool@t.com")
        self.assertEqual(user.user_type, "school")


class StudentHomeworkPatchTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        _, school = create_school_user()
        self.student_a_user, self.student_a = create_student(school, email="a@t.com", name="A")
        self.student_b_user, self.student_b = create_student(school, email="b@t.com", name="B")
        class_obj = create_class(school)
        class_obj.students.add(self.student_a, self.student_b)
        self.hw = Homework.objects.create(
            title="X",
            level=1,
            class_field=class_obj,
            questions=[{"q": "One", "type": "short"}],
        )
        self.sh_a, _ = StudentHomework.objects.get_or_create(
            student=self.student_a, homework=self.hw
        )
        self.sh_a.save()

    def test_student_can_patch_own_submission(self):
        self.client.force_authenticate(user=self.student_a_user)
        res = self.client.patch(
            "/core/student-homework/update/",
            {"student_homework_id": self.sh_a.id, "submitted": True},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.sh_a.refresh_from_db()
        self.assertTrue(self.sh_a.submitted)

    def test_other_student_cannot_patch(self):
        self.client.force_authenticate(user=self.student_b_user)
        res = self.client.patch(
            "/core/student-homework/update/",
            {"student_homework_id": self.sh_a.id, "submitted": True},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_cannot_patch_answers_after_submit(self):
        self.client.force_authenticate(user=self.student_a_user)
        self.sh_a.submitted = True
        self.sh_a.save()
        res = self.client.patch(
            "/core/student-homework/update/",
            {"student_homework_id": self.sh_a.id, "answers": [{"question": "Q", "answer": "changed"}]},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class StudentHomeworkDetailTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        _, school = create_school_user()
        self.student_user, self.student = create_student(school, email="detail@t.com", name="D")
        class_obj = create_class(school)
        class_obj.students.add(self.student)
        self.hw = Homework.objects.create(
            title="Essay",
            level=1,
            class_field=class_obj,
            questions=[{"q": "Q1", "type": "short"}, {"q": "Q2", "type": "short"}],
        )
        self.sh, _ = StudentHomework.objects.get_or_create(student=self.student, homework=self.hw)
        self.sh.save()
        _, other_school = create_school_user(email="other-sch@t.com")
        self.other_user, _ = create_student(other_school, email="otherd@t.com", name="Ox")

    def test_student_can_get_own_homework_detail(self):
        self.client.force_authenticate(user=self.student_user)
        res = self.client.get(f"/core/student-homework/{self.sh.id}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["homework"]["title"], "Essay")
        self.assertEqual(len(res.data["answers"]), 2)
        self.assertIn('question', res.data['answers'][0])
        self.assertIn('answer', res.data['answers'][0])

    def test_foreign_student_forbidden_homework_detail(self):
        self.client.force_authenticate(user=self.other_user)
        res = self.client.get(f"/core/student-homework/{self.sh.id}/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class TeacherClassStudentsWorkTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.school_user, school = create_school_user()
        self.teacher_user, self.teacher = create_teacher(school, email="tcls@t.com", name="TC")
        self.student_user, self.student = create_student(school, email="stcls@t.com", name="Stu")
        self.class_obj = create_class(school)
        self.class_obj.teachers.add(self.teacher)
        self.class_obj.students.add(self.student)
        self.hw = Homework.objects.create(
            title="Class HW",
            level=1,
            class_field=self.class_obj,
            questions=[{"q": "Q", "type": "short"}],
        )
        self.sh, _ = StudentHomework.objects.get_or_create(student=self.student, homework=self.hw)
        self.sh.save()

    def test_teacher_gets_students_work(self):
        self.client.force_authenticate(user=self.teacher_user)
        res = self.client.get(f"/core/teacher-class/{self.class_obj.id}/students-work/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["class_id"], self.class_obj.id)
        self.assertEqual(len(res.data["students"]), 1)
        row = res.data["students"][0]
        self.assertEqual(row["name"], "Stu")
        self.assertEqual(row["pending_count"], 1)
        self.assertEqual(row["unmarked_count"], 0)

    def test_school_gets_students_work_for_own_class(self):
        self.client.force_authenticate(user=self.school_user)
        res = self.client.get(f"/core/teacher-class/{self.class_obj.id}/students-work/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["class_id"], self.class_obj.id)


class TeacherMarkHomeworkDetailTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        _, school = create_school_user()
        self.teacher_user, self.teacher = create_teacher(school, email="tmark@t.com", name="T")
        self.student_user, self.student = create_student(school, email="smark@t.com", name="S")
        class_obj = create_class(school)
        class_obj.teachers.add(self.teacher)
        class_obj.students.add(self.student)
        self.hw = Homework.objects.create(
            title="Mark me",
            level=1,
            class_field=class_obj,
            questions=[{"q": "Q1", "type": "short"}],
        )
        self.sh, _ = StudentHomework.objects.get_or_create(student=self.student, homework=self.hw)
        self.sh.submitted = True
        self.sh.save()
        _, other_school = create_school_user(email="osch2@t.com")
        self.other_teacher_user, self.other_teacher = create_teacher(other_school, email="ot@t.com", name="OT")

    def test_teacher_assigned_to_class_can_get_detail(self):
        self.client.force_authenticate(user=self.teacher_user)
        res = self.client.get(f"/core/teacher-homework/{self.sh.id}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["homework"]["title"], "Mark me")

    def test_other_teacher_forbidden(self):
        self.client.force_authenticate(user=self.other_teacher_user)
        res = self.client.get(f"/core/teacher-homework/{self.sh.id}/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class SchoolClassAssignRemoveTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.school_user, self.school = create_school_user()
        self.class_obj = create_class(self.school)
        _tu, self.teacher = create_teacher(self.school)
        _su, self.student = create_student(self.school, email="scstu@t.com", name="Pat")
        self.class_obj.teachers.add(self.teacher)
        self.class_obj.students.add(self.student)

    def test_remove_teacher_from_class(self):
        self.client.force_authenticate(user=self.school_user)
        res = self.client.patch(
            "/core/classes/update/",
            {"class_id": self.class_obj.id, "teacher_id": self.teacher.id, "remove": True},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.class_obj.refresh_from_db()
        self.assertEqual(self.class_obj.teachers.count(), 0)

    def test_remove_student_from_class(self):
        self.client.force_authenticate(user=self.school_user)
        res = self.client.patch(
            "/core/classes/update/",
            {"class_id": self.class_obj.id, "student_id": self.student.id, "remove": True},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.class_obj.refresh_from_db()
        self.assertEqual(self.class_obj.students.count(), 0)


class RefreshTokenTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="r@t.com",
            password="p",
            name="R",
            user_type="school",
        )
        School.objects.create(user=self.user, name="S")

    def test_refresh_accepts_refresh_token_key(self):
        from rest_framework_simplejwt.tokens import RefreshToken

        refresh = RefreshToken.for_user(self.user)
        res = self.client.post(
            "/core/refresh/",
            {"refresh_token": str(refresh)},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)
