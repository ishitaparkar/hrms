from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.db.models import Q
from .models import Announcement
from .serializers import (
    AnnouncementSerializer,
    AnnouncementCreateSerializer,
    AnnouncementUpdateSerializer
)


class IsHRManagerOrSuperAdmin(permissions.BasePermission):
    """
    Custom permission to only allow HR Managers and Super Admins to create/edit/delete announcements.
    """
    def has_permission(self, request, view):
        # Read permissions are allowed to any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write permissions only for HR Manager or Super Admin
        return request.user and request.user.is_authenticated and (
            request.user.groups.filter(name__in=['HR Manager', 'Super Admin']).exists() or
            request.user.is_superuser
        )


class AnnouncementListCreateAPIView(generics.ListCreateAPIView):
    """
    API view for listing and creating announcements.
    
    GET: List all active announcements (or all if user is HR Manager/Super Admin)
    POST: Create a new announcement (HR Manager/Super Admin only)
    """
    permission_classes = [permissions.IsAuthenticated, IsHRManagerOrSuperAdmin]
    
    def get_queryset(self):
        """
        Return announcements based on user role.
        HR Managers and Super Admins see all announcements.
        Other users only see active announcements.
        """
        user = self.request.user
        queryset = Announcement.objects.all()
        
        # Check if user is HR Manager or Super Admin
        is_hr_or_admin = (
            user.groups.filter(name__in=['HR Manager', 'Super Admin']).exists() or
            user.is_superuser
        )
        
        if not is_hr_or_admin:
            # Regular users only see active announcements
            queryset = queryset.filter(is_active=True)
        
        # Optional filtering by search query
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(content__icontains=search)
            )
        
        return queryset.select_related('author')
    
    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.request.method == 'POST':
            return AnnouncementCreateSerializer
        return AnnouncementSerializer
    
    def perform_create(self, serializer):
        """Set the author to the current user when creating"""
        serializer.save(author=self.request.user)


class AnnouncementDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    API view for retrieving, updating, and deleting a specific announcement.
    
    GET: Retrieve announcement details
    PUT/PATCH: Update announcement (HR Manager/Super Admin only)
    DELETE: Delete announcement (HR Manager/Super Admin only)
    """
    queryset = Announcement.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsHRManagerOrSuperAdmin]
    
    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.request.method in ['PUT', 'PATCH']:
            return AnnouncementUpdateSerializer
        return AnnouncementSerializer
    
    def get_queryset(self):
        """Return queryset with author information"""
        return Announcement.objects.select_related('author')
