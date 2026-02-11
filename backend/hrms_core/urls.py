"""
URL configuration for backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Employee Management (includes OCR and Profile APIs)
    path('api/', include('employee_management.urls')),
    
    # Other Apps
    path('api/', include('leave_management.urls')), 
    path('api/auth/', include('authentication.urls')),
    path('api/performance/', include('performance_management.urls')),
    path('api/attendance/', include('attendance_leave.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    
    # New dynamic pages apps
    path('api/', include('announcements.urls')),
]

# =============================================================================
# MEDIA FILE SERVING (Critical for Profile Pictures)
# =============================================================================
# This tells Django: "If a URL starts with /media/, find the file in the media folder."
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)