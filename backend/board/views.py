from django.db.models import Count, Exists, OuterRef
from rest_framework import mixins, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Idea, Vote
from .serializers import IdeaSerializer, SignInSerializer

SORT_FIELDS = {
    "popularity": "-vote_count",
    "recent": "-created_at",
}


class SignInView(APIView):
    # Open endpoint: anyone may attempt to obtain a token, so the DRF defaults
    # (TokenAuthentication + IsAuthenticatedOrReadOnly) are cleared here.
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = SignInSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)  # invalid creds -> 400
        # get_or_create reuses the one persistent token per member on repeat sign-ins.
        token, _ = Token.objects.get_or_create(user=serializer.validated_data["user"])
        return Response({"token": token.key})


class IdeaViewSet(
    mixins.ListModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet
):
    serializer_class = IdeaSerializer
    # Reads are open; writes require a valid token (401 otherwise).
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        # vote_count is derived here, never stored. Unknown/missing sort values
        # fall back to popularity per Requirement 4.4.
        sort = self.request.query_params.get("sort", "popularity")
        order = SORT_FIELDS.get(sort, SORT_FIELDS["popularity"])
        qs = Idea.objects.annotate(vote_count=Count("votes")).order_by(order)

        user = self.request.user
        if user.is_authenticated:
            # Per-request flag powering the frontend's vote/unvote toggle.
            qs = qs.annotate(
                has_voted=Exists(
                    Vote.objects.filter(idea=OuterRef("pk"), user=user)
                )
            )
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post", "delete"])
    def vote(self, request, pk=None):
        idea = self.get_object()
        if request.method == "POST":
            # get_or_create leans on the DB unique constraint as the backstop;
            # a repeat vote is a no-op (200) rather than a duplicate row (Req 5.3).
            _, created = Vote.objects.get_or_create(idea=idea, user=request.user)
            return Response(
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
            )
        # DELETE is idempotent: removing a non-existent vote is still a 204.
        Vote.objects.filter(idea=idea, user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
