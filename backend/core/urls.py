# urls.py
from django.urls import path
from .views import CreateSchoolView, LoginView, CreateTeacherView, CreateStudentView, CreateClassView, ListClassesView, CreateHomeworkView, StudentHomeworkView, UpdateStudentHomeworkView

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

    path('homework/', CreateHomeworkView.as_view(), name='create-homework'),
    path('student-homework/', StudentHomeworkView.as_view(), name='student-homework'),

    path('student-homework/<int:pk>/', UpdateStudentHomeworkView.as_view(), name='update-student-homework'),

    # Endpoints by page

        # Homepage
            # No endpoints needed

        # Signup Page
            # create-school endpoint            (anyone)                        Done

        # Login Page
            # login endpoint                    (registered users)              Done

        # Student Dashboard
            # Update profile endpoint           (students)
            # Get student dashboard endpoint    (students)

        # Student Lexicon
            # Get student lexicon endpoint      (students)

        # Student Homework
            # Get student homework endpoint     (students)

        # Student Homework view
            # Update student homework endpoint  (students)

        # Teacher Dashboard
            # Update profile endpoint           (teachers)
            # Get teacher dashboard endpoint    (teachers)

        # Classroom Homework
            # Get homework endpoint             (teachers and school users)
            # Delete homework endpoint          (school users)

        # Classroom Student
            # Get students endpoint             (teachers and school users)

        # Classroom Homework view create
            # Create homework endpoint          (teachers and school users)         Done

        # Classroom Homework view mark
            # Update student homework endpoint  (teachers and school users)

        # School Classrooms
            # Create class endpoint             (school users)                      Done
            # Get classes endpoint              (school users)                      Done
            # Update class endpoint             (school users)
            # Update Teacher endpoint           (school users)
            # Update Student endpoint           (school users)
            # Delete class endpoint             (school users)

        # Student Search
            # Get students endpoint             (school users)
            # Create student endpoint           (school users)                      Done

        # Student view
            # Get student profile endpoint      (school users)
            # Update student endpoint           (school users)
            # Delete student endpoint           (school users)

        # Teacher Search
            # Get teachers endpoint             (school users)
            # Create teacher endpoint           (school users)                      Done
            # Update teacher endpoint           (school users)
            # Delete teacher endpoint           (school users)

        # Lexicon Search
            # Get words endpoint                (teachers and school users)
            # Delete words endpoint             (school users)

]
