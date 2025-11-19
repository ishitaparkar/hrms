from django.urls import path
from .views import MyPerformanceView

urlpatterns = [
    path('my-performance/', MyPerformanceView.as_view(), name='my-performance'),
]
