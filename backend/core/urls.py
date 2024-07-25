# urls.py
from django.urls import path
from .views import CreateSchoolView, LoginView, CreateTeacherView, CreateStudentView, CreateClassView, ListClassesView, CreateHomeworkView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),

    path('create-school/', CreateSchoolView.as_view(), name='create-school'),

    # Accessible only by school users
    path('create-teacher/', CreateTeacherView.as_view(), name='create_teacher'),
    path('create-student/', CreateStudentView.as_view(), name='create_student'),

    path('create-class/', CreateClassView.as_view(), name='create_class'),
    path('classes/', ListClassesView.as_view(), name='list-classes'),

    # Accessible only by teachers and school users
    path('homework/create/', CreateHomeworkView.as_view(), name='create-homework'),
]
