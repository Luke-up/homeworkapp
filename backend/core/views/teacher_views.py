"""Teacher API: self profile, dashboard, class homework list, class roster (shared access rules with school)."""

from django.contrib.auth import get_user_model

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.access import teacher_can_access_class, user_can_access_student_homework
from core.models import Class, Homework, Student, StudentHomework
from core.serializers import (
    HomeworkBriefSerializer,
    HomeworkSerializer,
    StudentHomeworkSerializer,
    StudentSerializer,
    TeacherDetailSerializer,
)

User = get_user_model()


class TeacherSelfProfileView(APIView):
    """Teacher: GET dashboard-shaped profile; PATCH avatar, name, email, password."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.user_type != 'teacher':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        teacher = request.user.teacher_profile
        return Response(TeacherDetailSerializer(teacher).data, status=status.HTTP_200_OK)

    def patch(self, request):
        if request.user.user_type != 'teacher':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        user = request.user
        teacher = user.teacher_profile
        data = request.data

        if 'avatar_url' in data:
            teacher.avatar_url = (data.get('avatar_url') or '').strip()[:500]
            teacher.save(update_fields=['avatar_url'])

        if 'name' in data and data.get('name'):
            name = str(data.get('name')).strip()[:255]
            if name:
                teacher.name = name
                teacher.save(update_fields=['name'])
                user.name = name
                user.save(update_fields=['name'])

        if 'email' in data:
            new_email = (data.get('email') or '').strip().lower()
            if not new_email:
                return Response({'error': 'email cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)
            if User.objects.filter(email__iexact=new_email).exclude(pk=user.pk).exists():
                return Response({'error': 'That email is already in use'}, status=status.HTTP_400_BAD_REQUEST)
            user.email = new_email
            user.save(update_fields=['email'])

        password = data.get('password')
        password_confirm = data.get('password_confirm')
        if password or password_confirm:
            if not password or not password_confirm:
                return Response(
                    {'error': 'Both password and password_confirm are required to change password'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if password != password_confirm:
                return Response({'error': 'Passwords do not match'}, status=status.HTTP_400_BAD_REQUEST)
            if len(password) < 8:
                return Response(
                    {'error': 'Password must be at least 8 characters'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user.set_password(password)
            user.save()

        return Response(TeacherDetailSerializer(teacher).data, status=status.HTTP_200_OK)


class TeacherMarkHomeworkDetailView(APIView):
    """Single StudentHomework row for marking (assigned teacher or same-school admin)."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            student_homework = StudentHomework.objects.select_related(
                'student', 'homework', 'homework__class_field'
            ).prefetch_related('homework__words').get(pk=pk)
        except StudentHomework.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        if not user_can_access_student_homework(request.user, student_homework):
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        return Response(StudentHomeworkSerializer(student_homework).data, status=status.HTTP_200_OK)


class TeacherDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.user_type != 'teacher':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        teacher = request.user.teacher_profile
        serializer = TeacherDetailSerializer(teacher)

        return Response(serializer.data, status=status.HTTP_200_OK)


def _serialize_sh_work_item(sh: StudentHomework) -> dict:
    hw = sh.homework
    due = hw.due_date
    return {
        'student_homework_id': sh.id,
        'homework_title': hw.title,
        'due_date': due.isoformat() if due is not None else None,
    }


class TeacherClassStudentsWorkView(APIView):
    """Per-student homework rows for one class (pending vs submitted-unmarked) for teacher or school admin UI."""

    permission_classes = [IsAuthenticated]

    def get(self, request, class_id):
        if request.user.user_type not in ('teacher', 'school'):
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        try:
            class_obj = Class.objects.get(pk=class_id)
        except Class.DoesNotExist:
            return Response({'error': 'Class not found'}, status=status.HTTP_404_NOT_FOUND)
        if not teacher_can_access_class(request.user, class_obj):
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        students = class_obj.students.all().order_by('name')
        out_students = []
        for student in students:
            base = StudentHomework.objects.filter(
                student=student,
                homework__class_field=class_obj,
            ).select_related('homework')
            pending_qs = base.filter(submitted=False).order_by('homework__due_date', 'homework_id', 'id')
            unmarked_qs = base.filter(submitted=True, marked=False).order_by('-submission_date', '-id')
            out_students.append(
                {
                    'id': student.id,
                    'name': student.name,
                    'pending_count': pending_qs.count(),
                    'unmarked_count': unmarked_qs.count(),
                    'unmarked': [_serialize_sh_work_item(sh) for sh in unmarked_qs],
                    'pending': [_serialize_sh_work_item(sh) for sh in pending_qs],
                }
            )

        return Response(
            {
                'class_id': class_obj.id,
                'class_name': class_obj.name,
                'level': class_obj.level,
                'students': out_students,
            },
            status=status.HTTP_200_OK,
        )


class HomeworkTemplateDetailView(APIView):
    """Homework template (no student submission) for teachers and school admins who may access the class."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            hw = Homework.objects.select_related('class_field', 'class_field__school').prefetch_related('words').get(
                pk=pk
            )
        except Homework.DoesNotExist:
            return Response({'error': 'Homework not found'}, status=status.HTTP_404_NOT_FOUND)

        ut = request.user.user_type
        if ut == 'teacher':
            if not teacher_can_access_class(request.user, hw.class_field):
                return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        elif ut == 'school':
            if hw.class_field.school_id != request.user.school_profile.id:
                return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        else:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        return Response(HomeworkSerializer(hw).data, status=status.HTTP_200_OK)


class ListHomeworkForClassView(APIView):
    """Homework rows for a class (school admin for that school, or assigned teacher)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        class_id = request.query_params.get('class_id')
        if not class_id:
            return Response({'error': 'class_id query parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            class_obj = Class.objects.get(pk=class_id)
        except Class.DoesNotExist:
            return Response({'error': 'Class not found'}, status=status.HTTP_404_NOT_FOUND)
        if not teacher_can_access_class(request.user, class_obj):
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        homework_qs = Homework.objects.filter(class_field=class_obj).order_by('-id')
        return Response(HomeworkBriefSerializer(homework_qs, many=True).data, status=status.HTTP_200_OK)


class ClassRosterView(APIView):
    """Students enrolled in a class (same access rule as homework list)."""

    permission_classes = [IsAuthenticated]

    def get(self, request, class_id):
        try:
            class_obj = Class.objects.get(pk=class_id)
        except Class.DoesNotExist:
            return Response({'error': 'Class not found'}, status=status.HTTP_404_NOT_FOUND)
        if not teacher_can_access_class(request.user, class_obj):
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        students = class_obj.students.all()
        return Response(StudentSerializer(students, many=True).data, status=status.HTTP_200_OK)
