from django.urls import path

from .views.school_views import ListClassesView, CreateTeacherView, CreateStudentView, CreateClassView, AssignToClassView, CreateHomeworkView
from .views.auth_views import RegisterUserView, LoginView, LogoutView, CreateSchoolView
from .views.student_views import StudentDashboardView, StudentLexiconView, StudentHomeworkView, StudentHomeworkUpdateView
from .views.teacher_views import TeacherDashboardView

urlpatterns = [

    # Endpoints by page

        # Homepage
            # No endpoints needed

        # Signup Page
            # create-school endpoint                    (anyone)                        Done
    path('create-school/', CreateSchoolView.as_view(), name='create-school'), 
        # Login Page
            # login endpoint                            (registered users)              Done
    path('login/', LoginView.as_view(), name='login'),
        # Student Dashboard
            # Update profile endpoint                   (students)

            # Get student dashboard endpoint            (students)
    path('student-dashboard/', StudentDashboardView.as_view(), name='student-dashboard'),
        # Student Lexicon
            # Get student lexicon endpoint              (students)

        # Student Homework
            # Get student homework endpoint             (students)
    path('student-homework/', StudentHomeworkView.as_view(), name='student-homework'),
            # Update student homework endpoint          (students)
    path('student-homework/update/', StudentHomeworkUpdateView.as_view(), name='update-student-homework'),

        # Student Homework view
            # Update student homework endpoint          (students)

        # Teacher Dashboard
            # Update profile endpoint                   (teachers)
            # Get teacher dashboard endpoint            (teachers)
    path('teacher-dashboard/', TeacherDashboardView.as_view(), name='teacher-dashboard'),

        # Classroom Homework
            # Get homework endpoint                     (teachers and school users)
            # Delete homework endpoint                  (school users)

        # Classroom Student
            # Get students endpoint                     (teachers and school users)

        # Classroom Homework view create
            # Create homework endpoint                  (teachers and school users)         Done
    path('homework/create/', CreateHomeworkView.as_view(), name='create-homework'),

        # Classroom Homework view mark
            # Update student homework endpoint          (teachers and school users)

        # School Classrooms
            # Create class endpoint                     (school users)                      Done
    path('classes/create', CreateClassView.as_view(), name='create_class'),
            # Get classes, teacher, students endpoint   (school users)                      Done
    path('classes/', ListClassesView.as_view(), name='list-classes'),
            # Update class endpoint                     (school users)
            # Update Teacher, Student endpoint          (school users)
    path('classes/teacher/', AssignToClassView.as_view(), name='assign-teacher'),
            # Delete class endpoint                     (school users)

        # Student Search
            # Get students endpoint                     (school users)
            # Create student endpoint                   (school users)                      Done
    path('students/create/', CreateStudentView.as_view(), name='create_student'),

        # Student view
            # Get student profile endpoint              (school users)
            # Update student endpoint                   (school users)
            # Delete student endpoint                   (school users)

        # Teacher Search
            # Get teachers endpoint                     (school users)
            # Create teacher endpoint                   (school users)                      Done
    path('teachers/create/', CreateTeacherView.as_view(), name='create_teacher'),
            # Update teacher endpoint                   (school users)
            # Delete teacher endpoint                   (school users)

        # Lexicon Search
            # Get words endpoint                        (teachers and school users)
            # Delete words endpoint                     (school users)

]
