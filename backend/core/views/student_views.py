"""Student API: self profile, dashboard payload, homework list and patches, personal lexicon."""

from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.access import user_can_access_student_homework
from core.lexicon import lexicon_rows_for_student
from core.models import StudentHomework
from core.student_homework_answers import merge_student_answer_rows
from core.serializers import (
    StudentDetailSerializer,
    StudentHomeworkSerializer,
    StudentLexiconRowSerializer,
)

User = get_user_model()


class StudentSelfProfileView(APIView):
    """Current student: GET profile payload; PATCH avatar URL, email, password (name is school-managed)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.user_type != 'student':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        student = request.user.student_profile
        return Response(StudentDetailSerializer(student).data, status=status.HTTP_200_OK)

    def patch(self, request):
        if request.user.user_type != 'student':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        user = request.user
        student = user.student_profile
        data = request.data

        if 'avatar_url' in data:
            student.avatar_url = (data.get('avatar_url') or '').strip()[:500]
            student.save(update_fields=['avatar_url'])

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
                return Response({'error': 'Password must be at least 8 characters'}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(password)
            user.save()

        return Response(StudentDetailSerializer(student).data, status=status.HTTP_200_OK)


class StudentDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.user_type != 'student':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        student = request.user.student_profile
        serializer = StudentDetailSerializer(student)

        return Response(serializer.data, status=status.HTTP_200_OK)


class StudentHomeworkUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        student_homework_id = request.data.get('student_homework_id')
        if not student_homework_id:
            return Response({'error': 'student_homework_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student_homework = StudentHomework.objects.select_related(
                'student', 'student__school', 'homework', 'homework__class_field'
            ).get(id=student_homework_id)
        except StudentHomework.DoesNotExist:
            return Response({'error': 'StudentHomework not found'}, status=status.HTTP_404_NOT_FOUND)

        if not user_can_access_student_homework(request.user, student_homework):
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        student_fields = ['submitted', 'submission_date', 'answers']
        teacher_fields = ['teacher_comment', 'mark_value', 'marked']
        ut = request.user.user_type

        if ut in ('teacher', 'school'):
            for field in teacher_fields:
                if field in request.data:
                    setattr(student_homework, field, request.data[field])

            mark_value = request.data.get('mark_value')
            marked = request.data.get('marked')

            if marked and mark_value is not None:
                mark_value = Decimal(str(mark_value))
                student = student_homework.student
                current_effort_symbol = Decimal(student.effort_symbol)
                new_effort_symbol = round(
                    (current_effort_symbol / Decimal('5') * Decimal('4')) + (mark_value / Decimal('5')),
                    2,
                )
                student.effort_symbol = new_effort_symbol
                student.save()

        if ut == 'student':
            if 'answers' in request.data and student_homework.submitted:
                return Response(
                    {'error': 'Answers cannot be edited after submission'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            for field in student_fields:
                if field not in request.data:
                    continue
                if field == 'answers':
                    qs = student_homework.homework.questions
                    merged = merge_student_answer_rows(
                        qs if isinstance(qs, list) else [],
                        request.data['answers'],
                    )
                    setattr(student_homework, 'answers', merged)
                else:
                    setattr(student_homework, field, request.data[field])

        student_homework.save()

        return Response({'message': 'Homework updated successfully'}, status=status.HTTP_200_OK)


class StudentLexiconView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.user_type != 'student':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        student = request.user.student_profile
        order = (request.query_params.get('order') or 'new').lower()
        if order not in ('new', 'old'):
            order = 'new'
        rows = lexicon_rows_for_student(student, order)
        return Response(StudentLexiconRowSerializer(rows, many=True).data, status=status.HTTP_200_OK)


class StudentHomeworkDetailView(APIView):
    """Single student homework row for the signed-in student (work + answers)."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if request.user.user_type != 'student':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        try:
            student_homework = StudentHomework.objects.select_related(
                'student', 'homework', 'homework__class_field'
            ).prefetch_related('homework__words').get(pk=pk)
        except StudentHomework.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        if not user_can_access_student_homework(request.user, student_homework):
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        return Response(StudentHomeworkSerializer(student_homework).data, status=status.HTTP_200_OK)


class StudentHomeworkView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.user_type != 'student':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        student = request.user.student_profile
        student_homework = (
            StudentHomework.objects.filter(student=student, marked=True)
            .select_related('homework', 'homework__class_field')
            .prefetch_related('homework__words')
        )
        serializer = StudentHomeworkSerializer(student_homework, many=True)
        enrolled_classes = [
            {'id': c.id, 'name': c.name}
            for c in student.classes_enrolled.all().order_by('name')
        ]
        return Response(
            {'enrolled_classes': enrolled_classes, 'completed': serializer.data},
            status=status.HTTP_200_OK,
        )
