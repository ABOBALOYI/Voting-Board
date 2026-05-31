from django.contrib.auth import authenticate
from rest_framework import serializers

from .models import Idea


class IdeaSerializer(serializers.ModelSerializer):
    # vote_count is annotated onto the queryset; read-only here. It defaults to 0
    # for a freshly created instance, which carries no annotation (Req 3.3).
    vote_count = serializers.IntegerField(read_only=True, default=0)
    # has_voted is annotated per-request for the current user so the frontend can
    # render the correct vote/unvote toggle without a second round-trip.
    has_voted = serializers.BooleanField(read_only=True, default=False)
    created_by = serializers.ReadOnlyField(source="created_by.username")

    class Meta:
        model = Idea
        fields = [
            "id", "title", "description", "created_at",
            "created_by", "vote_count", "has_voted",
        ]
        read_only_fields = [
            "id", "created_at", "created_by", "vote_count", "has_voted",
        ]

    def validate_title(self, value):
        # Treat all-whitespace titles as empty so the board never shows blank rows.
        if not value.strip():
            raise serializers.ValidationError("Title cannot be empty.")
        return value


class SignInSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(username=attrs["username"], password=attrs["password"])
        if user is None:
            # Invalid credentials surface as a 400 validation error, never a token.
            raise serializers.ValidationError("Invalid username or password.")
        attrs["user"] = user
        return attrs
