import secrets
import uuid
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import authenticate
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from core.demo_populate import demo_student_email, demo_teacher_email, populate_demo_school
from core.demo_session import raise_if_demo_expired
from core.models import School, User
from core.recaptcha import verify_recaptcha_v2
from core.serializers import SchoolSerializer, UserSerializer


class AuthStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        user_type = getattr(user, 'user_type', 'unknown') 

        return Response({
            'isAuthenticated': True,
            'userType': user_type,
        })

class LoginView(APIView):
    permission_classes = [AllowAny]  # Allow any user to access this view

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        # Authenticate user
        user = authenticate(email=email, password=password)
        if user:
            try:
                raise_if_demo_expired(user)
            except AuthenticationFailed as exc:
                return Response(
                    {'detail': exc.detail, 'code': getattr(exc, 'code', None) or 'demo_expired'},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user_type': getattr(user, 'user_type', None),
            }, status=status.HTTP_200_OK)
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    """JWT is stateless; clients discard tokens. This endpoint is a no-op success for symmetry."""

    permission_classes = [AllowAny]

    def post(self, request):
        return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)


class CreateSchoolView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if not verify_recaptcha_v2(request.data.get('recaptcha_token')):
            return Response(
                {'error': 'Captcha verification failed. Please try again.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        payload = request.data.copy()
        payload['user_type'] = 'school'
        user_serializer = UserSerializer(data=payload)
        if user_serializer.is_valid():
            user = user_serializer.save()  # Create the User
            school_data = {
                'user': user.id,
                'name': request.data.get('name')
            }
            school_serializer = SchoolSerializer(data=school_data)
            if school_serializer.is_valid():
                school_serializer.save()  # Create the School
                return Response({'message': 'School created successfully'}, status=status.HTTP_201_CREATED)
            return Response(school_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RefreshTokenView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh = request.data.get('refresh_token') or request.data.get('refresh')
        if not refresh:
            return Response({'error': 'Refresh token is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh)
            user_id = token.get('user_id')
            if user_id:
                try:
                    user = User.objects.get(pk=user_id)
                    raise_if_demo_expired(user)
                except User.DoesNotExist:
                    pass
            return Response({
                'access': str(token.access_token),
                'refresh': str(token),
            }, status=status.HTTP_200_OK)
        except AuthenticationFailed as exc:
            return Response(
                {'detail': exc.detail, 'code': getattr(exc, 'code', None) or 'demo_expired'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        except TokenError:
            return Response({'error': 'Invalid refresh token'}, status=status.HTTP_400_BAD_REQUEST)


class StartTimedDemoView(APIView):
    """Create an isolated school + full demo dataset; expires after DEMO_SESSION_MINUTES (default 20)."""

    permission_classes = [AllowAny]

    def post(self, request):
        if not verify_recaptcha_v2(request.data.get('recaptcha_token')):
            return Response(
                {'error': 'Captcha verification failed. Please try again.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        minutes = int(getattr(settings, 'DEMO_SESSION_MINUTES', 20))
        tag = uuid.uuid4().hex[:12]
        password = secrets.token_urlsafe(16)
        expires_at = timezone.now() + timedelta(minutes=minutes)
        label = tag[:6].upper()
        with transaction.atomic():
            school_user = User.objects.create_user(
                email=f'timedemo-{tag}-school@example.com',
                password=password,
                name=f'Live demo {label}',
                user_type='school',
            )
            school = School.objects.create(
                user=school_user,
                name=f'Live demo ({label})',
                demo_expires_at=expires_at,
            )
            populate_demo_school(school, password, email_tag=tag)
        return Response(
            {
                'expires_at': expires_at.isoformat(),
                'demo_session_minutes': minutes,
                'password': password,
                'accounts': {
                    'school': {'email': school_user.email},
                    'teacher': {'email': demo_teacher_email(tag, 1)},
                    'student': {'email': demo_student_email(tag, 1)},
                },
            },
            status=status.HTTP_201_CREATED,
        )
