"""
Utility functions for role and permission management in the RBAC system.
"""
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from employee_management.models import Employee
from leave_management.models import LeaveRequest


# Predefined role names
ROLE_SUPER_ADMIN = 'Super Admin'
ROLE_HR_MANAGER = 'HR Manager'
ROLE_DEPARTMENT_HEAD = 'Department Head'
ROLE_EMPLOYEE = 'Employee'

# Role hierarchy (higher index = higher privilege)
ROLE_HIERARCHY = [
    ROLE_EMPLOYEE,
    ROLE_DEPARTMENT_HEAD,
    ROLE_HR_MANAGER,
    ROLE_SUPER_ADMIN,
]


def get_role_permissions():
    """
    Returns the permission matrix for all predefined roles.
    
    Returns:
        dict: Dictionary mapping role names to their permission lists
    """
    return {
        ROLE_SUPER_ADMIN: [
            # Employee permissions
            'view_all_employees',
            'view_department_employees',
            'manage_employees',
            'add_employee',
            'change_employee',
            'delete_employee',
            'view_employee',
            # Leave permissions
            'view_all_leaves',
            'view_department_leaves',
            'approve_leaves',
            'manage_own_leaves',
            'add_leaverequest',
            'change_leaverequest',
            'delete_leaverequest',
            'view_leaverequest',
        ],
        ROLE_HR_MANAGER: [
            # Employee permissions
            'view_all_employees',
            'view_department_employees',
            'manage_employees',
            'add_employee',
            'change_employee',
            'delete_employee',
            'view_employee',
            # Leave permissions
            'view_all_leaves',
            'view_department_leaves',
            'approve_leaves',
            'add_leaverequest',
            'change_leaverequest',
            'delete_leaverequest',
            'view_leaverequest',
        ],
        ROLE_DEPARTMENT_HEAD: [
            # Employee permissions
            'view_department_employees',
            'view_employee',
            # Leave permissions
            'view_department_leaves',
            'approve_leaves',
            'view_leaverequest',
            'manage_own_leaves',
            'add_leaverequest',
        ],
        ROLE_EMPLOYEE: [
            # Employee permissions (own data only)
            'view_employee',
            # Leave permissions (own data only)
            'manage_own_leaves',
            'add_leaverequest',
            'view_leaverequest',
        ]
    }


def ensure_role_exists(role_name):
    """
    Check if a role exists and create it if missing.
    
    Args:
        role_name (str): Name of the role to check/create
        
    Returns:
        tuple: (Group object, bool indicating if created)
    """
    role, created = Group.objects.get_or_create(name=role_name)
    
    if created:
        # If role was just created, assign its permissions
        assign_role_permissions(role)
    
    return role, created


def assign_role_permissions(role):
    """
    Assign permissions to a role based on the predefined permission matrix.
    
    Args:
        role (Group): The role (Group) to assign permissions to
        
    Returns:
        int: Number of permissions assigned
    """
    role_permissions = get_role_permissions()
    
    if role.name not in role_permissions:
        return 0
    
    # Clear existing permissions
    role.permissions.clear()
    
    permissions_added = 0
    for perm_codename in role_permissions[role.name]:
        try:
            permission = Permission.objects.get(codename=perm_codename)
            role.permissions.add(permission)
            permissions_added += 1
        except Permission.DoesNotExist:
            pass
    
    return permissions_added


def ensure_all_roles_exist():
    """
    Ensure all predefined roles exist in the system.
    Creates any missing roles with their permissions.
    
    Returns:
        dict: Dictionary with role names as keys and (role, created) tuples as values
    """
    results = {}
    
    for role_name in [ROLE_SUPER_ADMIN, ROLE_HR_MANAGER, ROLE_DEPARTMENT_HEAD, ROLE_EMPLOYEE]:
        role, created = ensure_role_exists(role_name)
        results[role_name] = (role, created)
    
    return results


def get_role_by_name(role_name):
    """
    Get a role by its name.
    
    Args:
        role_name (str): Name of the role
        
    Returns:
        Group or None: The role if it exists, None otherwise
    """
    try:
        return Group.objects.get(name=role_name)
    except Group.DoesNotExist:
        return None


def user_has_role(user, role_name):
    """
    Check if a user has a specific role.
    
    Args:
        user (User): The user to check
        role_name (str): Name of the role to check for
        
    Returns:
        bool: True if user has the role, False otherwise
    """
    if not user or not user.is_authenticated or not user.pk:
        return False
    return user.groups.filter(name=role_name).exists()


def user_has_any_role(user, role_names):
    """
    Check if a user has any of the specified roles.
    
    Args:
        user (User): The user to check
        role_names (list): List of role names to check for
        
    Returns:
        bool: True if user has any of the roles, False otherwise
    """
    if not user or not user.is_authenticated or not user.pk:
        return False
    return user.groups.filter(name__in=role_names).exists()


def get_user_roles(user):
    """
    Get all roles assigned to a user.
    
    Args:
        user (User): The user to get roles for
        
    Returns:
        QuerySet: QuerySet of Group objects (roles)
    """
    return user.groups.all()


def get_user_role_names(user):
    """
    Get names of all roles assigned to a user.
    
    Args:
        user (User): The user to get role names for
        
    Returns:
        list: List of role name strings
    """
    if not user or not user.is_authenticated or not user.pk:
        return []
    return list(user.groups.values_list('name', flat=True))


def get_highest_role(user):
    """
    Get the highest role in the hierarchy that a user has.
    
    Args:
        user (User): The user to check
        
    Returns:
        str or None: Name of the highest role, or None if user has no roles
    """
    user_role_names = get_user_role_names(user)
    
    # Find the highest role in the hierarchy
    for role_name in reversed(ROLE_HIERARCHY):
        if role_name in user_role_names:
            return role_name
    
    return None


def has_role(user, role_name):
    """
    Check if a user has a specific role.
    Alias for user_has_role for consistency with permissions module.
    
    Args:
        user (User): The user to check
        role_name (str): Name of the role to check for
        
    Returns:
        bool: True if user has the role, False otherwise
    """
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
    # Try different app labels where permissions might be defined
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


def audit_log(action, actor, request=None, target_user=None, resource_type=None, 
              resource_id=None, details=None, before_state=None, after_state=None):
    """
    Create an audit log entry for tracking permission and role changes.
    
    This utility function provides a centralized way to create audit logs with
    comprehensive information including before/after states, IP addresses, and
    detailed context.
    
    Args:
        action (str): The action being performed. Must be one of:
                     'ROLE_ASSIGNED', 'ROLE_REVOKED', 'PERMISSION_CHANGED', 'ACCESS_DENIED',
                     'EMPLOYEE_CREATED', 'ACCOUNT_CREATED', 'EMAIL_SENT', 'EMAIL_FAILED',
                     'AUTH_ATTEMPT', 'AUTH_SUCCESS', 'AUTH_FAILED', 'ACCOUNT_ACTIVATED'
        actor (User): The user performing the action (can be None for system actions)
        request (Request, optional): Django/DRF request object for IP extraction
        target_user (User, optional): The user being affected by the action
        resource_type (str, optional): Type of resource being accessed/modified
        resource_id (int, optional): ID of the specific resource
        details (dict, optional): Additional details about the action
        before_state (dict, optional): State before the change
        after_state (dict, optional): State after the change
        
    Returns:
        AuditLog: The created audit log entry
        
    Example:
        >>> audit_log(
        ...     action='ROLE_ASSIGNED',
        ...     actor=admin_user,
        ...     request=request,
        ...     target_user=employee_user,
        ...     resource_type='Role',
        ...     resource_id=role.id,
        ...     details={'role_name': 'HR Manager'},
        ...     before_state={'roles': ['Employee']},
        ...     after_state={'roles': ['Employee', 'HR Manager']}
        ... )
    """
    from .models import AuditLog
    
    # Initialize details dict if not provided
    if details is None:
        details = {}
    
    # Add before/after states to details if provided
    if before_state is not None:
        details['before_state'] = before_state
    
    if after_state is not None:
        details['after_state'] = after_state
    
    # Add timestamp to details
    from django.utils import timezone
    details['timestamp'] = timezone.now().isoformat()
    
    # Extract IP address from request if provided
    ip_address = None
    if request:
        from .permissions import get_client_ip
        ip_address = get_client_ip(request)
    
    # Create and return the audit log entry
    # Only set actor if it's a saved user object
    actor_to_save = actor if actor and actor.pk else None
    target_user_to_save = target_user if target_user and target_user.pk else None
    
    audit_entry = AuditLog.objects.create(
        action=action,
        actor=actor_to_save,
        target_user=target_user_to_save,
        resource_type=resource_type or '',
        resource_id=resource_id,
        details=details,
        ip_address=ip_address
    )
    
    return audit_entry


def expire_temporary_roles():
    """
    Expire temporary role assignments that have passed their expiration date.
    
    This function queries RoleAssignments where expires_at < now() and is_active = True,
    sets is_active to False, removes users from their Groups, and creates audit log entries.
    
    This function can be called from:
    - Management command (expire_roles)
    - Celery periodic task
    - Django cron job
    - Any other scheduled task mechanism
    
    Returns:
        dict: Dictionary with 'expired_count' and 'error_count' keys
        
    Example:
        >>> from authentication.utils import expire_temporary_roles
        >>> result = expire_temporary_roles()
        >>> print(f"Expired {result['expired_count']} roles")
    """
    from django.utils import timezone
    from .models import RoleAssignment, AuditLog
    
    # Get current time
    now = timezone.now()
    
    # Query RoleAssignments where expires_at < now() and is_active = True
    expired_assignments = RoleAssignment.objects.filter(
        expires_at__lt=now,
        is_active=True
    ).select_related('user', 'role', 'assigned_by')
    
    expired_count = 0
    error_count = 0
    
    # Process each expired assignment
    for assignment in expired_assignments:
        try:
            user = assignment.user
            role = assignment.role
            
            # Set is_active to False
            assignment.is_active = False
            assignment.save()
            
            # Remove user from Group
            user.groups.remove(role)
            
            # Create audit log entry
            AuditLog.objects.create(
                action='ROLE_REVOKED',
                actor=None,  # System action, no actor
                target_user=user,
                resource_type='RoleAssignment',
                resource_id=assignment.id,
                details={
                    'role_name': role.name,
                    'reason': 'Automatic expiration',
                    'expired_at': assignment.expires_at.isoformat(),
                    'assigned_by': assignment.assigned_by.username if assignment.assigned_by else None,
                    'assigned_at': assignment.assigned_at.isoformat(),
                    'notes': assignment.notes,
                },
                ip_address=None  # System action, no IP
            )
            
            expired_count += 1
            
        except Exception as e:
            error_count += 1
            # Log the error but continue processing other assignments
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Error expiring role assignment {assignment.id}: {str(e)}')
    
    return {
        'expired_count': expired_count,
        'error_count': error_count
    }
