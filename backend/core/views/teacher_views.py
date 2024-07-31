from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from rest_framework.permissions import IsAuthenticated
from .models import User, Class, Homework, Word
from .serializers import UserSerializer, SchoolSerializer, TeacherSerializer, StudentSerializer, ClassSerializer, HomeworkSerializer, WordSerializer
