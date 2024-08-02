from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from rest_framework.permissions import IsAuthenticated
from core.models import User, Class, Homework, Word, Teacher, Student, StudentHomework
from core.serializers import UserSerializer, SchoolSerializer, TeacherSerializer, StudentSerializer, ClassSerializer, HomeworkSerializer, WordSerializer, SchoolDetailSerializer, StudentHomeworkSerializer

class StudentDashboardView (APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        student = user.student_profile
        school = student.school
        homework = student.homework_assignments.filter(marked=False, submitted=False)
        words = Word.objects.filter(homework_related__in=homework)
        homework_serializer = StudentHomeworkSerializer(homework, many=True)
        word_serializer = WordSerializer(words, many=True)
        return Response({
            'homework': homework_serializer.data,
            'words': word_serializer.data,
        }, status=status.HTTP_200_OK)