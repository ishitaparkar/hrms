from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status, generics
from django.contrib.auth.models import User, Group
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.conf import settings
from django.db import transaction
from .models import RoleAssignment, AuditLog, UserPreferences, AccountSetupToken, UserProfile
from .serializers import (
    RoleSerializer, RoleCreateSerializer, RoleAssignmentSerializer,
    RoleAssignmentCreateSerializer, RoleRevocationSerializer,
    UserRoleSerializer, UserPreferencesSerializer, PhoneAuthenticationSerializer
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


class PhoneAuthenticationView(APIView):
    """
    API endpoint for phone-based authentication during employee onboarding.
    
    POST /api/auth/verify-phone/
    
    This endpoint verifies an employee's identity using their email and phone number.
    On successful verification, it returns an authentication token for the account setup flow.
    
    Rate limiting: Maximum 3 failed attempts per hour per email address.
    After 3 failed attempts, the account is temporarily locked.
    """
    permission_classes = []  # No authentication required for this endpoint
    throttle_scope = 'phone_auth'
    
    def post(self, request):
        """
        Verify phone number and return authentication token.
        
        Request body:
        {
            "email": "employee@example.com",
            "phone_number": "+919876543210"
        }
        
        Response (success):
        {
            "success": true,
            "auth_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
            "employee": {
                "first_name": "John",
                "last_name": "Doe",
                "email": "john.doe@example.com",
                "department": "Engineering"
            }
        }
        
        Response (failure):
        {
            "success": false,
            "error": "Phone number does not match our records",
            "attempts_remaining": 2
        }
        """
        from .services import PhoneAuthenticationService
        
        # Validate request data
        serializer = PhoneAuthenticationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {
                    'success': False,
                    'error': 'Invalid request data',
                    'errors': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        email = serializer.validated_data['email']
        phone_number = serializer.validated_data['phone_number']
        
        # Verify phone number
        success, employee, error_message = PhoneAuthenticationService.verify_phone_number(
            email=email,
            phone_number=phone_number,
            request=request
        )
        
        if not success:
            # Get remaining attempts
            failed_count = PhoneAuthenticationService.increment_failed_attempts(email)
            attempts_remaining = max(0, PhoneAuthenticationService.MAX_FAILED_ATTEMPTS - failed_count)
            
            return Response(
                {
                    'success': False,
                    'error': error_message,
                    'attempts_remaining': attempts_remaining
                },
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Generate authentication token
        auth_token = PhoneAuthenticationService.generate_auth_token(employee)
        
        # Return success response with token and employee details
        return Response(
            {
                'success': True,
                'auth_token': auth_token,
                'employee': {
                    'first_name': employee.firstName,
                    'last_name': employee.lastName,
                    'email': employee.personalEmail,
                    'department': employee.department,
                    'designation': employee.designation
                }
            },
            status=status.HTTP_200_OK
        )


class UsernameGenerationView(APIView):
    """
    API endpoint for generating username during employee onboarding.
    
    POST /api/auth/generate-username/
    
    This endpoint generates a unique username from the employee's name
    and returns employee details for verification.
    
    Requires JWT token authentication from phone verification step.
    """
    permission_classes = []  # Custom JWT authentication
    
    def post(self, request):
        """
        Generate username and return employee details.
        
        Headers:
            Authorization: Bearer <jwt_token>
        
        Response (success):
        {
            "username": "john.doe",
            "employee_details": {
                "first_name": "John",
                "last_name": "Doe",
                "email": "john.doe@example.com",
                "department": "Engineering",
                "designation": "Software Engineer"
            }
        }
        
        Response (error):
        {
            "error": "Invalid or expired token"
        }
        """
        import jwt
        from employee_management.models import Employee
        from .services import UsernameGenerationService
        
        # Extract JWT token from Authorization header
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return Response(
                {'error': 'Authorization header missing or invalid'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        token = auth_header.split(' ')[1]
        
        # Verify and decode JWT token
        try:
            secret_key = getattr(settings, 'SECRET_KEY')
            payload = jwt.decode(token, secret_key, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return Response(
                {'error': 'Token has expired'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except jwt.InvalidTokenError:
            return Response(
                {'error': 'Invalid token'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Extract employee ID from token
        employee_id = payload.get('employee_id')
        if not employee_id:
            return Response(
                {'error': 'Invalid token payload'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Get employee from database
        try:
            employee = Employee.objects.get(id=employee_id)
        except Employee.DoesNotExist:
            return Response(
                {'error': 'Employee not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Generate username
        username = UsernameGenerationService.generate_username(
            employee.firstName,
            employee.lastName
        )
        
        # Return username and employee details
        return Response(
            {
                'username': username,
                'employee_details': {
                    'first_name': employee.firstName,
                    'last_name': employee.lastName,
                    'email': employee.personalEmail,
                    'department': employee.department,
                    'designation': employee.designation
                }
            },
            status=status.HTTP_200_OK
        )


class AccountSetupView(APIView):
    """
    API endpoint for completing account setup during employee onboarding.
    
    POST /api/auth/complete-setup/
    
    This endpoint completes the account activation process by:
    1. Validating the username and password
    2. Creating the User account with hashed password
    3. Updating the password_changed flag
    4. Creating an authenticated session
    5. Marking the setup token as used
    6. Creating audit log entries
    
    Requires JWT token authentication from phone verification step.
    """
    permission_classes = []  # Custom JWT authentication
    
    def post(self, request):
        """
        Complete account setup with username and password.
        
        Headers:
            Authorization: Bearer <jwt_token>
        
        Request body:
        {
            "username": "john.doe",
            "password": "SecureP@ss123",
            "confirm_password": "SecureP@ss123"
        }
        
        Response (success):
        {
            "success": true,
            "message": "Account activated successfully",
            "user": {
                "id": 123,
                "username": "john.doe",
                "email": "john.doe@example.com",
                "full_name": "John Doe"
            },
            "token": "a1b2c3d4e5f6..."
        }
        
        Response (validation error):
        {
            "success": false,
            "errors": {
                "password": [
                    "Password must contain at least one uppercase letter"
                ]
            }
        }
        """
        import jwt
        from employee_management.models import Employee
        from .services import PasswordValidationService
        from .utils import audit_log
        from rest_framework.authtoken.models import Token
        
        # Extract JWT token from Authorization header
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return Response(
                {
                    'success': False,
                    'error': 'Authorization header missing or invalid'
                },
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        token_string = auth_header.split(' ')[1]
        
        # Verify and decode JWT token
        try:
            secret_key = getattr(settings, 'SECRET_KEY')
            payload = jwt.decode(token_string, secret_key, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return Response(
                {
                    'success': False,
                    'error': 'Token has expired'
                },
                status=status.HTTP_401_UNAUTHORIZED
            )
        except jwt.InvalidTokenError:
            return Response(
                {
                    'success': False,
                    'error': 'Invalid token'
                },
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Extract employee ID and token ID from token
        employee_id = payload.get('employee_id')
        token_id = payload.get('token_id')
        
        if not employee_id or not token_id:
            return Response(
                {
                    'success': False,
                    'error': 'Invalid token payload'
                },
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Get employee from database
        try:
            employee = Employee.objects.get(id=employee_id)
        except Employee.DoesNotExist:
            return Response(
                {
                    'success': False,
                    'error': 'Employee not found'
                },
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verify setup token exists and is not used
        try:
            setup_token = AccountSetupToken.objects.get(id=token_id, employee=employee)
            if setup_token.used:
                return Response(
                    {
                        'success': False,
                        'error': 'Setup token has already been used'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            if setup_token.expires_at < timezone.now():
                return Response(
                    {
                        'success': False,
                        'error': 'Setup token has expired'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        except AccountSetupToken.DoesNotExist:
            return Response(
                {
                    'success': False,
                    'error': 'Invalid setup token'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get request data
        username = request.data.get('username')
        password = request.data.get('password')
        confirm_password = request.data.get('confirm_password')
        
        # Validate required fields
        if not username or not password or not confirm_password:
            return Response(
                {
                    'success': False,
                    'errors': {
                        'general': ['Username, password, and confirm_password are required']
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate passwords match
        if password != confirm_password:
            return Response(
                {
                    'success': False,
                    'errors': {
                        'confirm_password': ['Passwords do not match']
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate password strength
        is_valid, password_errors = PasswordValidationService.validate_password_strength(password)
        if not is_valid:
            return Response(
                {
                    'success': False,
                    'errors': {
                        'password': password_errors
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if username already exists
        if User.objects.filter(username=username).exists():
            return Response(
                {
                    'success': False,
                    'errors': {
                        'username': ['Username already exists']
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create User account with hashed password
        try:
            with transaction.atomic():
                # Create user
                user = User.objects.create_user(
                    username=username,
                    email=employee.personalEmail,
                    first_name=employee.firstName,
                    last_name=employee.lastName,
                    password=password  # Django automatically hashes this
                )
                
                # Create or update UserProfile
                user_profile, _ = UserProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'employee': employee,
                        'department': employee.department,
                        'password_changed': True  # Mark as activated
                    }
                )
                
                # If profile already existed, update it
                if not _:
                    user_profile.employee = employee
                    user_profile.department = employee.department
                    user_profile.password_changed = True
                    user_profile.save()
                
                # Assign default Employee role
                from .utils import ensure_role_exists, ROLE_EMPLOYEE
                employee_role, role_created = ensure_role_exists(ROLE_EMPLOYEE)
                user.groups.add(employee_role)
                
                # Mark setup token as used
                setup_token.used = True
                setup_token.used_at = timezone.now()
                setup_token.save()
                
                # Create authentication token for automatic login
                auth_token, _ = Token.objects.get_or_create(user=user)
                
                # Create audit log for account activation
                audit_log(
                    action='ROLE_ASSIGNED',
                    actor=None,
                    request=request,
                    target_user=user,
                    resource_type='AccountActivation',
                    resource_id=user.id,
                    details={
                        'action_type': 'account_activation_completed',
                        'employee_id': employee.employeeId,
                        'employee_name': f"{employee.firstName} {employee.lastName}",
                        'username': username,
                        'email': employee.personalEmail,
                    }
                )
                
                # Extract roles and permissions
                roles = [group.name for group in user.groups.all()]
                permissions = list(user.get_all_permissions())
                
                # Return success response with user data, roles, and token
                return Response(
                    {
                        'success': True,
                        'message': 'Account activated successfully',
                        'user': {
                            'id': user.id,
                            'username': user.username,
                            'email': user.email,
                            'full_name': f"{user.first_name} {user.last_name}",
                            'employee_id': employee.id,
                            'department': employee.department
                        },
                        'roles': roles,
                        'permissions': permissions,
                        'token': auth_token.key
                    },
                    status=status.HTTP_201_CREATED
                )
                
        except Exception as e:
            return Response(
                {
                    'success': False,
                    'error': f'Failed to create account: {str(e)}'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ResendWelcomeEmailView(APIView):
    """
    API endpoint for Super Admins to resend welcome email to an employee.
    
    This is useful when:
    - Employee didn't receive the original email
    - Email was accidentally deleted
    - Employee needs to restart the onboarding process
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    
    def post(self, request, employee_id):
        """
        Resend welcome email to the specified employee.
        
        Args:
            employee_id: The ID of the employee to send the email to
            
        Returns:
            Response with success status and message
        """
        from employee_management.models import Employee
        from .services import AccountCreationService
        from .utils import audit_log
        
        try:
            # Get the employee
            employee = get_object_or_404(Employee, id=employee_id)
            
            # Check if employee already has an activated account
            has_activated_account = False
            if hasattr(employee, 'user_profile') and employee.user_profile:
                user_profile = employee.user_profile
                if user_profile.user and user_profile.password_changed:
                    has_activated_account = True
            
            # Send welcome email
            try:
                AccountCreationService.send_welcome_email_only(employee, request)
                
                # Create audit log
                audit_log(
                    action='ROLE_ASSIGNED',
                    actor=request.user,
                    request=request,
                    target_user=None,
                    resource_type='WelcomeEmail',
                    resource_id=employee.id,
                    details={
                        'action_type': 'welcome_email_resent',
                        'employee_id': employee.employeeId,
                        'employee_name': f"{employee.firstName} {employee.lastName}",
                        'email': employee.personalEmail,
                        'resent_by': request.user.username,
                        'has_activated_account': has_activated_account,
                    }
                )
                
                return Response(
                    {
                        'success': True,
                        'message': f'Welcome email sent successfully to {employee.personalEmail}',
                        'employee': {
                            'id': employee.id,
                            'name': f"{employee.firstName} {employee.lastName}",
                            'email': employee.personalEmail,
                            'has_activated_account': has_activated_account
                        }
                    },
                    status=status.HTTP_200_OK
                )
                
            except Exception as email_error:
                # Log the failure
                audit_log(
                    action='ACCESS_DENIED',
                    actor=request.user,
                    request=request,
                    target_user=None,
                    resource_type='WelcomeEmail',
                    resource_id=employee.id,
                    details={
                        'action_type': 'welcome_email_resend_failed',
                        'employee_id': employee.employeeId,
                        'employee_name': f"{employee.firstName} {employee.lastName}",
                        'email': employee.personalEmail,
                        'error': str(email_error),
                        'resent_by': request.user.username,
                    }
                )
                
                return Response(
                    {
                        'success': False,
                        'error': f'Failed to send email: {str(email_error)}'
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            return Response(
                {
                    'success': False,
                    'error': f'Failed to resend welcome email: {str(e)}'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
