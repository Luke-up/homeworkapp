from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, user_type='student', **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        extra_fields.setdefault('user_type', user_type)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('user_type', 'admin') 

        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    USER_TYPE_CHOICES = [
        ('school', 'School'),
        ('teacher', 'Teacher'),
        ('student', 'Student'),
        ('admin', 'Admin'),  # Adding 'admin' type
    ]
    email = models.EmailField(unique=True)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    name = models.CharField(max_length=255)
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name', 'user_type']

    def __str__(self):
        return self.email

    def has_perm(self, perm, obj=None):
        return True

    def has_module_perms(self, app_label):
        return True

class School(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='school_profile')
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

class Teacher(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='teacher_profile')
    school = models.ForeignKey(School, related_name='teachers', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)

    def __str__(self):
        return f"Teacher Profile: {self.user.email}"

class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    school = models.ForeignKey(School, related_name='students', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)

    def __str__(self):
        return f"Student Profile: {self.user.email}"

class Class(models.Model):
    name = models.CharField(max_length=255)
    school = models.ForeignKey(School, related_name='classes', on_delete=models.CASCADE)
    description = models.TextField(blank=True)
    level = models.IntegerField()

    def __str__(self):
        return self.name

class Homework(models.Model):
    title = models.CharField(max_length=255)
    level = models.IntegerField()
    class_field = models.ForeignKey('Class', related_name='homework_classes', on_delete=models.CASCADE)
    words = models.ManyToManyField('Word', related_name='homework_related', blank=True)
    reading = models.TextField(blank=True)
    summary = models.TextField(blank=True)
    image = models.TextField(blank=True)
    questions = models.JSONField(blank=True, null=True)

    def __str__(self):
        return self.title


class Word(models.Model):
    word = models.CharField(max_length=255)
    example_sentence = models.TextField()
    homework = models.ForeignKey('Homework', related_name='homework_words', on_delete=models.CASCADE)

    def __str__(self):
        return self.word
