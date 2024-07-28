# core/serializers.py
from rest_framework import serializers
from .models import User, School, Teacher, Student, Class, Homework, Word, StudentHomework

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'name', 'user_type']

    def create(self, validated_data):
        email = validated_data.get('email')
        password = validated_data.get('password')
        user_type = validated_data.get('user_type')
        user = User.objects.create_user(email=email, password=password, user_type=user_type)
        if password:
            user.set_password(password)
            user.save()
        return user

class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = ['name', 'user']

    def create(self, validated_data):
        return School.objects.create(**validated_data)

class TeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teacher
        fields = ['user', 'name', 'school']

    def create(self, validated_data):
        teacher = Teacher.objects.create(**validated_data)
        return teacher

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['user', 'school', 'name']

    def create(self, validated_data):
        student = Student.objects.create(**validated_data)
        return student

class ClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = Class
        fields = ['id', 'name', 'school', 'description', 'level']

class WordSerializer(serializers.ModelSerializer):
    class Meta:
        model = Word
        fields = ['word', 'example_sentence']

class StudentHomeworkSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentHomework
        fields = ['homework', 'student', 'completed', 'submission_date', 'answers']

class HomeworkSerializer(serializers.ModelSerializer):
    words = WordSerializer(many=True)  # Nested WordSerializer for creating words

    class Meta:
        model = Homework
        fields = ['title', 'level', 'class_field', 'words', 'reading', 'summary', 'questions']

    def create(self, validated_data):
        words_data = validated_data.pop('words', [])
        homework = Homework.objects.create(**validated_data)
        
        # Create StudentHomework instances for each student in the class
        class_id = validated_data.get('class_field')
        students = Student.objects.filter(school__classes__id=class_id)
        for student in students:
            StudentHomework.objects.create(homework=homework, student=student)
        
        # Create Word instances
        for word_data in words_data:
            Word.objects.create(homework=homework, **word_data)
        
        return homework
