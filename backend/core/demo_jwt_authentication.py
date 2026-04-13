from rest_framework_simplejwt.authentication import JWTAuthentication

from core.demo_session import raise_if_demo_expired


class DemoAwareJWTAuthentication(JWTAuthentication):
    """Runs default JWT auth, then rejects timed demo sessions that are past expiry."""

    def authenticate(self, request):
        out = super().authenticate(request)
        if out is None:
            return None
        user, validated_token = out
        raise_if_demo_expired(user)
        return user, validated_token
