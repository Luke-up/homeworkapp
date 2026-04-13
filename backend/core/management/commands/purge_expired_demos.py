from django.core.management.base import BaseCommand

from core.demo_session import purge_expired_timed_demo_schools


class Command(BaseCommand):
    help = "Delete timed demo schools that are past demo_expires_at (run from cron)."

    def handle(self, *args, **options):
        n = purge_expired_timed_demo_schools()
        self.stdout.write(self.style.SUCCESS(f"Removed {n} expired timed demo school(s)."))
