from django.urls import path

from .views.auth_views import (
    AuthStatusView,
    CreateSchoolView,
    LoginView,
    LogoutView,
    RefreshTokenView,
    StartTimedDemoView,
)
from .views.school_views import (
    AssignToClassView,
    CreateClassView,
    CreateHomeworkView,
    CreateStudentView,
    CreateTeacherView,
    DeleteClassView,
    DeleteHomeworkView,
    DeleteWordView,
    ListClassesView,
    ListStudentsView,
    ListTeachersView,
    ListWordsView,
    StudentDetailView,
    TeacherDetailView,
    UpdateClassView,
)
from .views.student_views import (
    StudentDashboardView,
    StudentHomeworkDetailView,
    StudentHomeworkUpdateView,
    StudentHomeworkView,
    StudentLexiconView,
    StudentSelfProfileView,
)
from .views.teacher_views import (
    ClassRosterView,
    HomeworkTemplateDetailView,
    ListHomeworkForClassView,
    TeacherClassStudentsWorkView,
    TeacherDashboardView,
    TeacherMarkHomeworkDetailView,
    TeacherSelfProfileView,
)

urlpatterns = [
    path('auth-status/', AuthStatusView.as_view(), name='auth-status'),
    path('refresh/', RefreshTokenView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('create-school/', CreateSchoolView.as_view(), name='create-school'),
    path('demo-session/start/', StartTimedDemoView.as_view(), name='demo-session-start'),
    path('login/', LoginView.as_view(), name='login'),
    # Profiles (self-service)
    path('student-profile/', StudentSelfProfileView.as_view(), name='student-profile'),
    path('teacher-profile/', TeacherSelfProfileView.as_view(), name='teacher-profile'),
    # Student
    path('student-dashboard/', StudentDashboardView.as_view(), name='student-dashboard'),
    path('student-lexicon/', StudentLexiconView.as_view(), name='student-lexicon'),
    path('student-homework/<int:pk>/', StudentHomeworkDetailView.as_view(), name='student-homework-detail'),
    path('student-homework/', StudentHomeworkView.as_view(), name='student-homework'),
    path('student-homework/update/', StudentHomeworkUpdateView.as_view(), name='update-student-homework'),
    # Teacher
    path('teacher-dashboard/', TeacherDashboardView.as_view(), name='teacher-dashboard'),
    path('teacher-homework/<int:pk>/', TeacherMarkHomeworkDetailView.as_view(), name='teacher-homework-detail'),
    path(
        'teacher-class/<int:class_id>/students-work/',
        TeacherClassStudentsWorkView.as_view(),
        name='teacher-class-students-work',
    ),
    # Homework (class-scoped)
    path('homework/create/', CreateHomeworkView.as_view(), name='create-homework'),
    path('homework/<int:pk>/', HomeworkTemplateDetailView.as_view(), name='homework-template-detail'),
    path('homework/', ListHomeworkForClassView.as_view(), name='list-homework'),
    path('homework/delete/', DeleteHomeworkView.as_view(), name='delete-homework'),
    # Classes
    path('classes/create', CreateClassView.as_view(), name='create_class'),
    path('classes/edit/', UpdateClassView.as_view(), name='edit-class'),
    path('classes/<int:class_id>/roster/', ClassRosterView.as_view(), name='class-roster'),
    path('classes/', ListClassesView.as_view(), name='list-classes'),
    path('classes/update/', AssignToClassView.as_view(), name='assign-teacher'),
    path('classes/delete/', DeleteClassView.as_view(), name='delete-class'),
    # School directory (detail routes must stay before bare list if using overlapping patterns)
    path('students/create/', CreateStudentView.as_view(), name='create_student'),
    path('students/<int:pk>/', StudentDetailView.as_view(), name='student-detail'),
    path('students/', ListStudentsView.as_view(), name='list-students'),
    path('teachers/create/', CreateTeacherView.as_view(), name='create_teacher'),
    path('teachers/<int:pk>/', TeacherDetailView.as_view(), name='teacher-detail'),
    path('teachers/', ListTeachersView.as_view(), name='list-teachers'),
    # Lexicon (global word bank)
    path('words/', ListWordsView.as_view(), name='list-words'),
    path('words/delete/', DeleteWordView.as_view(), name='delete-word'),
]
