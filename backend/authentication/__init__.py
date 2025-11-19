"""
Authentication app for RBAC system.

This app provides role-based access control functionality including:
- User profiles with department information
- Role assignments with expiration tracking
- Audit logging for security compliance
- Permission checking utilities and decorators
- DRF permission classes for API protection

Usage:
    from authentication.permissions import BaseRolePermission, has_role
    from authentication.decorators import require_role, audit_permission_check
    from authentication.utils import ROLE_EMPLOYEE, ensure_role_exists
"""
