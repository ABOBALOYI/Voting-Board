from rest_framework.routers import DefaultRouter

from .views import IdeaViewSet

# basename is explicit because IdeaViewSet has no .queryset attribute (it builds
# the queryset per-request in get_queryset), so the router cannot infer it.
router = DefaultRouter()
router.register("ideas", IdeaViewSet, basename="idea")

urlpatterns = router.urls
