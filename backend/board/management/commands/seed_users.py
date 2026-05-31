from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from rest_framework.authtoken.models import Token

SEED_USERS = [
    ("alice", "password123"),
    ("bob", "password123"),
    ("abo", "password123"),
    ("ako", "password123"),
]


class Command(BaseCommand):
    help = "Create demo team members and their auth tokens."

    def handle(self, *args, **options):
        User = get_user_model()
        for username, password in SEED_USERS:
            user, created = User.objects.get_or_create(username=username)
            if created:
                # Only set the password on first creation so reruns don't reset it.
                user.set_password(password)
                user.save()
            Token.objects.get_or_create(user=user)
            self.stdout.write(self.style.SUCCESS(f"Ready: {username}"))
