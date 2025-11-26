from django.urls import path
from .views import AnnouncementListCreateAPIView, AnnouncementDetailAPIView

urlpatterns = [
    # List all announcements and create new announcement
    path('announcements/', AnnouncementListCreateAPIView.as_view(), name='announcement-list-create'),
    
    # Retrieve, update, or delete a specific announcement
    path('announcements/<int:pk>/', AnnouncementDetailAPIView.as_view(), name='announcement-detail'),
]
