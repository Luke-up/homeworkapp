from pathlib import Path
from datetime import timedelta
import environ
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()
environ.Env.read_env(BASE_DIR / '.env')

SECRET_KEY = env('SECRET_KEY')
DEBUG = env.bool('DEBUG', default=False)

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Hosts / CSRF (production: set ALLOWED_HOSTS and CORS_ALLOWED_ORIGINS in the platform env)
if DEBUG:
    ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1', '*'])
else:
    ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=[])

CSRF_TRUSTED_ORIGINS = env.list('CSRF_TRUSTED_ORIGINS', default=[])

AUTH_USER_MODEL = 'core.User'

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
]

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'core',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database: SQLite | DATABASE_URL (Render/Heroku-style) | discrete DB_* vars
if env.bool('USE_SQLITE', default=False):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
elif os.environ.get('DATABASE_URL'):
    DATABASES = {'default': env.db()}  # reads standard DATABASE_URL
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': env('DB_NAME', default='postgres'),
            'USER': env('DB_USER', default='postgres'),
            'PASSWORD': env('DB_PASSWORD', default='postgres'),
            'HOST': env('DB_HOST', default='db'),
            'PORT': env.int('DB_PORT', default=5432),
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'core.demo_jwt_authentication.DemoAwareJWTAuthentication',
    ),
}

# Browser "live demo" length (minutes); school rows use School.demo_expires_at.
DEMO_SESSION_MINUTES = env.int('DEMO_SESSION_MINUTES', default=20)

# CORS: comma-separated in env, e.g. https://your-app.vercel.app,https://www.yoursite.com
# Local dev: defaults below when DEBUG is True
_cors_raw = env('CORS_ALLOWED_ORIGINS', default='')
CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_raw.split(',') if o.strip()]
if DEBUG:
    for origin in ('http://localhost:3000', 'http://127.0.0.1:3000'):
        if origin not in CORS_ALLOWED_ORIGINS:
            CORS_ALLOWED_ORIGINS.append(origin)

# Google reCAPTCHA v2 (optional in dev: leave empty to skip verification)
RECAPTCHA_SECRET_KEY = env('RECAPTCHA_SECRET_KEY', default='')
