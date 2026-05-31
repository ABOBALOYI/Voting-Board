from django.conf import settings
from django.db import models


class Idea(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ideas",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class Vote(models.Model):
    idea = models.ForeignKey(Idea, on_delete=models.CASCADE, related_name="votes")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="votes",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            # One vote per user per idea — the single-vote rule lives in the DB,
            # not just in application code, so concurrent requests can't bypass it.
            models.UniqueConstraint(
                fields=["user", "idea"], name="unique_user_idea_vote"
            )
        ]
