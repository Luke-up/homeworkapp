# URL endpoints overview

All paths below are relative to the API mount **`/core/`** (see `backend/config/urls.py` including the `core` app prefix).

## Authentication and session

| Method | Path | View | Notes |
|--------|------|------|-------|
| GET | `auth-status/` | `AuthStatusView` | Bearer access; returns user type. |
| POST | `login/` | `LoginView` | JSON email/password → JWT pair. |
| POST | `logout/` | `LogoutView` | Client-side discard; success body. |
| POST | `refresh/` | `RefreshTokenView` | Body: `refresh` or `refresh_token`. |
| POST | `create-school/` | `CreateSchoolView` | Public signup; forces `school` role. |
| POST | `demo-session/start/` | `StartTimedDemoView` | Public; reCAPTCHA when configured; creates timed sandbox. |

## Profiles (self)

| Method | Path | Role |
|--------|------|------|
| GET/PATCH | `student-profile/` | Student |
| GET/PATCH | `teacher-profile/` | Teacher |

## Student

| Method | Path | Purpose |
|--------|------|---------|
| GET | `student-dashboard/` | Dashboard payload (`StudentDetailSerializer`). |
| GET | `student-lexicon/` | Lexicon rows; `?order=new|old`. |
| GET | `student-homework/` | Completed list + enrolled classes. |
| GET | `student-homework/<pk>/` | Single attempt + embedded homework. |
| PATCH | `student-homework/update/` | Student answers/submit; teacher/school mark. |

## Teacher

| Method | Path | Purpose |
|--------|------|---------|
| GET | `teacher-dashboard/` | Teacher home data. |
| GET | `teacher-homework/<pk>/` | Marking detail for one `StudentHomework`. |
| GET | `teacher-class/<class_id>/students-work/` | Roster + pending counts. |

## Homework (class-scoped)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `homework/?class_id=` | List templates for a class. |
| POST | `homework/create/` | Create template + student rows. |
| GET | `homework/<pk>/` | Template detail. |
| POST | `homework/delete/` | Delete template (body carries id per implementation). |

## Classes

| Method | Path | Notes |
|--------|------|-------|
| POST | `classes/create` | Create class (note: no trailing slash in pattern). |
| GET | `classes/` | School’s graph (classes/teachers/students). |
| PATCH | `classes/edit/` | Update metadata. |
| PATCH | `classes/update/` | Assign/remove teachers and students. |
| POST | `classes/delete/` | Remove class. |
| GET | `classes/<class_id>/roster/` | Roster. |

## School directory

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `students/`, `students/create/` | List / create students. |
| GET/PATCH | `students/<pk>/` | Student profile + assignment directory. |
| GET/POST | `teachers/`, `teachers/create/` | List / create teachers. |
| GET/PATCH | `teachers/<pk>/` | Teacher detail. |

## Words (global bank)

| Method | Path |
|--------|------|
| GET | `words/` |
| POST | `words/delete/` |

Exact HTTP verbs and bodies match **`backend/core/urls.py`** and each **`APIView`** implementation—when in doubt, read the view class named in `urls.py`.
