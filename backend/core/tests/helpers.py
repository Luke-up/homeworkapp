from core.models import Class, School, Student, Teacher, User


def create_school_user(email="school@test.com", password="pass12345", name="Test School"):
    user = User.objects.create_user(
        email=email,
        password=password,
        name=name,
        user_type="school",
    )
    school = School.objects.create(user=user, name=name)
    return user, school


def create_teacher(school, email="teacher@test.com", password="pass12345", name="Test Teacher"):
    user = User.objects.create_user(
        email=email,
        password=password,
        name=name,
        user_type="teacher",
    )
    teacher = Teacher.objects.create(user=user, school=school, name=name)
    return user, teacher


def create_student(school, email="student@test.com", password="pass12345", name="Test Student"):
    user = User.objects.create_user(
        email=email,
        password=password,
        name=name,
        user_type="student",
    )
    student = Student.objects.create(user=user, school=school, name=name)
    return user, student


def create_class(school, name="Class A", level=1):
    return Class.objects.create(school=school, name=name, description="", level=level)
