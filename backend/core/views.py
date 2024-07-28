# core/views.py
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from rest_framework.permissions import IsAuthenticated
from .models import User, Class, Homework, Word
from .serializers import UserSerializer, SchoolSerializer, TeacherSerializer, StudentSerializer, ClassSerializer, HomeworkSerializer, WordSerializer


class RegisterUserView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            if user:
                token, created = Token.objects.get_or_create(user=user)
                return Response({'token': token.key}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]  # Allow any user to access this view

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        # Authenticate user
        user = authenticate(email=email, password=password)
        if user:
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_200_OK)
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    def post(self, request):
        request.auth.delete()  # Delete the token to log out
        return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)

class CreateSchoolView(APIView):
    def post(self, request):
        user_serializer = UserSerializer(data=request.data)
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

class CreateTeacherView(APIView):
    permission_classes = [IsAuthenticated]  # Ensure user is authenticated

    def post(self, request):
        # Ensure that only schools can create teachers
        if request.user.user_type != 'school':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        # Extract user and teacher data
        user_data = {
            'email': request.data.get('email'),
            'password': request.data.get('password'),
            'name': request.data.get('name'),
            'user_type': 'teacher'
        }
        school_id = request.user.school_profile.id

        # Validate required fields
        if not all(field in user_data for field in ['email', 'password', 'name']):
            return Response({'error': 'Email, password, and name are required'}, status=status.HTTP_400_BAD_REQUEST)

        # Create User
        user_serializer = UserSerializer(data=user_data)
        if user_serializer.is_valid():
            user = user_serializer.save()  # Create the User
        else:
            return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Create Teacher
        teacher_data = {
            'user': user.id,
            'name': request.data.get('name'),
            'school': school_id
        }
        teacher_serializer = TeacherSerializer(data=teacher_data)
        if teacher_serializer.is_valid():
            teacher_serializer.save()
            return Response({'message': 'Teacher created successfully'}, status=status.HTTP_201_CREATED)
        return Response(teacher_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CreateStudentView(APIView):
    permission_classes = [IsAuthenticated]  # Ensure user is authenticated

    def post(self, request):
        # Ensure that only schools can create students
        if request.user.user_type != 'school':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        # Extract user and student data
        user_data = {
            'email': request.data.get('email'),
            'password': request.data.get('password'),
            'name': request.data.get('name'),
            'user_type': 'student'
        }
        school_id = request.user.school_profile.id

        # Validate required fields
        if not all(field in user_data for field in ['email', 'password', 'name']):
            return Response({'error': 'Email, password, and name are required'}, status=status.HTTP_400_BAD_REQUEST)

        # Create User
        user_serializer = UserSerializer(data=user_data)
        if user_serializer.is_valid():
            user = user_serializer.save()  # Create the User
        else:
            return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Create Student
        student_data = {
            'user': user.id,
            'name': request.data.get('name'),
            'school': school_id
        }
        student_serializer = StudentSerializer(data=student_data)
        if student_serializer.is_valid():
            student_serializer.save()
            return Response({'message': 'Student created successfully'}, status=status.HTTP_201_CREATED)
        return Response(student_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CreateClassView(APIView):
    permission_classes = [IsAuthenticated]  # Ensure user is authenticated

    def post(self, request):
        # Ensure that only schools can create classes
        if request.user.user_type != 'school':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        data = request.data
        # Link the class to the school of the authenticated user
        data['school'] = request.user.school_profile.id

        # Validate required fields
        required_fields = ['name', 'level']
        if not all(field in data for field in required_fields):
            return Response({'error': 'Name and level are required'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = ClassSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Class created successfully'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ListClassesView(APIView):
    permission_classes = [IsAuthenticated]  # Ensure user is authenticated

    def get(self, request):
        # Ensure that only schools can list classes
        if request.user.user_type != 'school':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        # Retrieve the school associated with the authenticated user
        school = request.user.school_profile
        
        # Get all classes related to the school
        classes = Class.objects.filter(school=school)
        serializer = ClassSerializer(classes, many=True)
        
        return Response(serializer.data, status=status.HTTP_200_OK)

class CreateHomeworkView(APIView):
    permission_classes = [IsAuthenticated]  # Ensure user is authenticated

    def post(self, request):
        # Ensure that only schools and teachers can create homework
        if request.user.user_type not in ['school', 'teacher']:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data
        
        # Check if the user is a teacher and if so, ensure they are linked to a valid school
        if request.user.user_type == 'teacher':
            teacher_school_id = request.user.teacher_profile.school.id
            class_id = data.get('class_field')
            if class_id and not Class.objects.filter(id=class_id, school=teacher_school_id).exists():
                return Response({'error': 'Invalid class for this teacher\'s school'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = HomeworkSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Homework created and assigned to students successfully'}, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class StudentHomeworkView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        student = request.user.student_profile
        assignments = StudentHomework.objects.filter(student=student)
        serializer = StudentHomeworkSerializer(assignments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = StudentHomeworkSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Student homework assignment created successfully'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UpdateStudentHomeworkView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            student_homework = StudentHomework.objects.get(id=pk, student=request.user.student_profile)
        except StudentHomework.DoesNotExist:
            return Response({'error': 'Student homework assignment not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = StudentHomeworkSerializer(student_homework, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Student homework assignment updated successfully'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)