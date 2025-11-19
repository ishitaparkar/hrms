"""
Decorators for permission checking and audit logging.

This module provides decorators that can be applied to view functions
to enforce permission checks and log access attempts.
"""
from functools import wraps
from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework import status
from .models import AuditLog
from .permissions import get_client_ip, has_role, has_permission, get_user_role_names


def audit_permission_check(resource_type, action='ACCESS'):
    """
    Decorator to audit permission checks and denials.
    
    This decorator logs all permission check attempts, including both
    successful access and denied access.
    
    Args:
        resource_type (str): Type of resource being accessed
        action (str): Action being performed (default: 'ACCESS')
        
    Usage:
        @audit_permission_check('Employee', 'VIEW')
        def my_view(request):
            # view logic
            pass
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Execute the view function
            response = view_func(request, *args, **kwargs)
            
            # Check if access was denied (403 status)
            is_denied = False
            if isinstance(response, Response):
                is_denied = response.status_code == status.HTTP_403_FORBIDDEN
            elif isinstance(response, JsonResponse):
                is_denied = response.status_code == 403
            elif hasattr(response, 'status_code'):
                is_denied = response.status_code == 403
            
            # Log if access was denied
            if is_denied:
                details = {
                    'action': action,
                    'user_roles': get_user_role_names(request.user) if request.user.is_authenticated else [],
                    'path': request.path,
                    'method': request.method
                }
                
                # Extract resource_id from kwargs if available
                resource_id = kwargs.get('pk') or kwargs.get('id')
                
                AuditLog.objects.create(
                    action='ACCESS_DENIED',
                    actor=request.user if request.user.is_authenticated else None,
                    target_user=None,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    details=details,
                    ip_address=get_client_ip(request)
                )
            
            return response
        
        return wrapper
    return decorator


def require_role(*role_names):
    """
    Decorator to require specific roles for accessing a view.
    
    Args:
        *role_names: Variable number of role names that are allowed
        
    Usage:
        @require_role('HR Manager', 'Super Admin')
        def my_view(request):
            # view logic
            pass
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user or not request.user.is_authenticated:
                return JsonResponse(
                    {'detail': 'Authentication credentials were not provided.'},
                    status=401
                )
            
            # Check if user has any of the required roles
            user_roles = get_user_role_names(request.user)
            has_required_role = any(role in user_roles for role in role_names)
            
            if not has_required_role:
                # Log access denial
                AuditLog.objects.create(
                    action='ACCESS_DENIED',
                    actor=request.user,
                    target_user=None,
                    resource_type=view_func.__name__,
                    resource_id=None,
                    details={
                        'required_roles': list(role_names),
                        'user_roles': user_roles,
                        'path': request.path,
                        'method': request.method
                    },
                    ip_address=get_client_ip(request)
                )
                
                return JsonResponse(
                    {
                        'detail': 'You do not have permission to perform this action.',
                        'required_roles': list(role_names)
                    },
                    status=403
                )
            
            return view_func(request, *args, **kwargs)
        
        return wrapper
    return decorator


def require_permission(*permission_codenames):
    """
    Decorator to require specific permissions for accessing a view.
    
    Args:
        *permission_codenames: Variable number of permission codenames required
        
    Usage:
        @require_permission('view_all_employees', 'manage_employees')
        def my_view(request):
            # view logic
            pass
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user or not request.user.is_authenticated:
                return JsonResponse(
                    {'detail': 'Authentication credentials were not provided.'},
                    status=401
                )
            
            # Check if user has all required permissions
            missing_permissions = []
            for perm in permission_codenames:
                if not has_permission(request.user, perm):
                    missing_permissions.append(perm)
            
            if missing_permissions:
                # Log access denial
                AuditLog.objects.create(
                    action='ACCESS_DENIED',
                    actor=request.user,
                    target_user=None,
                    resource_type=view_func.__name__,
                    resource_id=None,
                    details={
                        'required_permissions': list(permission_codenames),
                        'missing_permissions': missing_permissions,
                        'user_roles': get_user_role_names(request.user),
                        'path': request.path,
                        'method': request.method
                    },
                    ip_address=get_client_ip(request)
                )
                
                return JsonResponse(
                    {
                        'detail': 'You do not have permission to perform this action.',
                        'required_permissions': list(permission_codenames),
                        'missing_permissions': missing_permissions
                    },
                    status=403
                )
            
            return view_func(request, *args, **kwargs)
        
        return wrapper
    return decorator


def log_audit(action, resource_type):
    """
    Decorator to automatically log actions in the audit log.
    
    This decorator logs successful actions (not denials).
    
    Args:
        action (str): Action being performed (e.g., 'ROLE_ASSIGNED', 'PERMISSION_CHANGED')
        resource_type (str): Type of resource being modified
        
    Usage:
        @log_audit('ROLE_ASSIGNED', 'User')
        def assign_role_view(request, user_id):
            # view logic
            pass
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Execute the view function
            response = view_func(request, *args, **kwargs)
            
            # Only log if the action was successful (2xx status code)
            is_success = False
            if isinstance(response, Response):
                is_success = 200 <= response.status_code < 300
            elif isinstance(response, JsonResponse):
                is_success = 200 <= response.status_code < 300
            elif hasattr(response, 'status_code'):
                is_success = 200 <= response.status_code < 300
            
            if is_success and request.user.is_authenticated:
                # Extract resource_id from kwargs if available
                resource_id = kwargs.get('pk') or kwargs.get('id') or kwargs.get('user_id')
                
                # Extract target_user if available
                target_user_id = kwargs.get('user_id')
                target_user = None
                if target_user_id:
                    from django.contrib.auth.models import User
                    try:
                        target_user = User.objects.get(id=target_user_id)
                    except User.DoesNotExist:
                        pass
                
                details = {
                    'path': request.path,
                    'method': request.method,
                    'user_roles': get_user_role_names(request.user)
                }
                
                AuditLog.objects.create(
                    action=action,
                    actor=request.user,
                    target_user=target_user,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    details=details,
                    ip_address=get_client_ip(request)
                )
            
            return response
        
        return wrapper
    return decorator
