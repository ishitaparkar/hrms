from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AnnouncementViewSet, EventViewSet, GetEmployeeStatsView

router = DefaultRouter()
router.register(r'announcements', AnnouncementViewSet)
router.register(r'events', EventViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('stats/', GetEmployeeStatsView.as_view(), name='employee-stats'),
]
