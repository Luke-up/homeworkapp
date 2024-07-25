import logging
from django.contrib.auth.backends import BaseBackend
from django.contrib.auth.hashers import check_password
from django.core.exceptions import ObjectDoesNotExist
from .models import School, Teacher, Student

logger = logging.getLogger(__name__)

class MultiModelBackend(BaseBackend):
    def authenticate(self, request, email=None, password=None, **kwargs):
        logger.debug(f"Attempting to authenticate user with email: {email}")
        user = self._authenticate_user(School, email, password)
        if user is None:
            user = self._authenticate_user(Teacher, email, password)
        if user is None:
            user = self._authenticate_user(Student, email, password)
        if user:
            logger.debug(f"Authenticated user: {user.email}")
        else:
            logger.debug("User not found or password incorrect")
        return user

    def _authenticate_user(self, model, email, password):
        try:
            user = model.objects.get(email=email)
            if check_password(password, user.password):
                return user
        except ObjectDoesNotExist:
            return None

    def get_user(self, user_id):
        for model in [School, Teacher, Student]:
            try:
                return model.objects.get(pk=user_id)
            except model.DoesNotExist:
                continue
        return None
