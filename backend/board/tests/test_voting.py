"""The one focused automated test the slice ships (Requirement 5.5).

Property 7: At most one vote per member per idea (single-vote rule).
Validates: Requirements 5.1, 5.2, 5.3.

For any Team_Member and any Idea, casting a vote one or more times results in
exactly one Vote row linking that member to that Idea, and the Idea's vote_count
after the first successful vote is unchanged by subsequent vote attempts. The
single-vote rule lives in the database (the ``unique_user_idea_vote``
UniqueConstraint), so a direct duplicate insert must raise ``IntegrityError``.
"""

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.db.models import Count
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from board.models import Idea, Vote


class SingleVoteRuleTests(APITestCase):
    """Property 7 — a member cannot record more than one vote on the same idea."""

    def setUp(self):
        # A seeded member with a persistent token, mirroring seed_users.
        User = get_user_model()
        self.member = User.objects.create_user(
            username="alice", password="password123"
        )
        self.token = Token.objects.create(user=self.member)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

        # An idea to vote on (author is irrelevant to the single-vote rule).
        self.idea = Idea.objects.create(
            title="Dark mode",
            description="Easier on the eyes",
            created_by=self.member,
        )

    def annotated_vote_count(self):
        """Read vote_count the way the listing endpoint derives it (Req 4.1)."""
        return (
            Idea.objects.filter(pk=self.idea.pk)
            .annotate(vote_count=Count("votes"))
            .values_list("vote_count", flat=True)
            .first()
        )

    def test_single_vote_per_user_per_idea(self):
        """A member cannot record more than one vote on the same idea.

        Verified at both layers in one focused test:
          (a) through the API — a repeat vote is an idempotent no-op, not a
              duplicate row, and the vote_count is unchanged (Req 5.1, 5.3); and
          (b) at the database — a direct duplicate insert violates the
              ``unique_user_idea_vote`` constraint and raises IntegrityError,
              proving the rule lives in the schema, not just the view (Req 5.2).
        """
        vote_url = f"/api/ideas/{self.idea.pk}/vote/"

        # (a) First vote creates exactly one Vote row (Req 5.1) -> 201 Created.
        first = self.client.post(vote_url)
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            Vote.objects.filter(user=self.member, idea=self.idea).count(), 1
        )
        self.assertEqual(self.annotated_vote_count(), 1)

        # (a) Second vote is an idempotent no-op (Req 5.3) -> 200 OK, no new row
        # and an unchanged vote_count.
        second = self.client.post(vote_url)
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertEqual(
            Vote.objects.filter(user=self.member, idea=self.idea).count(),
            1,
            "A second vote must not create an additional Vote row.",
        )
        self.assertEqual(self.annotated_vote_count(), 1)

        # (b) The rule lives in the database, not just the view (Req 5.2): a direct
        # duplicate insert for the same (user, idea) violates the
        # unique_user_idea_vote constraint. The atomic block isolates the failing
        # statement so the surrounding test transaction stays usable.
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Vote.objects.create(user=self.member, idea=self.idea)

        # Still exactly one vote after the rejected duplicate insert.
        self.assertEqual(
            Vote.objects.filter(user=self.member, idea=self.idea).count(), 1
        )
