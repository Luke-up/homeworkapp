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
        fields = ['id','user', 'name', 'school']

    def create(self, validated_data):
        teacher = Teacher.objects.create(**validated_data)
        return teacher

class WordSerializer(serializers.ModelSerializer):
    class Meta:
        model = Word
        fields = ['word', 'example_sentence']

class HomeworkSerializer(serializers.ModelSerializer):
    words = WordSerializer(many=True)

    class Meta:
        model = Homework
        fields = ['title', 'level', 'class_field', 'words', 'reading', 'summary', 'questions', 'due_date']

    def create(self, validated_data):
        words_data = validated_data.pop('words', [])
        homework = Homework.objects.create(**validated_data)
        
        class_field = validated_data.get('class_field')
        if class_field:
            students = class_field.students.all()
            for student in students:
                StudentHomework.objects.create(homework=homework, student=student)
        
        word_instances = []
        for word_data in words_data:
            word, created = Word.objects.get_or_create(**word_data)
            word_instances.append(word)
        
        homework.words.set(word_instances)
        
        return homework

class StudentHomeworkSerializer(serializers.ModelSerializer):
    homework = HomeworkSerializer()
    class Meta:
        model = StudentHomework
        fields = ['homework', 'student', 'submitted', 'submission_date', 'answers', 'teacher_comment', 'mark_value', 'marked']

class StudentSerializer(serializers.ModelSerializer):

    class Meta:
        model = Student
        fields = ['id', 'user', 'school', 'name', 'effort_symbol']

    def create(self, validated_data):
            student = Student.objects.create(**validated_data)
            return student

class ClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = Class
        fields = ['id', 'name', 'school', 'description', 'level', 'teachers', 'students']

class SchoolDetailSerializer(serializers.ModelSerializer):
    classes = ClassSerializer(many=True, read_only=True)
    teachers = TeacherSerializer(many=True, read_only=True)
    students = StudentSerializer(many=True, read_only=True)

    class Meta:
        model = School
        fields = ['id', 'name', 'classes', 'teachers', 'students']

class StudentDetailSerializer(serializers.ModelSerializer):
    homework_assignments = serializers.SerializerMethodField()
    words = WordSerializer(many=True, read_only=True) 

    class Meta:
        model = Student
        fields = ['id', 'user', 'school', 'name', 'homework_assignments', 'effort_symbol', 'words']
    
    def get_homework_assignments(self, obj):
        student_homework_assignments = StudentHomework.objects.filter(student=obj, marked=False, submitted=False)
        return StudentHomeworkSerializer(student_homework_assignments, many=True).data