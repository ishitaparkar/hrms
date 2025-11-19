from django.test import TestCase, RequestFactory
from django.contrib.auth.models import User, Group, Permission
from django.contrib.contenttypes.models import ContentType
from rest_framework.test import APIRequestFactory
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import UserProfile, AuditLog
from .permissions import (
    BaseRolePermission,
    IsEmployee,
    IsDepartmentHead,
    IsHRManager,
    IsSuperAdmin,
    has_role,
    has_permission,
    get_user_department,
    validate_department_scope,
    log_access_denied
)
from .decorators import require_role, require_permission, audit_permission_check
from .utils import (
    ensure_role_exists,
    ROLE_SUPER_ADMIN,
    ROLE_HR_MANAGER,
    ROLE_DEPARTMENT_HEAD,
    ROLE_EMPLOYEE
)
from employee_management.models import Employee


class UserProfileModelTests(TestCase):
    """Test cases for UserProfile model creation and relationships."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.employee = Employee.objects.create(
            firstName='Test',
            lastName='User',
            employeeId='EMP001',
            personalEmail='test@example.com',
            mobileNumber='1234567890',
            joiningDate='2024-01-01',
            department='Computer Science',
            designation='Developer'
        )
    
    def test_user_profile_creation(self):
        """Test UserProfile can be created with required fields."""
        profile = UserProfile.objects.create(
            user=self.user,
            department='Computer Science',
            phone_number='1234567890'
        )
        
        self.assertEqual(profile.user, self.user)
        self.assertEqual(profile.department, 'Computer Science')
        self.assertEqual(profile.phone_number, '1234567890')
        self.assertIsNotNone(profile.created_at)
        self.assertIsNotNone(profile.updated_at)
    
    def test_user_profile_one_to_one_with_user(self):
        """Test UserProfile has one-to-one relationship with User."""
        profile = UserProfile.objects.create(
            user=self.user,
            department='Computer Science'
        )
        
        # Access profile from user
        self.assertEqual(self.user.profile, profile)
        
        # Verify one-to-one constraint
        with self.assertRaises(Exception):
            UserProfile.objects.create(
                user=self.user,
                department='Mathematics'
            )
    
    def test_user_profile_one_to_one_with_employee(self):
        """Test UserProfile has one-to-one relationship with Employee."""
        profile = UserProfile.objects.create(
            user=self.user,
            employee=self.employee,
            department='Computer Science'
        )
        
        # Access profile from employee
        self.assertEqual(self.employee.user_profile, profile)
        self.assertEqual(profile.employee, self.employee)
    
    def test_user_profile_employee_nullable(self):
        """Test UserProfile can be created without employee."""
        profile = UserProfile.objects.create(
            user=self.user,
            department='Computer Science'
        )
        
        self.assertIsNone(profile.employee)
    
    def test_user_profile_employee_set_null_on_delete(self):
        """Test UserProfile.employee is set to NULL when Employee is deleted."""
        profile = UserProfile.objects.create(
            user=self.user,
            employee=self.employee,
            department='Computer Science'
        )
        
        # Delete employee
        self.employee.delete()
        
        # Refresh profile from database
        profile.refresh_from_db()
        
        # Verify employee is set to NULL
        self.assertIsNone(profile.employee)
    
    def test_user_profile_cascade_delete_with_user(self):
        """Test UserProfile is deleted when User is deleted (CASCADE)."""
        profile = UserProfile.objects.create(
            user=self.user,
            department='Computer Science'
        )
        
        profile_id = profile.id
        
        # Delete user
        self.user.delete()
        
        # Verify profile is also deleted
        self.assertFalse(UserProfile.objects.filter(id=profile_id).exists())
    
    def test_user_profile_str_representation(self):
        """Test UserProfile string representation."""
        profile = UserProfile.objects.create(
            user=self.user,
            department='Computer Science'
        )
        
        expected_str = f"{self.user.username} - Computer Science"
        self.assertEqual(str(profile), expected_str)
    
    def test_user_profile_updated_at_changes(self):
        """Test UserProfile.updated_at changes when profile is updated."""
        profile = UserProfile.objects.create(
            user=self.user,
            department='Computer Science'
        )
        
        original_updated_at = profile.updated_at
        
        # Update profile
        import time
        time.sleep(0.01)  # Small delay to ensure timestamp difference
        profile.department = 'Mathematics'
        profile.save()
        
        # Verify updated_at changed
        self.assertNotEqual(profile.updated_at, original_updated_at)
        self.assertGreater(profile.updated_at, original_updated_at)


class RoleAssignmentModelTests(TestCase):
    """Test cases for RoleAssignment model."""
    
    def setUp(self):
        """Set up test data."""
        from django.utils import timezone
        from datetime import timedelta
        
        self.admin_user = User.objects.create_user(
            username='admin',
            password='testpass123'
        )
        self.target_user = User.objects.create_user(
            username='targetuser',
            password='testpass123'
        )
        
        UserProfile.objects.create(user=self.admin_user, department='HR')
        UserProfile.objects.create(user=self.target_user, department='Computer Science')
        
        self.employee_role, _ = ensure_role_exists(ROLE_EMPLOYEE)
        self.hr_manager_role, _ = ensure_role_exists(ROLE_HR_MANAGER)
        
        self.timezone = timezone
        self.timedelta = timedelta
    
    def test_role_assignment_creation(self):
        """Test RoleAssignment can be created with required fields."""
        from .models import RoleAssignment
        
        assignment = RoleAssignment.objects.create(
            user=self.target_user,
            role=self.employee_role,
            assigned_by=self.admin_user,
            notes='Initial role assignment'
        )
        
        self.assertEqual(assignment.user, self.target_user)
        self.assertEqual(assignment.role, self.employee_role)
        self.assertEqual(assignment.assigned_by, self.admin_user)
        self.assertTrue(assignment.is_active)
        self.assertIsNone(assignment.expires_at)
        self.assertEqual(assignment.notes, 'Initial role assignment')
        self.assertIsNotNone(assignment.assigned_at)
    
    def test_role_assignment_with_expiration(self):
        """Test RoleAssignment can be created with expiration date."""
        from .models import RoleAssignment
        
        expires_at = self.timezone.now() + self.timedelta(days=30)
        
        assignment = RoleAssignment.objects.create(
            user=self.target_user,
            role=self.hr_manager_role,
            assigned_by=self.admin_user,
            expires_at=expires_at,
            notes='Temporary HR Manager access'
        )
        
        self.assertEqual(assignment.expires_at, expires_at)
        self.assertTrue(assignment.is_active)
    
    def test_role_assignment_default_is_active(self):
        """Test RoleAssignment is_active defaults to True."""
        from .models import RoleAssignment
        
        assignment = RoleAssignment.objects.create(
            user=self.target_user,
            role=self.employee_role,
            assigned_by=self.admin_user
        )
        
        self.assertTrue(assignment.is_active)
    
    def test_role_assignment_can_be_inactive(self):
        """Test RoleAssignment can be set to inactive."""
        from .models import RoleAssignment
        
        assignment = RoleAssignment.objects.create(
            user=self.target_user,
            role=self.employee_role,
            assigned_by=self.admin_user,
            is_active=False
        )
        
        self.assertFalse(assignment.is_active)
    
    def test_role_assignment_user_relationship(self):
        """Test RoleAssignment has correct relationship with User."""
        from .models import RoleAssignment
        
        assignment = RoleAssignment.objects.create(
            user=self.target_user,
            role=self.employee_role,
            assigned_by=self.admin_user
        )
        
        # Access assignments from user
        self.assertIn(assignment, self.target_user.role_assignments.all())
    
    def test_role_assignment_assigned_by_relationship(self):
        """Test RoleAssignment tracks who assigned the role."""
        from .models import RoleAssignment
        
        assignment = RoleAssignment.objects.create(
            user=self.target_user,
            role=self.employee_role,
            assigned_by=self.admin_user
        )
        
        # Access assignments made by admin
        self.assertIn(assignment, self.admin_user.assigned_roles.all())
    
    def test_role_assignment_assigned_by_set_null_on_delete(self):
        """Test RoleAssignment.assigned_by is set to NULL when assigning user is deleted."""
        from .models import RoleAssignment
        
        assignment = RoleAssignment.objects.create(
            user=self.target_user,
            role=self.employee_role,
            assigned_by=self.admin_user
        )
        
        # Delete admin user
        self.admin_user.delete()
        
        # Refresh assignment from database
        assignment.refresh_from_db()
        
        # Verify assigned_by is set to NULL
        self.assertIsNone(assignment.assigned_by)
    
    def test_role_assignment_cascade_delete_with_user(self):
        """Test RoleAssignment is deleted when user is deleted (CASCADE)."""
        from .models import RoleAssignment
        
        assignment = RoleAssignment.objects.create(
            user=self.target_user,
            role=self.employee_role,
            assigned_by=self.admin_user
        )
        
        assignment_id = assignment.id
        
        # Delete target user
        self.target_user.delete()
        
        # Verify assignment is also deleted
        self.assertFalse(RoleAssignment.objects.filter(id=assignment_id).exists())
    
    def test_role_assignment_str_representation(self):
        """Test RoleAssignment string representation."""
        from .models import RoleAssignment
        
        assignment = RoleAssignment.objects.create(
            user=self.target_user,
            role=self.employee_role,
            assigned_by=self.admin_user,
            is_active=True
        )
        
        expected_str = f"{self.target_user.username} - {self.employee_role.name} (Active)"
        self.assertEqual(str(assignment), expected_str)
        
        # Test inactive representation
        assignment.is_active = False
        assignment.save()
        
        expected_str_inactive = f"{self.target_user.username} - {self.employee_role.name} (Inactive)"
        self.assertEqual(str(assignment), expected_str_inactive)
    
    def test_role_assignment_ordering(self):
        """Test RoleAssignment is ordered by assigned_at descending."""
        from .models import RoleAssignment
        import time
        
        # Create multiple assignments
        assignment1 = RoleAssignment.objects.create(
            user=self.target_user,
            role=self.employee_role,
            assigned_by=self.admin_user
        )
        
        time.sleep(0.01)
        
        assignment2 = RoleAssignment.objects.create(
            user=self.target_user,
            role=self.hr_manager_role,
            assigned_by=self.admin_user
        )
        
        # Get all assignments
        assignments = list(RoleAssignment.objects.all())
        
        # Verify ordering (most recent first)
        self.assertEqual(assignments[0], assignment2)
        self.assertEqual(assignments[1], assignment1)


class AuditLogModelTests(TestCase):
    """Test cases for AuditLog model."""
    
    def setUp(self):
        """Set up test data."""
        self.actor = User.objects.create_user(
            username='admin',
            password='testpass123'
        )
        self.target_user = User.objects.create_user(
            username='targetuser',
            password='testpass123'
        )
        
        UserProfile.objects.create(user=self.actor, department='HR')
        UserProfile.objects.create(user=self.target_user, department='Computer Science')
    
    def test_audit_log_creation(self):
        """Test AuditLog can be created with required fields."""
        log_entry = AuditLog.objects.create(
            action='ROLE_ASSIGNED',
            actor=self.actor,
            target_user=self.target_user,
            resource_type='Role',
            resource_id=1,
            details={'role_name': 'Employee'}
        )
        
        self.assertEqual(log_entry.action, 'ROLE_ASSIGNED')
        self.assertEqual(log_entry.actor, self.actor)
        self.assertEqual(log_entry.target_user, self.target_user)
        self.assertEqual(log_entry.resource_type, 'Role')
        self.assertEqual(log_entry.resource_id, 1)
        self.assertEqual(log_entry.details['role_name'], 'Employee')
        self.assertIsNotNone(log_entry.timestamp)
    
    def test_audit_log_action_choices(self):
        """Test AuditLog supports all defined action choices."""
        actions = ['ROLE_ASSIGNED', 'ROLE_REVOKED', 'PERMISSION_CHANGED', 'ACCESS_DENIED']
        
        for action in actions:
            log_entry = AuditLog.objects.create(
                action=action,
                actor=self.actor,
                resource_type='Test',
                details={}
            )
            self.assertEqual(log_entry.action, action)
    
    def test_audit_log_with_ip_address(self):
        """Test AuditLog can store IP address."""
        log_entry = AuditLog.objects.create(
            action='ACCESS_DENIED',
            actor=self.actor,
            resource_type='Employee',
            resource_id=1,
            details={},
            ip_address='192.168.1.1'
        )
        
        self.assertEqual(log_entry.ip_address, '192.168.1.1')
    
    def test_audit_log_nullable_fields(self):
        """Test AuditLog nullable fields can be None."""
        log_entry = AuditLog.objects.create(
            action='PERMISSION_CHANGED',
            actor=None,  # System action
            target_user=None,
            resource_type='System',
            resource_id=None,
            details={},
            ip_address=None
        )
        
        self.assertIsNone(log_entry.actor)
        self.assertIsNone(log_entry.target_user)
        self.assertIsNone(log_entry.resource_id)
        self.assertIsNone(log_entry.ip_address)
    
    def test_audit_log_details_json_field(self):
        """Test AuditLog details field stores JSON data."""
        details = {
            'role_name': 'HR Manager',
            'permissions': ['view_all_employees', 'manage_employees'],
            'before_state': {'roles': ['Employee']},
            'after_state': {'roles': ['Employee', 'HR Manager']}
        }
        
        log_entry = AuditLog.objects.create(
            action='ROLE_ASSIGNED',
            actor=self.actor,
            target_user=self.target_user,
            resource_type='Role',
            details=details
        )
        
        # Verify details are stored correctly
        self.assertEqual(log_entry.details['role_name'], 'HR Manager')
        self.assertEqual(len(log_entry.details['permissions']), 2)
        self.assertIn('before_state', log_entry.details)
        self.assertIn('after_state', log_entry.details)
    
    def test_audit_log_actor_set_null_on_delete(self):
        """Test AuditLog.actor is set to NULL when actor is deleted."""
        log_entry = AuditLog.objects.create(
            action='ROLE_ASSIGNED',
            actor=self.actor,
            target_user=self.target_user,
            resource_type='Role',
            details={}
        )
        
        # Delete actor
        self.actor.delete()
        
        # Refresh log entry from database
        log_entry.refresh_from_db()
        
        # Verify actor is set to NULL
        self.assertIsNone(log_entry.actor)
    
    def test_audit_log_target_user_set_null_on_delete(self):
        """Test AuditLog.target_user is set to NULL when target user is deleted."""
        log_entry = AuditLog.objects.create(
            action='ROLE_ASSIGNED',
            actor=self.actor,
            target_user=self.target_user,
            resource_type='Role',
            details={}
        )
        
        # Delete target user
        self.target_user.delete()
        
        # Refresh log entry from database
        log_entry.refresh_from_db()
        
        # Verify target_user is set to NULL
        self.assertIsNone(log_entry.target_user)
    
    def test_audit_log_str_representation(self):
        """Test AuditLog string representation."""
        log_entry = AuditLog.objects.create(
            action='ROLE_ASSIGNED',
            actor=self.actor,
            target_user=self.target_user,
            resource_type='Role',
            details={}
        )
        
        expected_str = f"ROLE_ASSIGNED - {self.actor} - {log_entry.timestamp}"
        self.assertEqual(str(log_entry), expected_str)
    
    def test_audit_log_ordering(self):
        """Test AuditLog is ordered by timestamp descending."""
        import time
        
        # Create multiple log entries
        log1 = AuditLog.objects.create(
            action='ROLE_ASSIGNED',
            actor=self.actor,
            resource_type='Role',
            details={}
        )
        
        time.sleep(0.01)
        
        log2 = AuditLog.objects.create(
            action='ROLE_REVOKED',
            actor=self.actor,
            resource_type='Role',
            details={}
        )
        
        # Get all logs
        logs = list(AuditLog.objects.all())
        
        # Verify ordering (most recent first)
        self.assertEqual(logs[0], log2)
        self.assertEqual(logs[1], log1)
    
    def test_audit_log_default_details(self):
        """Test AuditLog details field defaults to empty dict."""
        log_entry = AuditLog.objects.create(
            action='ACCESS_DENIED',
            actor=self.actor,
            resource_type='Employee'
        )
        
        self.assertEqual(log_entry.details, {})


class PermissionUtilityTests(TestCase):
    """Test cases for permission utility functions."""
    
    def setUp(self):
        """Set up test data."""
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create user profile
        self.profile = UserProfile.objects.create(
            user=self.user,
            department='Computer Science'
        )
        
        # Create roles
        self.employee_role, _ = ensure_role_exists(ROLE_EMPLOYEE)
        self.dept_head_role, _ = ensure_role_exists(ROLE_DEPARTMENT_HEAD)
        self.hr_manager_role, _ = ensure_role_exists(ROLE_HR_MANAGER)
        
        # Create employee
        self.employee = Employee.objects.create(
            firstName='Test',
            lastName='User',
            employeeId='EMP001',
            personalEmail='test@example.com',
            mobileNumber='1234567890',
            joiningDate='2024-01-01',
            department='Computer Science',
            designation='Developer'
        )
        
        self.profile.employee = self.employee
        self.profile.save()
    
    def test_has_role_with_valid_role(self):
        """Test has_role returns True when user has the role."""
        self.user.groups.add(self.employee_role)
        self.assertTrue(has_role(self.user, ROLE_EMPLOYEE))
    
    def test_has_role_without_role(self):
        """Test has_role returns False when user doesn't have the role."""
        self.assertFalse(has_role(self.user, ROLE_HR_MANAGER))
    
    def test_has_role_unauthenticated(self):
        """Test has_role returns False for unauthenticated user."""
        unauthenticated_user = User()
        self.assertFalse(has_role(unauthenticated_user, ROLE_EMPLOYEE))
    
    def test_get_user_department(self):
        """Test get_user_department returns correct department."""
        department = get_user_department(self.user)
        self.assertEqual(department, 'Computer Science')
    
    def test_get_user_department_no_profile(self):
        """Test get_user_department returns None when no profile exists."""
        user_no_profile = User.objects.create_user(
            username='noprofile',
            password='testpass123'
        )
        self.assertIsNone(get_user_department(user_no_profile))
    
    def test_validate_department_scope_same_department(self):
        """Test validate_department_scope returns True for same department."""
        self.user.groups.add(self.dept_head_role)
        self.assertTrue(validate_department_scope(self.user, self.employee))
    
    def test_validate_department_scope_different_department(self):
        """Test validate_department_scope returns False for different department."""
        other_employee = Employee.objects.create(
            firstName='Other',
            lastName='User',
            employeeId='EMP002',
            personalEmail='other@example.com',
            mobileNumber='0987654321',
            joiningDate='2024-01-01',
            department='Mathematics',
            designation='Professor'
        )
        self.user.groups.add(self.dept_head_role)
        self.assertFalse(validate_department_scope(self.user, other_employee))


class BaseRolePermissionTests(TestCase):
    """Test cases for BaseRolePermission class."""
    
    def setUp(self):
        """Set up test data."""
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.profile = UserProfile.objects.create(
            user=self.user,
            department='Computer Science'
        )
        
        # Create roles
        self.employee_role, _ = ensure_role_exists(ROLE_EMPLOYEE)
        self.hr_manager_role, _ = ensure_role_exists(ROLE_HR_MANAGER)
    
    def test_has_permission_authenticated_with_role(self):
        """Test has_permission returns True when user has required role."""
        self.user.groups.add(self.employee_role)
        
        class TestPermission(BaseRolePermission):
            required_roles = [ROLE_EMPLOYEE]
        
        request = self.factory.get('/test/')
        request.user = self.user
        
        permission = TestPermission()
        self.assertTrue(permission.has_permission(request, None))
    
    def test_has_permission_authenticated_without_role(self):
        """Test has_permission returns False when user lacks required role."""
        class TestPermission(BaseRolePermission):
            required_roles = [ROLE_HR_MANAGER]
        
        request = self.factory.get('/test/')
        request.user = self.user
        
        permission = TestPermission()
        self.assertFalse(permission.has_permission(request, None))
    
    def test_has_permission_unauthenticated(self):
        """Test has_permission returns False for unauthenticated user."""
        class TestPermission(BaseRolePermission):
            required_roles = [ROLE_EMPLOYEE]
        
        request = self.factory.get('/test/')
        request.user = User()  # Unauthenticated user
        
        permission = TestPermission()
        self.assertFalse(permission.has_permission(request, None))


class RoleSpecificPermissionTests(TestCase):
    """Test cases for role-specific permission classes."""
    
    def setUp(self):
        """Set up test data."""
        self.factory = APIRequestFactory()
        
        # Create users with different roles
        self.employee_user = User.objects.create_user(
            username='employee',
            password='testpass123'
        )
        self.dept_head_user = User.objects.create_user(
            username='depthead',
            password='testpass123'
        )
        self.hr_manager_user = User.objects.create_user(
            username='hrmanager',
            password='testpass123'
        )
        
        # Create profiles
        self.employee_profile = UserProfile.objects.create(
            user=self.employee_user,
            department='Computer Science'
        )
        self.dept_head_profile = UserProfile.objects.create(
            user=self.dept_head_user,
            department='Computer Science'
        )
        self.hr_manager_profile = UserProfile.objects.create(
            user=self.hr_manager_user,
            department='HR'
        )
        
        # Assign roles
        employee_role, _ = ensure_role_exists(ROLE_EMPLOYEE)
        dept_head_role, _ = ensure_role_exists(ROLE_DEPARTMENT_HEAD)
        hr_manager_role, _ = ensure_role_exists(ROLE_HR_MANAGER)
        
        self.employee_user.groups.add(employee_role)
        self.dept_head_user.groups.add(dept_head_role)
        self.hr_manager_user.groups.add(hr_manager_role)
        
        # Create employee records
        self.employee_record = Employee.objects.create(
            firstName='Employee',
            lastName='User',
            employeeId='EMP001',
            personalEmail='employee@example.com',
            mobileNumber='1234567890',
            joiningDate='2024-01-01',
            department='Computer Science',
            designation='Developer'
        )
        
        self.employee_profile.employee = self.employee_record
        self.employee_profile.save()
    
    def test_is_hr_manager_permission(self):
        """Test IsHRManager allows HR Manager role."""
        request = self.factory.get('/test/')
        request.user = self.hr_manager_user
        
        permission = IsHRManager()
        self.assertTrue(permission.has_permission(request, None))
    
    def test_is_hr_manager_denies_employee(self):
        """Test IsHRManager denies Employee role."""
        request = self.factory.get('/test/')
        request.user = self.employee_user
        
        permission = IsHRManager()
        self.assertFalse(permission.has_permission(request, None))
    
    def test_is_department_head_permission(self):
        """Test IsDepartmentHead allows Department Head role."""
        request = self.factory.get('/test/')
        request.user = self.dept_head_user
        
        permission = IsDepartmentHead()
        self.assertTrue(permission.has_permission(request, None))


class AuditLoggingTests(TestCase):
    """Test cases for audit logging functionality."""
    
    def setUp(self):
        """Set up test data."""
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.profile = UserProfile.objects.create(
            user=self.user,
            department='Computer Science'
        )
    
    def test_log_access_denied_creates_audit_log(self):
        """Test log_access_denied creates an audit log entry."""
        request = self.factory.get('/test/')
        request.user = self.user
        
        initial_count = AuditLog.objects.count()
        
        log_access_denied(
            request,
            resource_type='Employee',
            resource_id=1,
            required_permission='view_all_employees'
        )
        
        self.assertEqual(AuditLog.objects.count(), initial_count + 1)
        
        log_entry = AuditLog.objects.latest('timestamp')
        self.assertEqual(log_entry.action, 'ACCESS_DENIED')
        self.assertEqual(log_entry.actor, self.user)
        self.assertEqual(log_entry.resource_type, 'Employee')
        self.assertEqual(log_entry.resource_id, 1)


class AuditLogUtilityTests(TestCase):
    """Test cases for the audit_log utility function."""
    
    def setUp(self):
        """Set up test data."""
        self.factory = APIRequestFactory()
        self.actor = User.objects.create_user(
            username='admin',
            password='testpass123'
        )
        self.target_user = User.objects.create_user(
            username='targetuser',
            password='testpass123'
        )
        
        # Create roles
        self.employee_role, _ = ensure_role_exists(ROLE_EMPLOYEE)
        self.hr_manager_role, _ = ensure_role_exists(ROLE_HR_MANAGER)
    
    def test_audit_log_creates_entry(self):
        """Test audit_log creates an audit log entry."""
        from .utils import audit_log
        
        initial_count = AuditLog.objects.count()
        
        audit_log(
            action='ROLE_ASSIGNED',
            actor=self.actor,
            target_user=self.target_user,
            resource_type='Role',
            resource_id=self.employee_role.id,
            details={'role_name': 'Employee'}
        )
        
        self.assertEqual(AuditLog.objects.count(), initial_count + 1)
        
        log_entry = AuditLog.objects.latest('timestamp')
        self.assertEqual(log_entry.action, 'ROLE_ASSIGNED')
        self.assertEqual(log_entry.actor, self.actor)
        self.assertEqual(log_entry.target_user, self.target_user)
        self.assertEqual(log_entry.resource_type, 'Role')
        self.assertEqual(log_entry.resource_id, self.employee_role.id)
    
    def test_audit_log_captures_ip_address(self):
        """Test audit_log captures IP address from request."""
        from .utils import audit_log
        
        request = self.factory.get('/test/')
        request.user = self.actor
        request.META['REMOTE_ADDR'] = '192.168.1.1'
        
        log_entry = audit_log(
            action='ROLE_ASSIGNED',
            actor=self.actor,
            request=request,
            target_user=self.target_user,
            resource_type='Role',
            resource_id=self.employee_role.id
        )
        
        self.assertEqual(log_entry.ip_address, '192.168.1.1')
    
    def test_audit_log_stores_before_after_states(self):
        """Test audit_log stores before and after states in details."""
        from .utils import audit_log
        
        before_state = {'roles': ['Employee']}
        after_state = {'roles': ['Employee', 'HR Manager']}
        
        log_entry = audit_log(
            action='ROLE_ASSIGNED',
            actor=self.actor,
            target_user=self.target_user,
            resource_type='Role',
            resource_id=self.hr_manager_role.id,
            details={'role_name': 'HR Manager'},
            before_state=before_state,
            after_state=after_state
        )
        
        self.assertIn('before_state', log_entry.details)
        self.assertIn('after_state', log_entry.details)
        self.assertEqual(log_entry.details['before_state'], before_state)
        self.assertEqual(log_entry.details['after_state'], after_state)
    
    def test_audit_log_includes_timestamp(self):
        """Test audit_log includes timestamp in details."""
        from .utils import audit_log
        
        log_entry = audit_log(
            action='ROLE_ASSIGNED',
            actor=self.actor,
            target_user=self.target_user,
            resource_type='Role',
            resource_id=self.employee_role.id
        )
        
        self.assertIn('timestamp', log_entry.details)
    
    def test_audit_log_without_request(self):
        """Test audit_log works without request object."""
        from .utils import audit_log
        
        log_entry = audit_log(
            action='ROLE_ASSIGNED',
            actor=self.actor,
            target_user=self.target_user,
            resource_type='Role',
            resource_id=self.employee_role.id
        )
        
        self.assertIsNone(log_entry.ip_address)
        self.assertEqual(log_entry.action, 'ROLE_ASSIGNED')
    
    def test_audit_log_access_denied(self):
        """Test audit_log for ACCESS_DENIED action."""
        from .utils import audit_log
        
        request = self.factory.get('/api/employees/')
        request.user = self.target_user
        
        log_entry = audit_log(
            action='ACCESS_DENIED',
            actor=self.target_user,
            request=request,
            resource_type='Employee',
            resource_id=1,
            details={
                'required_permission': 'view_all_employees',
                'user_roles': ['Employee']
            }
        )
        
        self.assertEqual(log_entry.action, 'ACCESS_DENIED')
        self.assertEqual(log_entry.details['required_permission'], 'view_all_employees')
    
    def test_audit_log_role_revoked(self):
        """Test audit_log for ROLE_REVOKED action with before/after states."""
        from .utils import audit_log
        
        before_state = {'roles': ['Employee', 'HR Manager'], 'permissions_count': 15}
        after_state = {'roles': ['Employee'], 'permissions_count': 5}
        
        log_entry = audit_log(
            action='ROLE_REVOKED',
            actor=self.actor,
            target_user=self.target_user,
            resource_type='Role',
            resource_id=self.hr_manager_role.id,
            details={'role_name': 'HR Manager', 'revoked_by': 'admin'},
            before_state=before_state,
            after_state=after_state
        )
        
        self.assertEqual(log_entry.action, 'ROLE_REVOKED')
        self.assertEqual(log_entry.details['before_state']['permissions_count'], 15)
        self.assertEqual(log_entry.details['after_state']['permissions_count'], 5)
    
    def test_audit_log_permission_changed(self):
        """Test audit_log for PERMISSION_CHANGED action."""
        from .utils import audit_log
        
        log_entry = audit_log(
            action='PERMISSION_CHANGED',
            actor=self.actor,
            resource_type='Role',
            resource_id=self.employee_role.id,
            details={
                'action_type': 'role_created',
                'role_name': 'Custom Role',
                'permissions': ['view_employee', 'add_leaverequest']
            },
            before_state={'role_exists': False},
            after_state={'role_exists': True, 'permissions_count': 2}
        )
        
        self.assertEqual(log_entry.action, 'PERMISSION_CHANGED')
        self.assertEqual(log_entry.details['action_type'], 'role_created')


class RoleExpirationTests(TestCase):
    """Test cases for temporary role expiration functionality."""
    
    def setUp(self):
        """Set up test data."""
        from django.utils import timezone
        from datetime import timedelta
        
        # Create users
        self.admin_user = User.objects.create_user(
            username='admin',
            password='testpass123'
        )
        self.temp_user = User.objects.create_user(
            username='tempuser',
            password='testpass123'
        )
        
        # Create profiles
        UserProfile.objects.create(user=self.admin_user, department='HR')
        UserProfile.objects.create(user=self.temp_user, department='Computer Science')
        
        # Create roles
        self.employee_role, _ = ensure_role_exists(ROLE_EMPLOYEE)
        self.hr_manager_role, _ = ensure_role_exists(ROLE_HR_MANAGER)
        
        # Store timezone for tests
        self.timezone = timezone
        self.timedelta = timedelta
    
    def test_expire_temporary_roles_with_expired_role(self):
        """Test expire_temporary_roles expires roles that have passed expiration date."""
        from .models import RoleAssignment
        from .utils import expire_temporary_roles
        
        # Create an expired role assignment
        expired_time = self.timezone.now() - self.timedelta(hours=1)
        assignment = RoleAssignment.objects.create(
            user=self.temp_user,
            role=self.hr_manager_role,
            assigned_by=self.admin_user,
            expires_at=expired_time,
            is_active=True,
            notes='Temporary HR Manager access'
        )
        
        # Add user to group
        self.temp_user.groups.add(self.hr_manager_role)
        
        # Verify user has the role
        self.assertTrue(self.temp_user.groups.filter(name=ROLE_HR_MANAGER).exists())
        
        # Run expiration
        result = expire_temporary_roles()
        
        # Verify role was expired
        self.assertEqual(result['expired_count'], 1)
        self.assertEqual(result['error_count'], 0)
        
        # Verify assignment is inactive
        assignment.refresh_from_db()
        self.assertFalse(assignment.is_active)
        
        # Verify user was removed from group
        self.assertFalse(self.temp_user.groups.filter(name=ROLE_HR_MANAGER).exists())
    
    def test_expire_temporary_roles_creates_audit_log(self):
        """Test expire_temporary_roles creates audit log entries."""
        from .models import RoleAssignment, AuditLog
        from .utils import expire_temporary_roles
        
        # Create an expired role assignment
        expired_time = self.timezone.now() - self.timedelta(minutes=30)
        RoleAssignment.objects.create(
            user=self.temp_user,
            role=self.hr_manager_role,
            assigned_by=self.admin_user,
            expires_at=expired_time,
            is_active=True,
            notes='Test temporary role'
        )
        
        self.temp_user.groups.add(self.hr_manager_role)
        
        initial_audit_count = AuditLog.objects.count()
        
        # Run expiration
        expire_temporary_roles()
        
        # Verify audit log was created
        self.assertEqual(AuditLog.objects.count(), initial_audit_count + 1)
        
        # Verify audit log details
        log_entry = AuditLog.objects.latest('timestamp')
        self.assertEqual(log_entry.action, 'ROLE_REVOKED')
        self.assertIsNone(log_entry.actor)  # System action
        self.assertEqual(log_entry.target_user, self.temp_user)
        self.assertEqual(log_entry.resource_type, 'RoleAssignment')
        self.assertIn('reason', log_entry.details)
        self.assertEqual(log_entry.details['reason'], 'Automatic expiration')
        self.assertIn('role_name', log_entry.details)
        self.assertEqual(log_entry.details['role_name'], ROLE_HR_MANAGER)
    
    def test_expire_temporary_roles_ignores_active_roles(self):
        """Test expire_temporary_roles does not expire roles that haven't expired yet."""
        from .models import RoleAssignment
        from .utils import expire_temporary_roles
        
        # Create a role assignment that expires in the future
        future_time = self.timezone.now() + self.timedelta(hours=24)
        assignment = RoleAssignment.objects.create(
            user=self.temp_user,
            role=self.hr_manager_role,
            assigned_by=self.admin_user,
            expires_at=future_time,
            is_active=True,
            notes='Future expiration'
        )
        
        self.temp_user.groups.add(self.hr_manager_role)
        
        # Run expiration
        result = expire_temporary_roles()
        
        # Verify no roles were expired
        self.assertEqual(result['expired_count'], 0)
        
        # Verify assignment is still active
        assignment.refresh_from_db()
        self.assertTrue(assignment.is_active)
        
        # Verify user still has the role
        self.assertTrue(self.temp_user.groups.filter(name=ROLE_HR_MANAGER).exists())
    
    def test_expire_temporary_roles_ignores_permanent_roles(self):
        """Test expire_temporary_roles does not affect permanent roles (no expiration date)."""
        from .models import RoleAssignment
        from .utils import expire_temporary_roles
        
        # Create a permanent role assignment (no expires_at)
        assignment = RoleAssignment.objects.create(
            user=self.temp_user,
            role=self.employee_role,
            assigned_by=self.admin_user,
            expires_at=None,  # Permanent
            is_active=True,
            notes='Permanent employee role'
        )
        
        self.temp_user.groups.add(self.employee_role)
        
        # Run expiration
        result = expire_temporary_roles()
        
        # Verify no roles were expired
        self.assertEqual(result['expired_count'], 0)
        
        # Verify assignment is still active
        assignment.refresh_from_db()
        self.assertTrue(assignment.is_active)
        
        # Verify user still has the role
        self.assertTrue(self.temp_user.groups.filter(name=ROLE_EMPLOYEE).exists())
    
    def test_expire_temporary_roles_ignores_already_inactive(self):
        """Test expire_temporary_roles does not process already inactive assignments."""
        from .models import RoleAssignment
        from .utils import expire_temporary_roles
        
        # Create an expired but already inactive role assignment
        expired_time = self.timezone.now() - self.timedelta(hours=2)
        assignment = RoleAssignment.objects.create(
            user=self.temp_user,
            role=self.hr_manager_role,
            assigned_by=self.admin_user,
            expires_at=expired_time,
            is_active=False,  # Already inactive
            notes='Already expired'
        )
        
        # Run expiration
        result = expire_temporary_roles()
        
        # Verify no roles were expired (already inactive)
        self.assertEqual(result['expired_count'], 0)
    
    def test_expire_temporary_roles_handles_multiple_assignments(self):
        """Test expire_temporary_roles handles multiple expired assignments."""
        from .models import RoleAssignment
        from .utils import expire_temporary_roles
        
        # Create multiple users with expired roles
        user2 = User.objects.create_user(username='user2', password='test')
        user3 = User.objects.create_user(username='user3', password='test')
        
        UserProfile.objects.create(user=user2, department='Math')
        UserProfile.objects.create(user=user3, department='Physics')
        
        expired_time = self.timezone.now() - self.timedelta(hours=1)
        
        # Create expired assignments
        RoleAssignment.objects.create(
            user=self.temp_user,
            role=self.hr_manager_role,
            assigned_by=self.admin_user,
            expires_at=expired_time,
            is_active=True
        )
        RoleAssignment.objects.create(
            user=user2,
            role=self.hr_manager_role,
            assigned_by=self.admin_user,
            expires_at=expired_time,
            is_active=True
        )
        RoleAssignment.objects.create(
            user=user3,
            role=self.hr_manager_role,
            assigned_by=self.admin_user,
            expires_at=expired_time,
            is_active=True
        )
        
        # Add users to groups
        self.temp_user.groups.add(self.hr_manager_role)
        user2.groups.add(self.hr_manager_role)
        user3.groups.add(self.hr_manager_role)
        
        # Run expiration
        result = expire_temporary_roles()
        
        # Verify all three roles were expired
        self.assertEqual(result['expired_count'], 3)
        self.assertEqual(result['error_count'], 0)
        
        # Verify all users were removed from group
        self.assertFalse(self.temp_user.groups.filter(name=ROLE_HR_MANAGER).exists())
        self.assertFalse(user2.groups.filter(name=ROLE_HR_MANAGER).exists())
        self.assertFalse(user3.groups.filter(name=ROLE_HR_MANAGER).exists())
    
    def test_expire_temporary_roles_returns_correct_counts(self):
        """Test expire_temporary_roles returns correct expired and error counts."""
        from .models import RoleAssignment
        from .utils import expire_temporary_roles
        
        # Create mix of expired and active roles
        expired_time = self.timezone.now() - self.timedelta(hours=1)
        future_time = self.timezone.now() + self.timedelta(hours=1)
        
        # Expired role
        RoleAssignment.objects.create(
            user=self.temp_user,
            role=self.hr_manager_role,
            assigned_by=self.admin_user,
            expires_at=expired_time,
            is_active=True
        )
        self.temp_user.groups.add(self.hr_manager_role)
        
        # Active role (should not be expired)
        user2 = User.objects.create_user(username='user2', password='test')
        UserProfile.objects.create(user=user2, department='Math')
        RoleAssignment.objects.create(
            user=user2,
            role=self.employee_role,
            assigned_by=self.admin_user,
            expires_at=future_time,
            is_active=True
        )
        user2.groups.add(self.employee_role)
        
        # Run expiration
        result = expire_temporary_roles()
        
        # Verify counts
        self.assertEqual(result['expired_count'], 1)
        self.assertEqual(result['error_count'], 0)
        
        # Verify correct role was expired
        self.assertFalse(self.temp_user.groups.filter(name=ROLE_HR_MANAGER).exists())
        self.assertTrue(user2.groups.filter(name=ROLE_EMPLOYEE).exists())


class FirstTimePasswordChangeTests(TestCase):
    """Test cases for first-time password change endpoint."""
    
    def setUp(self):
        """Set up test data."""
        from rest_framework.test import APIClient
        
        self.client = APIClient()
        
        # Create test user
        self.user = User.objects.create_user(
            username='testuser@example.com',
            email='testuser@example.com',
            password='TempPass123'
        )
        
        # Create user profile with password_changed = False
        self.profile = UserProfile.objects.create(
            user=self.user,
            department='Computer Science',
            password_changed=False
        )
    
    def test_first_time_password_change_success(self):
        """Test successful first-time password change."""
        # Authenticate user
        self.client.force_authenticate(user=self.user)
        
        # Change password
        response = self.client.post('/api/auth/first-login-password-change/', {
            'old_password': 'TempPass123',
            'new_password': 'NewSecure123'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Password changed successfully.')
        
        # Verify password was changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewSecure123'))
        
        # Verify password_changed flag was set
        self.profile.refresh_from_db()
        self.assertTrue(self.profile.password_changed)
    
    def test_first_time_password_change_incorrect_old_password(self):
        """Test password change fails with incorrect old password."""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.post('/api/auth/first-login-password-change/', {
            'old_password': 'WrongPassword',
            'new_password': 'NewSecure123'
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'Old password is incorrect.')
        
        # Verify password was not changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('TempPass123'))
        
        # Verify password_changed flag was not set
        self.profile.refresh_from_db()
        self.assertFalse(self.profile.password_changed)
    
    def test_first_time_password_change_too_short(self):
        """Test password change fails when new password is too short."""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.post('/api/auth/first-login-password-change/', {
            'old_password': 'TempPass123',
            'new_password': 'Short1'
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'New password must be at least 8 characters long.')
        
        # Verify password was not changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('TempPass123'))
    
    def test_first_time_password_change_no_letters(self):
        """Test password change fails when new password has no letters."""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.post('/api/auth/first-login-password-change/', {
            'old_password': 'TempPass123',
            'new_password': '12345678'
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'New password must contain both letters and numbers.')
    
    def test_first_time_password_change_no_numbers(self):
        """Test password change fails when new password has no numbers."""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.post('/api/auth/first-login-password-change/', {
            'old_password': 'TempPass123',
            'new_password': 'OnlyLetters'
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'New password must contain both letters and numbers.')
    
    def test_first_time_password_change_missing_old_password(self):
        """Test password change fails when old_password is missing."""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.post('/api/auth/first-login-password-change/', {
            'new_password': 'NewSecure123'
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'Both old_password and new_password are required.')
    
    def test_first_time_password_change_missing_new_password(self):
        """Test password change fails when new_password is missing."""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.post('/api/auth/first-login-password-change/', {
            'old_password': 'TempPass123'
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'Both old_password and new_password are required.')
    
    def test_first_time_password_change_unauthenticated(self):
        """Test password change fails for unauthenticated user."""
        response = self.client.post('/api/auth/first-login-password-change/', {
            'old_password': 'TempPass123',
            'new_password': 'NewSecure123'
        })
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_first_time_password_change_user_without_profile(self):
        """Test password change works for user without profile."""
        # Create user without profile
        user_no_profile = User.objects.create_user(
            username='noprofile@example.com',
            email='noprofile@example.com',
            password='TempPass123'
        )
        
        self.client.force_authenticate(user=user_no_profile)
        
        response = self.client.post('/api/auth/first-login-password-change/', {
            'old_password': 'TempPass123',
            'new_password': 'NewSecure123'
        })
        
        # Should still succeed (password changed, but no profile to update)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify password was changed
        user_no_profile.refresh_from_db()
        self.assertTrue(user_no_profile.check_password('NewSecure123'))
