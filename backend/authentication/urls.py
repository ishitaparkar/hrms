from django.urls import path
from .views import (
    CustomAuthToken, CurrentUserView, FirstTimePasswordChangeView,
    RoleListCreateAPIView, RoleAssignmentAPIView,
    RoleRevocationAPIView, UserListAPIView, UserRolesListAPIView,
    AuditLogListAPIView, UserPreferencesAPIView
)

urlpatterns = [
    # Authentication endpoints
    path('login/', CustomAuthToken.as_view(), name='auth-token'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('first-login-password-change/', FirstTimePasswordChangeView.as_view(), name='first-login-password-change'),
    path('preferences/', UserPreferencesAPIView.as_view(), name='user-preferences'),
    
    # Role management endpoints
    path('roles/', RoleListCreateAPIView.as_view(), name='role-list-create'),
    path('users/', UserListAPIView.as_view(), name='user-list'),
    path('users/<int:user_id>/assign-role/', RoleAssignmentAPIView.as_view(), name='assign-role'),
    path('users/<int:user_id>/revoke-role/', RoleRevocationAPIView.as_view(), name='revoke-role'),
    path('users/<int:user_id>/roles/', UserRolesListAPIView.as_view(), name='user-roles'),
    
    # Audit log endpoints
    path('audit-logs/', AuditLogListAPIView.as_view(), name='audit-log-list'),
]