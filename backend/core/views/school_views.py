"""School-admin API: classes, student/teacher directory and detail, homework create/delete, global word list/delete."""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.access import teacher_can_access_class
from core.models import Class, Homework, Student, Teacher, User, Word
from core.serializers import (
    ClassSerializer,
    HomeworkSerializer,
    SchoolDetailSerializer,
    SchoolSerializer,
    SchoolStudentDetailProfileSerializer,
    SchoolStudentDirectorySerializer,
    SchoolTeacherDirectorySerializer,
    StudentSerializer,
    TeacherDetailSerializer,
    TeacherSerializer,
    UserSerializer,
    WordSerializer,
)


def _apply_user_email_and_password(user, data):
    """
    Optional email and/or password update for a User row (school admin).
    Returns a Response with an error, or None if successful / nothing to do.
    """
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
    return None


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
        class_id = data.get('class_field')

        if request.user.user_type == 'teacher':
            if not class_id:
                return Response({'error': 'class_field is required'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                class_obj = Class.objects.get(pk=class_id)
            except Class.DoesNotExist:
                return Response({'error': 'Class not found'}, status=status.HTTP_404_NOT_FOUND)
            if not teacher_can_access_class(request.user, class_obj):
                return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        elif request.user.user_type == 'school':
            if class_id:
                try:
                    class_obj = Class.objects.get(pk=class_id)
                except Class.DoesNotExist:
                    return Response({'error': 'Class not found'}, status=status.HTTP_404_NOT_FOUND)
                if class_obj.school_id != request.user.school_profile.id:
                    return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

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
        remove = data.get('remove') in (True, 'true', '1', 1)

        if not class_id:
            return Response({'error': 'Class ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        school = request.user.school_profile

        if remove:
            if teacher_id:
                return self.remove_teacher_from_class(school, class_id, teacher_id)
            if student_id:
                return self.remove_student_from_class(school, class_id, student_id)
            return Response(
                {'error': 'remove requires teacher_id or student_id'},
                status=status.HTTP_400_BAD_REQUEST,
            )

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

    def remove_teacher_from_class(self, school, class_id, teacher_id):
        try:
            teacher = school.teachers.get(id=teacher_id)
            class_obj = school.classes.get(id=class_id)
            class_obj.teachers.remove(teacher)
            return Response({'message': 'Teacher removed from class successfully'}, status=status.HTTP_200_OK)
        except Teacher.DoesNotExist:
            return Response({'error': 'Teacher not found'}, status=status.HTTP_404_NOT_FOUND)
        except Class.DoesNotExist:
            return Response({'error': 'Class not found'}, status=status.HTTP_404_NOT_FOUND)

    def remove_student_from_class(self, school, class_id, student_id):
        try:
            student = school.students.get(id=student_id)
            class_obj = school.classes.get(id=class_id)
            class_obj.students.remove(student)
            return Response({'message': 'Student removed from class successfully'}, status=status.HTTP_200_OK)
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
        except Class.DoesNotExist:
            return Response({'error': 'Class not found'}, status=status.HTTP_404_NOT_FOUND)

class DeleteClassView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        if request.user.user_type != 'school':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        data = request.data
        class_id = data.get('class_id')
        school = request.user.school_profile

        if not class_id:
            return Response({'error': 'Class ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            class_obj = school.classes.get(id=class_id)
        except Class.DoesNotExist:
            return Response({'error': 'Class not found'}, status=status.HTTP_404_NOT_FOUND)

        if class_obj.students.exists():
            return Response({'error': 'Cannot delete class with students'}, status=status.HTTP_400_BAD_REQUEST)
        if class_obj.teachers.exists():
            return Response({'error': 'Cannot delete class with teachers'}, status=status.HTTP_400_BAD_REQUEST)

        class_obj.delete()
        
        return Response({'message': 'Class deleted successfully'}, status=status.HTTP_200_OK)

class ListStudentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Ensure that only schools can list students
        if request.user.user_type != 'school':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        # Retrieve the school associated with the authenticated user
        school = request.user.school_profile
        
        # Get all Students related to the school
        students = Student.objects.filter(school=school).prefetch_related('classes_enrolled')

        serializer = SchoolStudentDirectorySerializer(students, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

class ListTeachersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Ensure that only schools can list teachers
        if request.user.user_type != 'school':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        # Retrieve the school associated with the authenticated user
        school = request.user.school_profile
        
        # Get all Teachers related to the school
        teachers = Teacher.objects.filter(school=school).prefetch_related('classes_teaching')

        serializer = SchoolTeacherDirectorySerializer(teachers, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)


class StudentDetailView(APIView):
    """School-scoped student directory: get / patch / delete one student."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if request.user.user_type != 'school':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        school = request.user.school_profile
        try:
            student = (
                school.students.select_related('user')
                .prefetch_related('classes_enrolled')
                .get(pk=pk)
            )
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(SchoolStudentDetailProfileSerializer(student).data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        if request.user.user_type != 'school':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        school = request.user.school_profile
        try:
            student = school.students.select_related('user').get(pk=pk)
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
        if 'name' in request.data:
            student.name = request.data['name']
            student.user.name = request.data['name']
            student.user.save(update_fields=['name'])
        if 'effort_symbol' in request.data:
            student.effort_symbol = request.data['effort_symbol']
        err = _apply_user_email_and_password(student.user, request.data)
        if err is not None:
            return err
        student.save()
        return Response(StudentSerializer(student).data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        if request.user.user_type != 'school':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        school = request.user.school_profile
        try:
            student = school.students.get(pk=pk)
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
        student.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TeacherDetailView(APIView):
    """School-scoped teacher directory: get / patch / delete one teacher."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if request.user.user_type != 'school':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        school = request.user.school_profile
        try:
            teacher = school.teachers.get(pk=pk)
        except Teacher.DoesNotExist:
            return Response({'error': 'Teacher not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(TeacherDetailSerializer(teacher).data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        if request.user.user_type != 'school':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        school = request.user.school_profile
        try:
            teacher = school.teachers.select_related('user').get(pk=pk)
        except Teacher.DoesNotExist:
            return Response({'error': 'Teacher not found'}, status=status.HTTP_404_NOT_FOUND)
        if 'name' in request.data:
            teacher.name = request.data['name']
            teacher.user.name = request.data['name']
            teacher.user.save(update_fields=['name'])
            teacher.save(update_fields=['name'])
        err = _apply_user_email_and_password(teacher.user, request.data)
        if err is not None:
            return err
        return Response(TeacherSerializer(teacher).data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        if request.user.user_type != 'school':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        school = request.user.school_profile
        try:
            teacher = school.teachers.get(pk=pk)
        except Teacher.DoesNotExist:
            return Response({'error': 'Teacher not found'}, status=status.HTTP_404_NOT_FOUND)
        teacher.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UpdateClassView(APIView):
    """School admin: patch name / description / level on a class."""

    permission_classes = [IsAuthenticated]

    def patch(self, request):
        if request.user.user_type != 'school':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        class_id = request.data.get('class_id')
        if not class_id:
            return Response({'error': 'class_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        school = request.user.school_profile
        try:
            class_obj = school.classes.get(pk=class_id)
        except Class.DoesNotExist:
            return Response({'error': 'Class not found'}, status=status.HTTP_404_NOT_FOUND)
        for field in ('name', 'description', 'level'):
            if field in request.data:
                setattr(class_obj, field, request.data[field])
        class_obj.save()
        return Response(ClassSerializer(class_obj).data, status=status.HTTP_200_OK)


class DeleteHomeworkView(APIView):
    """School admin: delete a homework row (must belong to this school)."""

    permission_classes = [IsAuthenticated]

    def delete(self, request):
        if request.user.user_type != 'school':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        homework_id = request.data.get('homework_id')
        if not homework_id:
            return Response({'error': 'homework_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        school = request.user.school_profile
        try:
            hw = Homework.objects.select_related('class_field').get(pk=homework_id)
        except Homework.DoesNotExist:
            return Response({'error': 'Homework not found'}, status=status.HTTP_404_NOT_FOUND)
        if hw.class_field.school_id != school.id:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        hw.delete()
        return Response({'message': 'Homework deleted successfully'}, status=status.HTTP_200_OK)


class ListWordsView(APIView):
    """Global word bank listing (school or teacher). Optional ?q= filter."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.user_type not in ('school', 'teacher'):
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        q = request.query_params.get('q', '').strip()
        words = Word.objects.all().order_by('word')
        if q:
            words = words.filter(word__icontains=q)
        return Response(WordSerializer(words, many=True).data, status=status.HTTP_200_OK)


class DeleteWordView(APIView):
    """School admin: delete a word from the global bank."""

    permission_classes = [IsAuthenticated]

    def delete(self, request):
        if request.user.user_type != 'school':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        word_id = request.data.get('word_id')
        if not word_id:
            return Response({'error': 'word_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            word = Word.objects.get(pk=word_id)
        except Word.DoesNotExist:
            return Response({'error': 'Word not found'}, status=status.HTTP_404_NOT_FOUND)
        word.delete()
        return Response({'message': 'Word deleted successfully'}, status=status.HTTP_200_OK)