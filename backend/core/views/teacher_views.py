from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from rest_framework.permissions import IsAuthenticated
from core.models import User, Class, Homework, Word, Teacher, Student, StudentHomework
from core.serializers import TeacherDetailSerializer

class TeacherDashboardView (APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        teacher = user.teacher_profile
        serializer = TeacherDetailSerializer(teacher)

        return Response(serializer.data, status=status.HTTP_200_OK)