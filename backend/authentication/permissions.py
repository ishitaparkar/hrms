"""
Permission classes and utilities for Role-Based Access Control (RBAC).

This module provides DRF permission classes and utility functions for checking
user roles, permissions, and department scope validation.
"""
from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied
from django.contrib.auth.models import User
from .models import AuditLog
from .utils import (
    user_has_role,
    user_has_any_role,
    get_user_role_names,
    ROLE_SUPER_ADMIN,
    ROLE_HR_MANAGER,
    ROLE_EMPLOYEE
)


def get_client_ip(request):
    """
    Extract client IP address from request.
    
    Args:
        request: Django/DRF request object
        
    Returns:
        str: IP address of the client
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def has_role(user, role_name):
    """
    Check if a user has a specific role.
    
    Args:
        user (User): The user to check
        role_name (str): Name of the role to check for
        
    Returns:
        bool: True if user has the role, False otherwise
    """
    if not user or not user.is_authenticated:
        return False
    return user_has_role(user, role_name)


def has_permission(user, permission_codename):
    """
    Check if a user has a specific permission.
    
    Args:
        user (User): The user to check
        permission_codename (str): Codename of the permission (e.g., 'view_all_employees')
        
    Returns:
        bool: True if user has the permission, False otherwise
    """
    if not user or not user.is_authenticated:
        return False
    
    # Check if user has the permission directly or through their groups
    return user.has_perm(f'employee_management.{permission_codename}') or \
           user.has_perm(f'leave_management.{permission_codename}') or \
           user.has_perm(f'authentication.{permission_codename}')


def get_user_department(user):
    """
    Get the department of a user from their profile.
    
    Args:
        user (User): The user to get department for
        
    Returns:
        str or None: Department name if profile exists, None otherwise
    """
    if not user or not user.is_authenticated:
        return None
    
    if hasattr(user, 'profile') and user.profile:
        return user.profile.department
    
    return None


def validate_department_scope(user, obj):
    """
    Validate if a user can access an object based on department scope.
    Used primarily for Department Head role validation.
    
    Args:
        user (User): The user requesting access
        obj: The object being accessed (must have a 'department' attribute or related employee)
        
    Returns:
        bool: True if user can access the object within their department scope
    """
    if not user or not user.is_authenticated:
        return False
    
    user_department = get_user_department(user)
    if not user_department:
        return False
    
    # Check if object has a department attribute directly
    if hasattr(obj, 'department'):
        return obj.department == user_department
    
    # Check if object has an employee relationship with department
    if hasattr(obj, 'employee') and hasattr(obj.employee, 'department'):
        return obj.employee.department == user_department
    
    return False


def log_access_denied(request, resource_type, resource_id=None, required_permission=None, details=None):
    """
    Create an audit log entry for access denied events.
    
    Args:
        request: Django/DRF request object
        resource_type (str): Type of resource being accessed
        resource_id (int, optional): ID of the specific resource
        required_permission (str, optional): Permission that was required
        details (dict, optional): Additional details to log
    """
    from .utils import audit_log
    
    if not details:
        details = {}
    
    if required_permission:
        details['required_permission'] = required_permission
    
    # Add user roles and request method to details
    details['user_roles'] = get_user_role_names(request.user) if request.user.is_authenticated else []
    details['request_method'] = request.method
    details['request_path'] = request.path
    
    # Create audit log entry
    audit_log(
        action='ACCESS_DENIED',
        actor=request.user if request.user.is_authenticated else None,
        request=request,
        target_user=None,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details
    )


class BaseRolePermission(permissions.BasePermission):
    """
    Base permission class for role-based access control.
    
    Subclasses should define:
        - required_roles: List of role names that are allowed
        - required_permissions: List of permission codenames that are required
    """
    required_roles = []
    required_permissions = []
    
    def has_permission(self, request, view):
        """
        Check if the user has the required roles and permissions.
        
        Args:
            request: DRF request object
            view: DRF view object
            
        Returns:
            bool: True if user has required roles/permissions, False otherwise
        """
        # Check authentication
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check required roles
        if self.required_roles:
            if not user_has_any_role(request.user, self.required_roles):
                log_access_denied(
                    request,
                    resource_type=view.__class__.__name__,
                    required_permission=f"role:{','.join(self.required_roles)}",
                    details={'required_roles': self.required_roles}
                )
                return False
        
        # Check required permissions
        if self.required_permissions:
            for perm in self.required_permissions:
                if not has_permission(request.user, perm):
                    log_access_denied(
                        request,
                        resource_type=view.__class__.__name__,
                        required_permission=perm,
                        details={'required_permissions': self.required_permissions}
                    )
                    return False
        
        return True
    
    def has_object_permission(self, request, view, obj):
        """
        Check if the user has permission to access a specific object.
        
        Default implementation allows access if has_permission passes.
        Subclasses should override for object-level permissions.
        
        Args:
            request: DRF request object
            view: DRF view object
            obj: The object being accessed
            
        Returns:
            bool: True if user can access the object, False otherwise
        """
        return self.has_permission(request, view)


class IsAuthenticated(BaseRolePermission):
    """
    Permission class that allows access to any authenticated user.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated


class IsEmployee(BaseRolePermission):
    """
    Permission class for Employee role.
    Allows access only to user's own data.
    """
    required_roles = [ROLE_EMPLOYEE, ROLE_HR_MANAGER, ROLE_SUPER_ADMIN]
    
    def has_object_permission(self, request, view, obj):
        """
        Allow access only if the object belongs to the requesting user.
        """
        if not super().has_permission(request, view):
            return False
        
        # For Employee objects, check if it's the user's own employee record
        if obj.__class__.__name__ == 'Employee':
            if hasattr(request.user, 'profile') and request.user.profile.employee:
                if obj.id == request.user.profile.employee.id:
                    return True
        
        # For objects with employee relationship (like LeaveRequest)
        if hasattr(obj, 'employee'):
            if hasattr(request.user, 'profile') and request.user.profile.employee:
                if obj.employee.id == request.user.profile.employee.id:
                    return True
        
        # Log access denial
        log_access_denied(
            request,
            resource_type=obj.__class__.__name__,
            resource_id=obj.id if hasattr(obj, 'id') else None,
            details={'reason': 'Not own data'}
        )
        
        return False


class IsDepartmentHead(BaseRolePermission):
    """
    Permission class for Department Head role.
    Allows access to department-scoped data.
    """
    required_roles = [ROLE_HR_MANAGER, ROLE_SUPER_ADMIN]
    
    def has_object_permission(self, request, view, obj):
        """
        Allow access if the object is within the user's department scope.
        """
        if not super().has_permission(request, view):
            return False
        
        # HR Manager and Super Admin have access to all departments
        if user_has_any_role(request.user, [ROLE_HR_MANAGER, ROLE_SUPER_ADMIN]):
            return True
        
        # Department Head role removed - only HR Manager and Super Admin have department access
            
            # Log access denial with department info
            user_dept = get_user_department(request.user)
            obj_dept = getattr(obj, 'department', None) or \
                      (getattr(obj.employee, 'department', None) if hasattr(obj, 'employee') else None)
            
            log_access_denied(
                request,
                resource_type=obj.__class__.__name__,
                resource_id=obj.id if hasattr(obj, 'id') else None,
                details={
                    'reason': 'Outside department scope',
                    'user_department': user_dept,
                    'object_department': obj_dept
                }
            )
            return False
        
        return False


class IsHRManager(BaseRolePermission):
    """
    Permission class for HR Manager role.
    Allows access to all employee, leave, payroll, and attendance resources.
    """
    required_roles = [ROLE_HR_MANAGER, ROLE_SUPER_ADMIN]


class IsSuperAdmin(BaseRolePermission):
    """
    Permission class for Super Admin role.
    Allows full system access including role management and audit logs.
    """
    required_roles = [ROLE_SUPER_ADMIN]
