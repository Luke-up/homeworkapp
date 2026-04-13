from datetime import date

from django.db.models import Q
from django.utils import timezone
from rest_framework import serializers

from core.student_homework_answers import normalize_homework_questions_payload
from core.lexicon import lexicon_word_count_for_student, ordered_lexicon_words_for_student
from core.models import (
    Class,
    Homework,
    School,
    Student,
    StudentHomework,
    Teacher,
    User,
    Word,
)

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'name', 'user_type']

    def create(self, validated_data):
        email = validated_data.get('email')
        password = validated_data.get('password')
        user_type = validated_data.get('user_type')
        name = validated_data.get('name') or ''
        return User.objects.create_user(
            email=email,
            password=password,
            user_type=user_type,
            name=name,
        )

class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = ['name', 'user']

    def create(self, validated_data):
        return School.objects.create(**validated_data)

class TeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teacher
        fields = ['id', 'user', 'name', 'school', 'avatar_url']

    def create(self, validated_data):
        teacher = Teacher.objects.create(**validated_data)
        return teacher

class WordSerializer(serializers.ModelSerializer):
    class Meta:
        model = Word
        fields = ['word', 'example_sentence']


class StudentLexiconRowSerializer(serializers.Serializer):
    word = serializers.CharField()
    example_sentence = serializers.CharField()
    added_at = serializers.DateTimeField(allow_null=True)

class HomeworkBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Homework
        fields = [
            'id',
            'title',
            'class_field',
            'cover_image_url',
            'reading',
            'summary',
            'questions',
            'due_date',
        ]


class HomeworkSerializer(serializers.ModelSerializer):
    words = WordSerializer(many=True)
    class_name = serializers.SerializerMethodField()

    def validate_questions(self, value):
        return normalize_homework_questions_payload(value)

    class Meta:
        model = Homework
        fields = [
            'id',
            'title',
            'level',
            'class_field',
            'class_name',
            'cover_image_url',
            'words',
            'reading',
            'summary',
            'questions',
            'due_date',
        ]
        extra_kwargs = {'level': {'write_only': True}}

    def get_class_name(self, obj):
        cf = getattr(obj, 'class_field', None)
        return cf.name if cf else ''

    def create(self, validated_data):
        words_data = validated_data.pop('words', [])
        homework = Homework.objects.create(**validated_data)

        class_field = homework.class_field
        if class_field:
            for student in class_field.students.all():
                sh, _ = StudentHomework.objects.get_or_create(homework=homework, student=student)
                sh.save()
        
        word_instances = []
        for word_data in words_data:
            word, created = Word.objects.get_or_create(**word_data)
            word_instances.append(word)
        
        homework.words.set(word_instances)
        
        return homework

class StudentHomeworkSerializer(serializers.ModelSerializer):
    homework = HomeworkSerializer()
    student_name = serializers.SerializerMethodField()

    class Meta:
        model = StudentHomework
        fields = [
            'id',
            'homework',
            'student',
            'student_name',
            'submitted',
            'submission_date',
            'answers',
            'teacher_comment',
            'mark_value',
            'marked',
        ]

    def get_student_name(self, obj):
        st = getattr(obj, 'student', None)
        return st.name if st else ''

class StudentSerializer(serializers.ModelSerializer):

    class Meta:
        model = Student
        fields = ['id', 'user', 'school', 'name', 'avatar_url', 'effort_symbol']

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
    email = serializers.SerializerMethodField()
    homework_assignments = serializers.SerializerMethodField()
    words = serializers.SerializerMethodField()
    overdue_assignments = serializers.SerializerMethodField()
    new_assignments = serializers.SerializerMethodField()
    latest_marked_mark_value = serializers.SerializerMethodField()
    lexicon_word_count = serializers.SerializerMethodField()
    completed_homework_count = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            'id',
            'user',
            'school',
            'name',
            'email',
            'avatar_url',
            'homework_assignments',
            'effort_symbol',
            'words',
            'overdue_assignments',
            'new_assignments',
            'latest_marked_mark_value',
            'lexicon_word_count',
            'completed_homework_count',
        ]

    def get_email(self, obj):
        return obj.user.email

    def get_words(self, obj):
        words = ordered_lexicon_words_for_student(obj, 'new')
        return WordSerializer(words, many=True).data

    def get_homework_assignments(self, obj):
        student_homework_assignments = StudentHomework.objects.filter(
            Q(student=obj) & (Q(marked=False) | Q(submitted=False))
        )
        return StudentHomeworkSerializer(student_homework_assignments, many=True).data

    def _dashboard_sh_qs(self, obj):
        return (
            StudentHomework.objects.filter(student=obj)
            .select_related('homework', 'homework__class_field')
            .prefetch_related('homework__words')
        )

    def get_overdue_assignments(self, obj):
        today = timezone.localdate()
        qs = self._dashboard_sh_qs(obj).filter(
            submitted=False,
            homework__due_date__isnull=False,
            homework__due_date__lt=today,
        ).order_by('homework__due_date')
        return StudentHomeworkSerializer(qs, many=True).data

    def get_new_assignments(self, obj):
        today = timezone.localdate()
        qs = (
            self._dashboard_sh_qs(obj)
            .filter(submitted=False)
            .filter(Q(homework__due_date__isnull=True) | Q(homework__due_date__gte=today))
            .order_by('-id')
        )
        return StudentHomeworkSerializer(qs, many=True).data

    def get_latest_marked_mark_value(self, obj):
        """Average effort (mark_value) for the five most recently submitted graded items."""
        qs = (
            StudentHomework.objects.filter(student=obj, marked=True, mark_value__isnull=False)
            .order_by('-submission_date', '-id')[:5]
        )
        rows = list(qs)
        if not rows:
            return None
        return round(sum(float(r.mark_value) for r in rows) / len(rows), 3)

    def get_lexicon_word_count(self, obj):
        return lexicon_word_count_for_student(obj)

    def get_completed_homework_count(self, obj):
        return StudentHomework.objects.filter(student=obj, submitted=True).count()


def academic_year_bounds(today=None):
    today = today or timezone.localdate()
    if today.month >= 4:
        start = date(today.year, 4, 1)
        end = date(today.year + 1, 3, 31)
    else:
        start = date(today.year - 1, 4, 1)
        end = date(today.year, 3, 31)
    return start, end


def split_display_name(full_name):
    name = (full_name or '').strip()
    if not name:
        return '', ''
    i = name.find(' ')
    if i == -1:
        return name, ''
    return name[:i].strip(), name[i + 1 :].strip()


class SchoolStudentDirectorySerializer(serializers.ModelSerializer):
    """Lightweight student row for school directory / search grids."""

    first_name = serializers.SerializerMethodField()
    last_name = serializers.SerializerMethodField()
    enrolled_class_ids = serializers.SerializerMethodField()
    recent_five_avg_mark = serializers.SerializerMethodField()
    assignments_total = serializers.SerializerMethodField()
    assignments_active = serializers.SerializerMethodField()
    assignments_overdue = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            'id',
            'name',
            'first_name',
            'last_name',
            'avatar_url',
            'enrolled_class_ids',
            'recent_five_avg_mark',
            'assignments_total',
            'assignments_active',
            'assignments_overdue',
        ]

    def get_first_name(self, obj):
        return split_display_name(obj.name)[0]

    def get_last_name(self, obj):
        return split_display_name(obj.name)[1]

    def get_enrolled_class_ids(self, obj):
        return list(obj.classes_enrolled.values_list('id', flat=True))

    def get_recent_five_avg_mark(self, obj):
        qs = (
            StudentHomework.objects.filter(student=obj, marked=True, mark_value__isnull=False)
            .order_by('-submission_date', '-id')[:5]
        )
        rows = list(qs)
        if not rows:
            return None
        return round(sum(float(r.mark_value) for r in rows) / len(rows), 3)

    def get_assignments_total(self, obj):
        return StudentHomework.objects.filter(student=obj).count()

    def get_assignments_active(self, obj):
        today = timezone.localdate()
        return (
            StudentHomework.objects.filter(student=obj, submitted=False)
            .filter(Q(homework__due_date__isnull=True) | Q(homework__due_date__gte=today))
            .count()
        )

    def get_assignments_overdue(self, obj):
        today = timezone.localdate()
        return (
            StudentHomework.objects.filter(student=obj, submitted=False)
            .filter(homework__due_date__isnull=False, homework__due_date__lt=today)
            .count()
        )


class SchoolTeacherDirectorySerializer(serializers.ModelSerializer):
    first_name = serializers.SerializerMethodField()
    last_name = serializers.SerializerMethodField()
    class_names = serializers.SerializerMethodField()
    class_ids = serializers.SerializerMethodField()

    class Meta:
        model = Teacher
        fields = ['id', 'name', 'first_name', 'last_name', 'avatar_url', 'class_names', 'class_ids']

    def get_first_name(self, obj):
        return split_display_name(obj.name)[0]

    def get_last_name(self, obj):
        return split_display_name(obj.name)[1]

    def get_class_names(self, obj):
        return list(obj.classes_teaching.values_list('name', flat=True).order_by('name'))

    def get_class_ids(self, obj):
        return list(obj.classes_teaching.values_list('id', flat=True).order_by('id'))


class SchoolStudentDetailProfileSerializer(serializers.ModelSerializer):
    """School admin student profile: classes, assignment table, rolling effort average."""

    first_name = serializers.SerializerMethodField()
    last_name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    enrolled_classes = serializers.SerializerMethodField()
    recent_five_avg_mark = serializers.SerializerMethodField()
    assignment_directory = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            'id',
            'name',
            'first_name',
            'last_name',
            'email',
            'avatar_url',
            'effort_symbol',
            'enrolled_classes',
            'recent_five_avg_mark',
            'assignment_directory',
        ]

    def get_first_name(self, obj):
        return split_display_name(obj.name)[0]

    def get_last_name(self, obj):
        return split_display_name(obj.name)[1]

    def get_email(self, obj):
        return obj.user.email

    def get_enrolled_classes(self, obj):
        return [
            {'id': c.id, 'name': c.name}
            for c in obj.classes_enrolled.all().order_by('name')
        ]

    def get_recent_five_avg_mark(self, obj):
        qs = (
            StudentHomework.objects.filter(student=obj, marked=True, mark_value__isnull=False)
            .order_by('-submission_date', '-id')[:5]
        )
        rows = list(qs)
        if not rows:
            return None
        return round(sum(float(r.mark_value) for r in rows) / len(rows), 3)

    def get_assignment_directory(self, obj):
        today = timezone.localdate()
        ay_start, ay_end = academic_year_bounds(today)
        out = []
        qs = (
            StudentHomework.objects.filter(student=obj)
            .select_related('homework', 'homework__class_field')
            .order_by('-id')
        )
        for sh in qs:
            hw = sh.homework
            cf = hw.class_field
            class_name = cf.name if cf else '—'
            due = hw.due_date
            is_overdue = not sh.submitted and due is not None and due < today
            in_year = due is None or (ay_start <= due <= ay_end)
            out.append(
                {
                    'id': sh.id,
                    'assignment_name': hw.title,
                    'classroom': class_name,
                    'date_submitted': sh.submission_date,
                    'due_date': due,
                    'mark_value': float(sh.mark_value) if sh.mark_value is not None else None,
                    'submitted': sh.submitted,
                    'marked': sh.marked,
                    'is_overdue': is_overdue,
                    'in_academic_year': in_year,
                }
            )
        return out


class TeacherDetailSerializer(serializers.ModelSerializer):
    classes = serializers.SerializerMethodField()
    students = serializers.SerializerMethodField()
    homework = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    dashboard_stats = serializers.SerializerMethodField()
    class_summaries = serializers.SerializerMethodField()

    class Meta:
        model = Teacher
        fields = [
            'id',
            'user',
            'school',
            'name',
            'avatar_url',
            'email',
            'classes',
            'students',
            'homework',
            'dashboard_stats',
            'class_summaries',
        ]

    def get_email(self, obj):
        return obj.user.email

    def get_classes(self, obj):
        classes_teaching = obj.classes_teaching.all()
        return ClassSerializer(classes_teaching, many=True).data

    def get_students(self, obj):
        classes_teaching = obj.classes_teaching.all()
        students = Student.objects.filter(classes_enrolled__in=classes_teaching).distinct()
        return StudentSerializer(students, many=True).data

    def get_homework(self, obj):
        classes_teaching = obj.classes_teaching.all()
        students = Student.objects.filter(classes_enrolled__in=classes_teaching).distinct()
        student_homework = (
            StudentHomework.objects.filter(
                student__in=students,
                submitted=True,
                marked=False,
            )
            .select_related('student', 'homework', 'homework__class_field')
            .prefetch_related('homework__words')
        )
        return StudentHomeworkSerializer(student_homework, many=True).data

    def get_dashboard_stats(self, obj):
        classes_teaching = obj.classes_teaching.all()
        students = Student.objects.filter(classes_enrolled__in=classes_teaching).distinct()
        student_ids = students.values_list('pk', flat=True)
        base = StudentHomework.objects.filter(student__in=student_ids)
        return {
            'classes_count': classes_teaching.count(),
            'students_count': students.count(),
            'pending_assignments_count': base.filter(submitted=False).count(),
            'unmarked_assignments_count': base.filter(submitted=True, marked=False).count(),
        }

    def get_class_summaries(self, obj):
        out = []
        for c in obj.classes_teaching.all().order_by('name'):
            sids = c.students.values_list('pk', flat=True)
            unmarked = StudentHomework.objects.filter(
                student__in=sids,
                homework__class_field=c,
                submitted=True,
                marked=False,
            ).count()
            out.append(
                {
                    'id': c.id,
                    'name': c.name,
                    'level': c.level,
                    'student_count': c.students.count(),
                    'unmarked_count': unmarked,
                }
            )
        return out