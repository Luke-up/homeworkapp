# admin.py
from django.contrib import admin
from .models import School, Teacher, Student

class SchoolAdmin(admin.ModelAdmin):
    list_display = ('name',)

class TeacherAdmin(admin.ModelAdmin):
    list_display = ('name', 'school')

class StudentAdmin(admin.ModelAdmin):
    list_display = ('name', 'school')

# Register models with custom admin classes
admin.site.register(School, SchoolAdmin)
admin.site.register(Teacher, TeacherAdmin)
admin.site.register(Student, StudentAdmin)
