from django.urls import path
from .views import MyAttendanceView, AttendanceActionView

urlpatterns = [
    path('my-attendance/', MyAttendanceView.as_view(), name='my-attendance'),
    path('action/', AttendanceActionView.as_view(), name='attendance-action'),
]
