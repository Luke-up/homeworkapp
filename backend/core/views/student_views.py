from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from rest_framework.permissions import IsAuthenticated
from core.models import User, Class, Homework, Word, Teacher, Student, StudentHomework
from core.serializers import StudentDetailSerializer
from decimal import Decimal

class StudentDashboardView (APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        student = user.student_profile
        serializer = StudentDetailSerializer(student)

        return Response(serializer.data, status=status.HTTP_200_OK)

class StudentHomeworkUpdateView (APIView):
    permission_classes = [IsAuthenticated]
    
    def patch(self, request):
        user = request.user
        student_homework_id = request.data.get('student_homework_id')
        
        try:
            student_homework = StudentHomework.objects.get(id=student_homework_id)
        except StudentHomework.DoesNotExist:
            return Response({'error': 'StudentHomework not found'}, status=status.HTTP_404_NOT_FOUND)
        
        student_fields = ['submitted', 'submission_date', 'answers']
        teacher_fields = ['teacher_comment', 'mark_value', 'marked']
        
        # Teachers and schools can update comment, mark, and marked status
        if 'teacher' in request.user.user_type or 'school' in request.user.user_type:
            for field in teacher_fields:
                if field in request.data:
                    setattr(student_homework, field, request.data[field])
            
            mark_value = request.data.get('mark_value')
            marked = request.data.get('marked')

            # Adding words to student's lexicon and updating effort symbol
            if marked and mark_value is not None:
                mark_value = Decimal(mark_value)
                student = student_homework.student
                student.words.add(*student_homework.homework.words.all())
                current_effort_symbol = Decimal(student.effort_symbol)
                new_effort_symbol = round((current_effort_symbol / Decimal('5') * Decimal('4')) + (mark_value / Decimal('5')), 2)
                student.effort_symbol = new_effort_symbol
                student.save()
        
        # Students can update submission status, submission date, and answers
        if 'student' in request.user.user_type:
            for field in student_fields:
                if field in request.data:
                    setattr(student_homework, field, request.data[field])
        
        student_homework.save()
        
        return Response({'message': 'Homework updated successfully'}, status=status.HTTP_200_OK)

# Unopperational view
class StudentLexiconView (APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        student = user.student_profile
        words = student.words.all()
        serializer = WordSerializer(words, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

class StudentHomeworkView (APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        student = user.student_profile
        student_homework = StudentHomework.objects.filter(student=student)
        serializer = StudentHomeworkSerializer(student_homework, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)