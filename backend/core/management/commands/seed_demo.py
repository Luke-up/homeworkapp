"""
Load repeatable demo data for local testing.

Why a management command instead of a JSON file?
- Django stores passwords as hashes; fixtures often get this wrong or go stale.
- Relational data (school → class → homework → student rows) is easier to create
  in code with clear ordering and get_or_create-style idempotency.
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Q

from core.demo_populate import populate_demo_school
from core.models import School, User


DEMO_PASSWORD = "demo12345"
SCHOOL_EMAIL = "demo-school@example.com"


class Command(BaseCommand):
    help = "Create demo school, teachers, students, classes, words, and homework (safe to re-run)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Remove all users with emails starting with 'demo-' then recreate.",
        )

    def handle(self, *args, **options):
        if options["reset"]:
            deleted, _ = User.objects.filter(
                Q(email__startswith="demo-") | Q(email__startswith="timedemo-")
            ).delete()
            self.stdout.write(self.style.WARNING(f"Removed demo users (and related rows): {deleted}"))

        if User.objects.filter(email=SCHOOL_EMAIL).exists():
            self.stdout.write(self.style.NOTICE("Demo data already present; skipping. Use --reset to rebuild."))
            return

        with transaction.atomic():
            school_user = User.objects.create_user(
                email=SCHOOL_EMAIL,
                password=DEMO_PASSWORD,
                name="Demo Academy",
                user_type="school",
            )
            school = School.objects.create(user=school_user, name="Demo Academy")
            populate_demo_school(school, DEMO_PASSWORD, email_tag=None)

        self.stdout.write(self.style.SUCCESS("Demo data created. See STARTUP.md for login emails and password."))
