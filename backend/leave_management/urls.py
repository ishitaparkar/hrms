from django.urls import path
from .views import (
    LeaveRequestListCreateAPIView, 
    LeaveRequestDetailAPIView,
    MyLeaveAPIView
)

urlpatterns = [
    path('leave-requests/', LeaveRequestListCreateAPIView.as_view()),
    path('leave-requests/<int:pk>/', LeaveRequestDetailAPIView.as_view()),
    path('my-leave/', MyLeaveAPIView.as_view(), name='my-leave'),
]