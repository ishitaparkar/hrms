from django.urls import path
from .views import MyAttendanceView

urlpatterns = [
    path('my-attendance/', MyAttendanceView.as_view(), name='my-attendance'),
]
