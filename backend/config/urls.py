"""URL configuration for the config project."""

from django.contrib import admin
from django.urls import include, path

from board.views import SignInView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/token/", SignInView.as_view()),
    path("api/", include("board.urls")),
]
