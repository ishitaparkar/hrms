from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status, generics
from django.contrib.auth.models import User, Group
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import RoleAssignment, AuditLog, UserPreferences
from .serializers import (
    RoleSerializer, RoleCreateSerializer, RoleAssignmentSerializer,
    RoleAssignmentCreateSerializer, RoleRevocationSerializer,
    UserRoleSerializer, UserPreferencesSerializer
)
from .permissions import IsSuperAdmin, get_client_ip


class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        # This calls the original ObtainAuthToken's logic
        serializer = self.serializer_class(data=request.data,
                                           context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        # This creates a token if it doesn't exist, or gets the existing one
        token, created = Token.objects.get_or_create(user=user)
        
        # Extract roles from user groups
        roles = [group.name for group in user.groups.all()]
        
        # Extract permissions
        permissions = list(user.get_all_permissions())
        
        # Get department and employee data from user profile if it exists
        department = None
        first_name = None
        last_name = None
        full_name = None
        employee_id = None
        requires_password_change = False
        
        if hasattr(user, 'profile'):
            profile = user.profile
            department = profile.department
            requires_password_change = not profile.password_changed
            
            # Get employee data if linked
            if profile.employee:
                employee = profile.employee
                first_name = employee.firstName
                last_name = employee.lastName
                full_name = f"{employee.firstName} {employee.lastName}"
                employee_id = employee.id  # Use numeric ID instead of employeeId string
        
        # Return enhanced response with role, permission, and employee data
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'email': user.email,
            'first_name': first_name,
            'last_name': last_name,
            'full_name': full_name,
            'employee_id': employee_id,
            'requires_password_change': requires_password_change,
            'roles': roles,
            'permissions': permissions,
            'department': department
        })


class CurrentUserView(APIView):
    """
    API endpoint that returns the current user's profile with roles and permissions.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Extract roles from user groups
        roles = [group.name for group in user.groups.all()]
        
        # Extract permissions
        permissions = list(user.get_all_permissions())
        
        # Initialize employee name fields
        first_name = None
        last_name = None
        full_name = None
        employee_id = None
        requires_password_change = False
        
        # Build user data
        user_data = {
            'id': user.pk,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        }
        
        # Get profile data if it exists
        profile_data = None
        if hasattr(user, 'profile'):
            profile = user.profile
            requires_password_change = not profile.password_changed
            
            profile_data = {
                'department': profile.department,
                'phone_number': profile.phone_number,
                'created_at': profile.created_at,
                'updated_at': profile.updated_at,
            }
            
            # Include employee data if linked
            if profile.employee:
                employee = profile.employee
                first_name = employee.firstName
                last_name = employee.lastName
                full_name = f"{employee.firstName} {employee.lastName}"
                employee_id = employee.id  # Use numeric ID instead of employeeId string
                
                profile_data['employee'] = {
                    'id': employee.id,
                    'firstName': employee.firstName,
                    'lastName': employee.lastName,
                    'personalEmail': employee.personalEmail,
                    'department': employee.department,
                    'designation': employee.designation,
                    'joiningDate': employee.joiningDate,
                }
        
        return Response({
            'user': user_data,
            'first_name': first_name,
            'last_name': last_name,
            'full_name': full_name,
            'employee_id': employee_id,
            'requires_password_change': requires_password_change,
            'roles': roles,
            'permissions': permissions,
            'profile': profile_data,
        })



class RoleListCreateAPIView(generics.ListCreateAPIView):
    """
    API endpoint to list all roles and create custom roles.
    
    GET /api/roles/ - List all roles with their permissions
    POST /api/roles/ - Create a new custom role
    
    Requires Super Admin permission.
    """
    permission_classes = [IsSuperAdmin]
    queryset = Group.objects.all().prefetch_related('permissions')
    
    def get_serializer_class(self):
        """Return appropriate serializer based on request method."""
        if self.request.method == 'POST':
            return RoleCreateSerializer
        return RoleSerializer
    
    def perform_create(self, serializer):
        """Create a new role and log the action."""
        from .utils import audit_log
        
        role = serializer.save()
        
        # Get permissions for the new role
        permissions = list(role.permissions.values_list('codename', flat=True))
        
        # Create audit log entry with before/after states
        audit_log(
            action='PERMISSION_CHANGED',
            actor=self.request.user,
            request=self.request,
            target_user=None,
            resource_type='Role',
            resource_id=role.id,
            details={
                'action_type': 'role_created',
                'role_name': role.name,
                'permissions': permissions
            },
            before_state={
                'role_exists': False
            },
            after_state={
                'role_exists': True,
                'role_name': role.name,
                'permissions_count': len(permissions)
            }
        )


class RoleAssignmentAPIView(APIView):
    """
    API endpoint to assign a role to a user.
    
    POST /api/users/{user_id}/assign-role/
    
    Requires Super Admin permission.
    """
    permission_classes = [IsSuperAdmin]
    
    def post(self, request, user_id):
        """Assign a role to a user."""
        from .utils import audit_log
        
        # Get the target user
        user = get_object_or_404(User, id=user_id)
        
        # Validate request data
        serializer = RoleAssignmentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        role_id = serializer.validated_data['role_id']
        expires_at = serializer.validated_data.get('expires_at')
        notes = serializer.validated_data.get('notes', '')
        
        # Get the role
        role = get_object_or_404(Group, id=role_id)
        
        # Check if user already has this role
        if user.groups.filter(id=role_id).exists():
            return Response(
                {'detail': f'User already has the role "{role.name}".'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Capture before state
        before_roles = list(user.groups.values_list('name', flat=True))
        before_permissions = list(user.get_all_permissions())
        
        # Add user to the role group
        user.groups.add(role)
        
        # Capture after state
        after_roles = list(user.groups.values_list('name', flat=True))
        after_permissions = list(user.get_all_permissions())
        
        # Create RoleAssignment record
        role_assignment = RoleAssignment.objects.create(
            user=user,
            role=role,
            assigned_by=request.user,
            expires_at=expires_at,
            is_active=True,
            notes=notes
        )
        
        # Create audit log entry with before/after states
        audit_log(
            action='ROLE_ASSIGNED',
            actor=request.user,
            request=request,
            target_user=user,
            resource_type='Role',
            resource_id=role.id,
            details={
                'role_name': role.name,
                'expires_at': expires_at.isoformat() if expires_at else None,
                'notes': notes,
                'is_temporary': expires_at is not None,
                'assigned_by': request.user.username
            },
            before_state={
                'roles': before_roles,
                'permissions_count': len(before_permissions)
            },
            after_state={
                'roles': after_roles,
                'permissions_count': len(after_permissions)
            }
        )
        
        # Return the created role assignment
        response_serializer = RoleAssignmentSerializer(role_assignment)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class RoleRevocationAPIView(APIView):
    """
    API endpoint to revoke a role from a user.
    
    POST /api/users/{user_id}/revoke-role/
    
    Requires Super Admin permission.
    """
    permission_classes = [IsSuperAdmin]
    
    def post(self, request, user_id):
        """Revoke a role from a user."""
        from .utils import audit_log
        
        # Get the target user
        user = get_object_or_404(User, id=user_id)
        
        # Validate request data
        serializer = RoleRevocationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        role_id = serializer.validated_data['role_id']
        
        # Get the role
        role = get_object_or_404(Group, id=role_id)
        
        # Check if user has this role
        if not user.groups.filter(id=role_id).exists():
            return Response(
                {'detail': f'User does not have the role "{role.name}".'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Capture before state
        before_roles = list(user.groups.values_list('name', flat=True))
        before_permissions = list(user.get_all_permissions())
        
        # Remove user from the role group
        user.groups.remove(role)
        
        # Capture after state
        after_roles = list(user.groups.values_list('name', flat=True))
        after_permissions = list(user.get_all_permissions())
        
        # Update RoleAssignment records to set is_active to False
        RoleAssignment.objects.filter(
            user=user,
            role=role,
            is_active=True
        ).update(is_active=False)
        
        # Create audit log entry with before/after states
        audit_log(
            action='ROLE_REVOKED',
            actor=request.user,
            request=request,
            target_user=user,
            resource_type='Role',
            resource_id=role.id,
            details={
                'role_name': role.name,
                'revoked_by': request.user.username
            },
            before_state={
                'roles': before_roles,
                'permissions_count': len(before_permissions)
            },
            after_state={
                'roles': after_roles,
                'permissions_count': len(after_permissions)
            }
        )
        
        return Response(
            {'detail': f'Role "{role.name}" has been revoked from user "{user.username}".'},
            status=status.HTTP_200_OK
        )


class UserListAPIView(generics.ListAPIView):
    """
    API endpoint to list all users with their roles.
    
    GET /api/users/
    
    Requires Super Admin permission.
    """
    permission_classes = [IsSuperAdmin]
    serializer_class = UserRoleSerializer
    queryset = User.objects.all().prefetch_related('groups', 'role_assignments')


class UserRolesListAPIView(generics.RetrieveAPIView):
    """
    API endpoint to list all roles assigned to a user.
    
    GET /api/users/{user_id}/roles/
    
    Returns all active RoleAssignments for the user with expiration info.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserRoleSerializer
    queryset = User.objects.all()
    lookup_field = 'id'
    lookup_url_kwarg = 'user_id'
    
    def retrieve(self, request, *args, **kwargs):
        """Get user with their role assignments."""
        user = self.get_object()
        
        # Check if requesting user can view this information
        # Users can view their own roles, Super Admins can view anyone's roles
        if request.user.id != user.id:
            # Check if requesting user is Super Admin
            if not request.user.groups.filter(name='Super Admin').exists():
                return Response(
                    {'detail': 'You do not have permission to view this user\'s roles.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        serializer = self.get_serializer(user)
        return Response(serializer.data)


class FirstTimePasswordChangeView(APIView):
    """
    API endpoint for first-time password change.
    
    POST /api/auth/first-login-password-change/
    
    Requires authentication. Users can only change their own password.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Handle first-time password change."""
        import re
        from django.contrib.auth import authenticate
        
        # Get data from request
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        
        # Validate required fields
        if not old_password or not new_password:
            return Response(
                {'detail': 'Both old_password and new_password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate old password matches current password
        user = authenticate(username=request.user.username, password=old_password)
        if user is None:
            return Response(
                {'detail': 'Old password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate new password meets security requirements
        # Minimum 8 characters
        if len(new_password) < 8:
            return Response(
                {'detail': 'New password must be at least 8 characters long.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Must contain letters and numbers
        has_letter = bool(re.search(r'[a-zA-Z]', new_password))
        has_number = bool(re.search(r'\d', new_password))
        
        if not has_letter or not has_number:
            return Response(
                {'detail': 'New password must contain both letters and numbers.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update user password
        request.user.set_password(new_password)
        request.user.save()
        
        # Update password_changed flag in UserProfile
        if hasattr(request.user, 'profile'):
            profile = request.user.profile
            profile.password_changed = True
            profile.save()
        
        return Response(
            {'message': 'Password changed successfully.'},
            status=status.HTTP_200_OK
        )


class AuditLogListAPIView(generics.ListAPIView):
    """
    API endpoint to list and filter audit logs.
    
    GET /api/audit-logs/
    
    Query parameters:
    - action: Filter by action type (ROLE_ASSIGNED, ROLE_REVOKED, PERMISSION_CHANGED, ACCESS_DENIED)
    - start_date: Filter logs from this date (ISO format)
    - end_date: Filter logs until this date (ISO format)
    - user_id: Filter by actor user ID
    - target_user_id: Filter by target user ID
    - resource_type: Filter by resource type
    - export: Set to 'csv' to export as CSV
    
    Requires Super Admin permission.
    """
    permission_classes = [IsSuperAdmin]
    serializer_class = None  # Will be set in get_serializer_class
    queryset = AuditLog.objects.all().select_related('actor', 'target_user')
    
    def get_serializer_class(self):
        """Return the serializer class."""
        from .serializers import AuditLogSerializer
        return AuditLogSerializer
    
    def get_queryset(self):
        """
        Filter queryset based on query parameters.
        """
        queryset = super().get_queryset()
        
        # Filter by action
        action = self.request.query_params.get('action')
        if action:
            queryset = queryset.filter(action=action)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        if start_date:
            queryset = queryset.filter(timestamp__gte=start_date)
        
        end_date = self.request.query_params.get('end_date')
        if end_date:
            queryset = queryset.filter(timestamp__lte=end_date)
        
        # Filter by actor user ID
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(actor_id=user_id)
        
        # Filter by target user ID
        target_user_id = self.request.query_params.get('target_user_id')
        if target_user_id:
            queryset = queryset.filter(target_user_id=target_user_id)
        
        # Filter by resource type
        resource_type = self.request.query_params.get('resource_type')
        if resource_type:
            queryset = queryset.filter(resource_type=resource_type)
        
        return queryset.order_by('-timestamp')
    
    def list(self, request, *args, **kwargs):
        """
        List audit logs or export as CSV.
        """
        # Check if export is requested
        export_format = request.query_params.get('export')
        if export_format == 'csv':
            return self.export_csv()
        
        # Standard list response with pagination
        return super().list(request, *args, **kwargs)
    
    def export_csv(self):
        """
        Export audit logs as CSV file.
        """
        import csv
        from django.http import HttpResponse
        from datetime import datetime
        
        # Get filtered queryset
        queryset = self.get_queryset()
        
        # Create CSV response
        response = HttpResponse(content_type='text/csv')
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        response['Content-Disposition'] = f'attachment; filename="audit_logs_{timestamp}.csv"'
        
        # Create CSV writer
        writer = csv.writer(response)
        
        # Write header row
        writer.writerow([
            'ID',
            'Timestamp',
            'Action',
            'Actor',
            'Actor ID',
            'Target User',
            'Target User ID',
            'Resource Type',
            'Resource ID',
            'IP Address',
            'Details'
        ])
        
        # Write data rows
        for log in queryset:
            writer.writerow([
                log.id,
                log.timestamp.isoformat(),
                log.get_action_display(),
                log.actor.username if log.actor else 'N/A',
                log.actor.id if log.actor else 'N/A',
                log.target_user.username if log.target_user else 'N/A',
                log.target_user.id if log.target_user else 'N/A',
                log.resource_type,
                log.resource_id if log.resource_id else 'N/A',
                log.ip_address if log.ip_address else 'N/A',
                str(log.details)
            ])
        
        return response



class UserPreferencesAPIView(APIView):
    """
    API endpoint to get and update user preferences.
    
    GET /api/auth/preferences/ - Get current user's preferences
    PATCH /api/auth/preferences/ - Update current user's preferences
    
    Requires authentication. Users can only access their own preferences.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get current user's preferences."""
        # Get or create preferences for the user
        preferences, created = UserPreferences.objects.get_or_create(
            user=request.user
        )
        
        serializer = UserPreferencesSerializer(preferences)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def patch(self, request):
        """Update current user's preferences."""
        # Get or create preferences for the user
        preferences, created = UserPreferences.objects.get_or_create(
            user=request.user
        )
        
        # Update preferences with partial data
        serializer = UserPreferencesSerializer(
            preferences,
            data=request.data,
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
