from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from rest_framework.permissions import IsAuthenticated
from core.models import User, Class, Homework, Word, Teacher, Student
from core.serializers import UserSerializer, SchoolSerializer, TeacherSerializer, StudentSerializer, ClassSerializer, HomeworkSerializer, WordSerializer, SchoolDetailSerializer


class CreateTeacherView(APIView):
    permission_classes = [IsAuthenticated]

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
    permission_classes = [IsAuthenticated]

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
    permission_classes = [IsAuthenticated]

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
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Ensure that only schools can list classes
        if request.user.user_type != 'school':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        # Retrieve the school associated with the authenticated user
        school = request.user.school_profile
        
        # Get all classes related to the school
        classes = Class.objects.filter(school=school)
        teachers = Teacher.objects.filter(school=school)
        students = Student.objects.filter(school=school)

        serializer = SchoolDetailSerializer(school)
        
        return Response(serializer.data, status=status.HTTP_200_OK)

class CreateHomeworkView(APIView):
    permission_classes = [IsAuthenticated]

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

class AssignToClassView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        if request.user.user_type != 'school':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        data = request.data
        class_id = data.get('class_id')
        teacher_id = data.get('teacher_id')
        student_id = data.get('student_id')

        if not class_id:
            return Response({'error': 'Class ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        school = request.user.school_profile

        if teacher_id:
            return self.assign_teacher_to_class(school, class_id, teacher_id)
        
        if student_id:
            return self.assign_student_to_class(school, class_id, student_id)

        return Response({'error': 'Either teacher_id or student_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    def assign_teacher_to_class(self, school, class_id, teacher_id):
        try:
            teacher = school.teachers.get(id=teacher_id)
            class_obj = school.classes.get(id=class_id)
            class_obj.teachers.add(teacher)
            return Response({'message': 'Teacher assigned to class successfully'}, status=status.HTTP_200_OK)
        except Teacher.DoesNotExist:
            return Response({'error': 'Teacher not found'}, status=status.HTTP_404_NOT_FOUND)
        except Class.DoesNotExist:
            return Response({'error': 'Class not found'}, status=status.HTTP_404_NOT_FOUND)

    def assign_student_to_class(self, school, class_id, student_id):
        try:
            student = school.students.get(id=student_id)
            class_obj = school.classes.get(id=class_id)
            class_obj.students.add(student)
            return Response({'message': 'Student assigned to class successfully'}, status=status.HTTP_200_OK)
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
        except Class.DoesNotExist:
            return Response({'error': 'Class not found'}, status=status.HTTP_404_NOT_FOUND)
