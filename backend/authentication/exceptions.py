"""
Custom exception handlers for RBAC authorization failures.

This module provides custom exception handling for 403 Forbidden responses,
adding structured error messages with permission and department scope information.
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from .permissions import get_user_department, get_user_role_names


def custom_exception_handler(exc, context):
    """
    Custom exception handler for DRF that enhances 403 Forbidden responses
    with detailed permission and department scope information.
    
    Args:
        exc: The exception that was raised
        context: Dictionary containing request, view, args, and kwargs
        
    Returns:
        Response: Enhanced error response with additional context
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    # If this is a 403 Forbidden response, enhance it with additional information
    if response is not None and response.status_code == status.HTTP_403_FORBIDDEN:
        request = context.get('request')
        view = context.get('view')
        
        # Build enhanced error response
        error_data = {
            'detail': str(response.data.get('detail', 'You do not have permission to perform this action.')),
            'status_code': 403,
            'error_type': 'PermissionDenied'
        }
        
        # Add user role information if authenticated
        if request and request.user and request.user.is_authenticated:
            error_data['user_roles'] = get_user_role_names(request.user)
            
            # Add department information if available
            user_department = get_user_department(request.user)
            if user_department:
                error_data['user_department'] = user_department
        
        # Try to extract required permission from the exception or view
        required_permission = None
        required_roles = None
        
        # Check if the view has permission classes with required roles/permissions
        if view and hasattr(view, 'permission_classes'):
            for permission_class in view.permission_classes:
                if hasattr(permission_class, 'required_roles') and permission_class.required_roles:
                    required_roles = permission_class.required_roles
                if hasattr(permission_class, 'required_permissions') and permission_class.required_permissions:
                    required_permission = permission_class.required_permissions
        
        # Add required permission/role information
        if required_permission:
            error_data['required_permissions'] = required_permission if isinstance(required_permission, list) else [required_permission]
        
        if required_roles:
            error_data['required_roles'] = required_roles if isinstance(required_roles, list) else [required_roles]
        
        # Add helpful message based on the type of permission failure
        error_data['message'] = _generate_user_friendly_message(error_data)
        
        response.data = error_data
    
    return response


def _generate_user_friendly_message(error_data):
    """
    Generate a user-friendly message explaining why access was denied.
    
    Args:
        error_data (dict): Dictionary containing error information
        
    Returns:
        str: User-friendly error message
    """
    user_roles = error_data.get('user_roles', [])
    required_roles = error_data.get('required_roles', [])
    required_permissions = error_data.get('required_permissions', [])
    user_department = error_data.get('user_department')
    
    # Role-based denial
    if required_roles and user_roles:
        if len(required_roles) == 1:
            return f"This action requires the '{required_roles[0]}' role. Your current role(s): {', '.join(user_roles)}."
        else:
            return f"This action requires one of the following roles: {', '.join(required_roles)}. Your current role(s): {', '.join(user_roles)}."
    
    # Permission-based denial
    if required_permissions:
        if len(required_permissions) == 1:
            return f"You do not have the required permission: '{required_permissions[0]}'."
        else:
            return f"You do not have one or more required permissions: {', '.join(required_permissions)}."
    
    # Department scope denial
    if user_department and 'Department Head' in user_roles:
        return f"You can only access resources within your department ({user_department}). This resource belongs to a different department."
    
    # Generic denial
    if user_roles:
        return f"Your current role(s) ({', '.join(user_roles)}) do not have permission to perform this action."
    
    return "You do not have permission to perform this action. Please contact your administrator if you believe this is an error."


class PermissionDeniedException(Exception):
    """
    Custom exception for permission denied scenarios with enhanced context.
    """
    def __init__(self, message, required_permission=None, required_roles=None, department_scope=None):
        self.message = message
        self.required_permission = required_permission
        self.required_roles = required_roles
        self.department_scope = department_scope
        super().__init__(self.message)
