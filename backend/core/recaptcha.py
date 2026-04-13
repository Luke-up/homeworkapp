"""Verify Google reCAPTCHA v2 tokens (signup and other public forms)."""
import json
import urllib.error
import urllib.parse
import urllib.request

from django.conf import settings


def verify_recaptcha_v2(token: str) -> bool:
    """
    Returns True if verification succeeds or if RECAPTCHA_SECRET_KEY is not configured
    (local development). When the secret is set, a missing/invalid token fails.
    """
    secret = getattr(settings, "RECAPTCHA_SECRET_KEY", "") or ""
    if not secret:
        return True
    if not token or not str(token).strip():
        return False
    data = urllib.parse.urlencode(
        {
            "secret": secret,
            "response": token.strip(),
        }
    ).encode()
    req = urllib.request.Request(
        "https://www.google.com/recaptcha/api/siteverify",
        data=data,
        method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = json.loads(resp.read().decode())
    except (urllib.error.URLError, json.JSONDecodeError, OSError):
        return False
    return bool(body.get("success"))
