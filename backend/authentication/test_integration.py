"""
Integration tests for RBAC API endpoints.

This module contains integration tests for:
- Authentication endpoints returning role data
- Employee management endpoints with different roles
- Leave management endpoints with role-based filtering
- Role assignment and revocation endpoints
- Audit log endpoints
- 403 Forbidden responses with proper error messages
"""
from django.test import TestCase
from django.contrib.auth.models import User, Group
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from rest_framework import status

from .models import UserProfile, RoleAssignment, AuditLog
from .utils import (
    ensure_role_exists,
    ROLE_SUPER_ADMIN,
    ROLE_HR_MANAGER,
    ROLE_DEPARTMENT_HEAD,
    ROLE_EMPLOYEE
)
from employee_management.models import Employee
from leave_management.models import LeaveRequest


class AuthenticationEndpointIntegrationTests(TestCase):
    """Integration tests for authentication endpoints returning role data."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create roles
        self.employee_role, _ = ensure_role_exists(ROLE_EMPLOYEE)
        self.dept_head_role, _ = ensure_role_exists(ROLE_DEPARTMENT_HEAD)
        self.hr_manager_role, _ = ensure_role_exists(ROLE_HR_MANAGER)
        self.super_admin_role, _ = ensure_role_exists(ROLE_SUPER_ADMIN)
        
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
        
        # Assign employee role
        self.user.groups.add(self.employee_role)
    
    def test_login_returns_role_data(self):
        """Test login endpoint returns roles, permissions, and department."""
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertIn('roles', response.data)
        self.assertIn('permissions', response.data)
        self.assertIn('department', response.data)
        self.assertIn(ROLE_EMPLOYEE, response.data['roles'])
        self.assertEqual(response.data['department'], 'Computer Science')
    
    def test_login_returns_multiple_roles(self):
        """Test login endpoint returns all assigned roles."""
        # Assign additional role
        self.user.groups.add(self.dept_head_role)
        
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['roles']), 2)
        self.assertIn(ROLE_EMPLOYEE, response.data['roles'])
        self.assertIn(ROLE_DEPARTMENT_HEAD, response.data['roles'])
    
    def test_current_user_endpoint_returns_profile(self):
        """Test /api/auth/me/ returns current user's profile with roles."""
        # Login to get token
        login_response = self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        token = login_response.data['token']
        
        # Call /api/auth/me/
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        response = self.client.get('/api/auth/me/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user', response.data)
        self.assertIn('roles', response.data)
        self.assertIn('permissions', response.data)
        self.assertIn('profile', response.data)
        self.assertEqual(response.data['user']['username'], 'testuser')
        self.assertIn(ROLE_EMPLOYEE, response.data['roles'])


class EmployeeEndpointIntegrationTests(TestCase):
    """Integration tests for employee endpoints with different roles."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create roles
        self.employee_role, _ = ensure_role_exists(ROLE_EMPLOYEE)
        self.dept_head_role, _ = ensure_role_exists(ROLE_DEPARTMENT_HEAD)
        self.hr_manager_role, _ = ensure_role_exists(ROLE_HR_MANAGER)
        self.super_admin_role, _ = ensure_role_exists(ROLE_SUPER_ADMIN)
        
        # Create users with different roles
        self.employee_user = self._create_user_with_role('employee', ROLE_EMPLOYEE, 'Computer Science')
        self.dept_head_user = self._create_user_with_role('depthead', ROLE_DEPARTMENT_HEAD, 'Computer Science')
        self.hr_manager_user = self._create_user_with_role('hrmanager', ROLE_HR_MANAGER, 'HR')
        self.super_admin_user = self._create_user_with_role('superadmin', ROLE_SUPER_ADMIN, 'Admin')
        
        # Create employee records
        self.cs_employee1 = Employee.objects.create(
            firstName='John',
            lastName='Doe',
            employeeId='EMP001',
            personalEmail='john@example.com',
            mobileNumber='1234567890',
            joiningDate='2024-01-01',
            department='Computer Science',
            designation='Developer'
        )
        
        self.cs_employee2 = Employee.objects.create(
            firstName='Jane',
            lastName='Smith',
            employeeId='EMP002',
            personalEmail='jane@example.com',
            mobileNumber='0987654321',
            joiningDate='2024-01-01',
            department='Computer Science',
            designation='Developer'
        )
        
        self.math_employee = Employee.objects.create(
            firstName='Bob',
            lastName='Johnson',
            employeeId='EMP003',
            personalEmail='bob@example.com',
            mobileNumber='5555555555',
            joiningDate='2024-01-01',
            department='Mathematics',
            designation='Professor'
        )
        
        # Link employee to employee_user profile
        self.employee_user.profile.employee = self.cs_employee1
        self.employee_user.profile.save()
    
    def _create_user_with_role(self, username, role_name, department):
        """Helper to create user with role and profile."""
        user = User.objects.create_user(
            username=username,
            email=f'{username}@example.com',
            password='testpass123'
        )
        UserProfile.objects.create(user=user, department=department)
        role, _ = ensure_role_exists(role_name)
        user.groups.add(role)
        return user
    
    def _authenticate(self, user):
        """Helper to authenticate a user and set credentials."""
        response = self.client.post('/api/auth/login/', {
            'username': user.username,
            'password': 'testpass123'
        })
        token = response.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        return token
    
    def test_employee_can_only_view_own_record(self):
        """Test Employee role can only view their own employee record."""
        self._authenticate(self.employee_user)
        
        response = self.client.get('/api/employees/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.cs_employee1.id)
    
    def test_department_head_can_view_department_employees(self):
        """Test Department Head can view employees in their department."""
        self._authenticate(self.dept_head_user)
        
        response = self.client.get('/api/employees/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        employee_ids = [emp['id'] for emp in response.data]
        self.assertIn(self.cs_employee1.id, employee_ids)
        self.assertIn(self.cs_employee2.id, employee_ids)
        self.assertNotIn(self.math_employee.id, employee_ids)
    
    def test_hr_manager_can_view_all_employees(self):
        """Test HR Manager can view all employees."""
        self._authenticate(self.hr_manager_user)
        
        response = self.client.get('/api/employees/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)
    
    def test_super_admin_can_view_all_employees(self):
        """Test Super Admin can view all employees."""
        self._authenticate(self.super_admin_user)
        
        response = self.client.get('/api/employees/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)
    
    def test_employee_cannot_create_employee(self):
        """Test Employee role cannot create new employees."""
        self._authenticate(self.employee_user)
        
        response = self.client.post('/api/employees/', {
            'firstName': 'New',
            'lastName': 'Employee',
            'employeeId': 'EMP999',
            'personalEmail': 'new@example.com',
            'mobileNumber': '9999999999',
            'joiningDate': '2024-01-01',
            'department': 'Computer Science',
            'designation': 'Developer'
        })
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_hr_manager_can_create_employee(self):
        """Test HR Manager can create new employees."""
        self._authenticate(self.hr_manager_user)
        
        response = self.client.post('/api/employees/', {
            'firstName': 'New',
            'lastName': 'Employee',
            'employeeId': 'EMP999',
            'personalEmail': 'new@example.com',
            'mobileNumber': '9999999999',
            'joiningDate': '2024-01-01',
            'department': 'Computer Science',
            'designation': 'Developer'
        })
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Employee.objects.filter(employeeId='EMP999').count(), 1)
    
    def test_employee_cannot_update_employee(self):
        """Test Employee role cannot update employee records."""
        self._authenticate(self.employee_user)
        
        response = self.client.put(f'/api/employees/{self.cs_employee1.id}/', {
            'firstName': 'Updated',
            'lastName': 'Name',
            'employeeId': 'EMP001',
            'personalEmail': 'john@example.com',
            'mobileNumber': '1234567890',
            'joiningDate': '2024-01-01',
            'department': 'Computer Science',
            'designation': 'Senior Developer'
        })
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_hr_manager_can_update_employee(self):
        """Test HR Manager can update employee records."""
        self._authenticate(self.hr_manager_user)
        
        response = self.client.put(f'/api/employees/{self.cs_employee1.id}/', {
            'firstName': 'Updated',
            'lastName': 'Name',
            'employeeId': 'EMP001',
            'personalEmail': 'john@example.com',
            'mobileNumber': '1234567890',
            'joiningDate': '2024-01-01',
            'department': 'Computer Science',
            'designation': 'Senior Developer'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.cs_employee1.refresh_from_db()
        self.assertEqual(self.cs_employee1.firstName, 'Updated')


class LeaveManagementEndpointIntegrationTests(TestCase):
    """Integration tests for leave management endpoints with role-based filtering."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create roles
        self.employee_role, _ = ensure_role_exists(ROLE_EMPLOYEE)
        self.dept_head_role, _ = ensure_role_exists(ROLE_DEPARTMENT_HEAD)
        self.hr_manager_role, _ = ensure_role_exists(ROLE_HR_MANAGER)
        self.super_admin_role, _ = ensure_role_exists(ROLE_SUPER_ADMIN)
        
        # Create users
        self.employee_user = self._create_user_with_role('employee', ROLE_EMPLOYEE, 'Computer Science')
        self.dept_head_user = self._create_user_with_role('depthead', ROLE_DEPARTMENT_HEAD, 'Computer Science')
        self.hr_manager_user = self._create_user_with_role('hrmanager', ROLE_HR_MANAGER, 'HR')
        
        # Create employees
        self.cs_employee1 = Employee.objects.create(
            firstName='John',
            lastName='Doe',
            employeeId='EMP001',
            personalEmail='john@example.com',
            mobileNumber='1234567890',
            joiningDate='2024-01-01',
            department='Computer Science',
            designation='Developer'
        )
        
        self.cs_employee2 = Employee.objects.create(
            firstName='Jane',
            lastName='Smith',
            employeeId='EMP002',
            personalEmail='jane@example.com',
            mobileNumber='0987654321',
            joiningDate='2024-01-01',
            department='Computer Science',
            designation='Developer'
        )
        
        self.math_employee = Employee.objects.create(
            firstName='Bob',
            lastName='Johnson',
            employeeId='EMP003',
            personalEmail='bob@example.com',
            mobileNumber='5555555555',
            joiningDate='2024-01-01',
            department='Mathematics',
            designation='Professor'
        )
        
        # Link employees to user profiles
        self.employee_user.profile.employee = self.cs_employee1
        self.employee_user.profile.save()
        
        # Create leave requests
        self.cs_leave1 = LeaveRequest.objects.create(
            employee=self.cs_employee1,
            leave_type='Sick Leave',
            start_date='2024-02-01',
            end_date='2024-02-03',
            reason='Medical appointment',
            status='Pending'
        )
        
        self.cs_leave2 = LeaveRequest.objects.create(
            employee=self.cs_employee2,
            leave_type='Vacation',
            start_date='2024-03-01',
            end_date='2024-03-05',
            reason='Family vacation',
            status='Pending'
        )
        
        self.math_leave = LeaveRequest.objects.create(
            employee=self.math_employee,
            leave_type='Sick Leave',
            start_date='2024-02-10',
            end_date='2024-02-12',
            reason='Flu',
            status='Pending'
        )
    
    def _create_user_with_role(self, username, role_name, department):
        """Helper to create user with role and profile."""
        user = User.objects.create_user(
            username=username,
            email=f'{username}@example.com',
            password='testpass123'
        )
        UserProfile.objects.create(user=user, department=department)
        role, _ = ensure_role_exists(role_name)
        user.groups.add(role)
        return user
    
    def _authenticate(self, user):
        """Helper to authenticate a user and set credentials."""
        response = self.client.post('/api/auth/login/', {
            'username': user.username,
            'password': 'testpass123'
        })
        token = response.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        return token
    
    def test_employee_can_only_view_own_leave_requests(self):
        """Test Employee role can only view their own leave requests."""
        self._authenticate(self.employee_user)
        
        response = self.client.get('/api/leave-requests/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.cs_leave1.id)
    
    def test_department_head_can_view_department_leave_requests(self):
        """Test Department Head can view leave requests from their department."""
        self._authenticate(self.dept_head_user)
        
        response = self.client.get('/api/leave-requests/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        leave_ids = [leave['id'] for leave in response.data]
        self.assertIn(self.cs_leave1.id, leave_ids)
        self.assertIn(self.cs_leave2.id, leave_ids)
        self.assertNotIn(self.math_leave.id, leave_ids)
    
    def test_hr_manager_can_view_all_leave_requests(self):
        """Test HR Manager can view all leave requests."""
        self._authenticate(self.hr_manager_user)
        
        response = self.client.get('/api/leave-requests/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)
    
    def test_employee_can_create_leave_request(self):
        """Test Employee can create their own leave request."""
        self._authenticate(self.employee_user)
        
        response = self.client.post('/api/leave-requests/', {
            'employee': self.cs_employee1.id,
            'leaveType': 'Vacation',
            'startDate': '2024-04-01',
            'endDate': '2024-04-05',
            'reason': 'Personal vacation',
            'status': 'Pending'
        })
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(LeaveRequest.objects.filter(employee=self.cs_employee1).count(), 2)
    
    def test_employee_cannot_approve_leave_request(self):
        """Test Employee cannot approve leave requests."""
        self._authenticate(self.employee_user)
        
        response = self.client.patch(f'/api/leave-requests/{self.cs_leave1.id}/', {
            'status': 'Approved'
        })
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_department_head_can_approve_department_leave(self):
        """Test Department Head can approve leave requests from their department."""
        self._authenticate(self.dept_head_user)
        
        response = self.client.patch(f'/api/leave-requests/{self.cs_leave2.id}/', {
            'status': 'Approved'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.cs_leave2.refresh_from_db()
        self.assertEqual(self.cs_leave2.status, 'Approved')
    
    def test_department_head_cannot_approve_other_department_leave(self):
        """Test Department Head cannot approve leave from other departments."""
        self._authenticate(self.dept_head_user)
        
        response = self.client.patch(f'/api/leave-requests/{self.math_leave.id}/', {
            'status': 'Approved'
        })
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_hr_manager_can_approve_any_leave(self):
        """Test HR Manager can approve any leave request."""
        self._authenticate(self.hr_manager_user)
        
        response = self.client.patch(f'/api/leave-requests/{self.math_leave.id}/', {
            'status': 'Approved'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.math_leave.refresh_from_db()
        self.assertEqual(self.math_leave.status, 'Approved')


class RoleAssignmentRevocationIntegrationTests(TestCase):
    """Integration tests for role assignment and revocation endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create roles
        self.employee_role, _ = ensure_role_exists(ROLE_EMPLOYEE)
        self.dept_head_role, _ = ensure_role_exists(ROLE_DEPARTMENT_HEAD)
        self.hr_manager_role, _ = ensure_role_exists(ROLE_HR_MANAGER)
        self.super_admin_role, _ = ensure_role_exists(ROLE_SUPER_ADMIN)
        
        # Create users
        self.super_admin_user = self._create_user_with_role('superadmin', ROLE_SUPER_ADMIN, 'Admin')
        self.hr_manager_user = self._create_user_with_role('hrmanager', ROLE_HR_MANAGER, 'HR')
        self.target_user = User.objects.create_user(
            username='targetuser',
            email='target@example.com',
            password='testpass123'
        )
        UserProfile.objects.create(user=self.target_user, department='Computer Science')
        self.target_user.groups.add(self.employee_role)
    
    def _create_user_with_role(self, username, role_name, department):
        """Helper to create user with role and profile."""
        user = User.objects.create_user(
            username=username,
            email=f'{username}@example.com',
            password='testpass123'
        )
        UserProfile.objects.create(user=user, department=department)
        role, _ = ensure_role_exists(role_name)
        user.groups.add(role)
        return user
    
    def _authenticate(self, user):
        """Helper to authenticate a user and set credentials."""
        response = self.client.post('/api/auth/login/', {
            'username': user.username,
            'password': 'testpass123'
        })
        token = response.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        return token
    
    def test_super_admin_can_assign_role(self):
        """Test Super Admin can assign roles to users."""
        self._authenticate(self.super_admin_user)
        
        response = self.client.post(f'/api/auth/users/{self.target_user.id}/assign-role/', {
            'role_id': self.dept_head_role.id,
            'notes': 'Promoted to Department Head'
        })
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(self.target_user.groups.filter(id=self.dept_head_role.id).exists())
        self.assertEqual(RoleAssignment.objects.filter(user=self.target_user, role=self.dept_head_role).count(), 1)
    
    def test_super_admin_can_assign_temporary_role(self):
        """Test Super Admin can assign temporary roles with expiration."""
        self._authenticate(self.super_admin_user)
        
        expires_at = (timezone.now() + timedelta(days=30)).isoformat()
        
        response = self.client.post(f'/api/auth/users/{self.target_user.id}/assign-role/', {
            'role_id': self.hr_manager_role.id,
            'expires_at': expires_at,
            'notes': 'Temporary HR Manager access for 30 days'
        })
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('expires_at', response.data)
        self.assertIsNotNone(response.data['expires_at'])
    
    def test_hr_manager_cannot_assign_role(self):
        """Test HR Manager cannot assign roles (requires Super Admin)."""
        self._authenticate(self.hr_manager_user)
        
        response = self.client.post(f'/api/auth/users/{self.target_user.id}/assign-role/', {
            'role_id': self.dept_head_role.id,
            'notes': 'Attempting to assign role'
        })
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_cannot_assign_duplicate_role(self):
        """Test cannot assign a role that user already has."""
        self._authenticate(self.super_admin_user)
        
        response = self.client.post(f'/api/auth/users/{self.target_user.id}/assign-role/', {
            'role_id': self.employee_role.id,
            'notes': 'Attempting to assign duplicate role'
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already has the role', response.data['detail'])
    
    def test_role_assignment_creates_audit_log(self):
        """Test role assignment creates an audit log entry."""
        self._authenticate(self.super_admin_user)
        
        initial_count = AuditLog.objects.count()
        
        self.client.post(f'/api/auth/users/{self.target_user.id}/assign-role/', {
            'role_id': self.dept_head_role.id,
            'notes': 'Test assignment'
        })
        
        self.assertEqual(AuditLog.objects.count(), initial_count + 1)
        
        log_entry = AuditLog.objects.latest('timestamp')
        self.assertEqual(log_entry.action, 'ROLE_ASSIGNED')
        self.assertEqual(log_entry.actor, self.super_admin_user)
        self.assertEqual(log_entry.target_user, self.target_user)
        self.assertEqual(log_entry.resource_type, 'Role')
    
    def test_super_admin_can_revoke_role(self):
        """Test Super Admin can revoke roles from users."""
        self._authenticate(self.super_admin_user)
        
        # First assign a role
        self.target_user.groups.add(self.dept_head_role)
        RoleAssignment.objects.create(
            user=self.target_user,
            role=self.dept_head_role,
            assigned_by=self.super_admin_user,
            is_active=True
        )
        
        # Now revoke it
        response = self.client.post(f'/api/auth/users/{self.target_user.id}/revoke-role/', {
            'role_id': self.dept_head_role.id
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(self.target_user.groups.filter(id=self.dept_head_role.id).exists())
        
        # Check RoleAssignment is marked inactive
        assignment = RoleAssignment.objects.get(user=self.target_user, role=self.dept_head_role)
        self.assertFalse(assignment.is_active)
    
    def test_hr_manager_cannot_revoke_role(self):
        """Test HR Manager cannot revoke roles (requires Super Admin)."""
        self._authenticate(self.hr_manager_user)
        
        response = self.client.post(f'/api/auth/users/{self.target_user.id}/revoke-role/', {
            'role_id': self.employee_role.id
        })
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_cannot_revoke_role_user_does_not_have(self):
        """Test cannot revoke a role that user doesn't have."""
        self._authenticate(self.super_admin_user)
        
        response = self.client.post(f'/api/auth/users/{self.target_user.id}/revoke-role/', {
            'role_id': self.hr_manager_role.id
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('does not have the role', response.data['detail'])
    
    def test_role_revocation_creates_audit_log(self):
        """Test role revocation creates an audit log entry."""
        self._authenticate(self.super_admin_user)
        
        # Assign a role first
        self.target_user.groups.add(self.dept_head_role)
        RoleAssignment.objects.create(
            user=self.target_user,
            role=self.dept_head_role,
            assigned_by=self.super_admin_user,
            is_active=True
        )
        
        initial_count = AuditLog.objects.count()
        
        # Revoke the role
        self.client.post(f'/api/auth/users/{self.target_user.id}/revoke-role/', {
            'role_id': self.dept_head_role.id
        })
        
        self.assertEqual(AuditLog.objects.count(), initial_count + 1)
        
        log_entry = AuditLog.objects.latest('timestamp')
        self.assertEqual(log_entry.action, 'ROLE_REVOKED')
        self.assertEqual(log_entry.actor, self.super_admin_user)
        self.assertEqual(log_entry.target_user, self.target_user)
    
    def test_user_can_view_own_roles(self):
        """Test users can view their own role assignments."""
        self._authenticate(self.target_user)
        
        response = self.client.get(f'/api/auth/users/{self.target_user.id}/roles/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('roles', response.data)
        self.assertIn(ROLE_EMPLOYEE, response.data['roles'])
    
    def test_super_admin_can_view_any_user_roles(self):
        """Test Super Admin can view any user's role assignments."""
        self._authenticate(self.super_admin_user)
        
        response = self.client.get(f'/api/auth/users/{self.target_user.id}/roles/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('roles', response.data)
    
    def test_user_cannot_view_other_user_roles(self):
        """Test users cannot view other users' role assignments."""
        other_user = User.objects.create_user(
            username='otheruser',
            password='testpass123'
        )
        UserProfile.objects.create(user=other_user, department='Mathematics')
        other_user.groups.add(self.employee_role)
        
        self._authenticate(self.target_user)
        
        response = self.client.get(f'/api/auth/users/{other_user.id}/roles/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class AuditLogEndpointIntegrationTests(TestCase):
    """Integration tests for audit log endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create roles
        self.employee_role, _ = ensure_role_exists(ROLE_EMPLOYEE)
        self.super_admin_role, _ = ensure_role_exists(ROLE_SUPER_ADMIN)
        
        # Create users
        self.super_admin_user = self._create_user_with_role('superadmin', ROLE_SUPER_ADMIN, 'Admin')
        self.employee_user = self._create_user_with_role('employee', ROLE_EMPLOYEE, 'Computer Science')
        self.target_user = User.objects.create_user(
            username='targetuser',
            email='target@example.com',
            password='testpass123'
        )
        UserProfile.objects.create(user=self.target_user, department='Computer Science')
        
        # Create audit log entries
        self.log1 = AuditLog.objects.create(
            action='ROLE_ASSIGNED',
            actor=self.super_admin_user,
            target_user=self.target_user,
            resource_type='Role',
            resource_id=self.employee_role.id,
            details={'role_name': 'Employee'},
            ip_address='192.168.1.1'
        )
        
        self.log2 = AuditLog.objects.create(
            action='ACCESS_DENIED',
            actor=self.employee_user,
            resource_type='Employee',
            resource_id=1,
            details={'required_permission': 'manage_employees'},
            ip_address='192.168.1.2'
        )
        
        self.log3 = AuditLog.objects.create(
            action='ROLE_REVOKED',
            actor=self.super_admin_user,
            target_user=self.target_user,
            resource_type='Role',
            resource_id=self.employee_role.id,
            details={'role_name': 'Employee'},
            ip_address='192.168.1.1'
        )
    
    def _create_user_with_role(self, username, role_name, department):
        """Helper to create user with role and profile."""
        user = User.objects.create_user(
            username=username,
            email=f'{username}@example.com',
            password='testpass123'
        )
        UserProfile.objects.create(user=user, department=department)
        role, _ = ensure_role_exists(role_name)
        user.groups.add(role)
        return user
    
    def _authenticate(self, user):
        """Helper to authenticate a user and set credentials."""
        response = self.client.post('/api/auth/login/', {
            'username': user.username,
            'password': 'testpass123'
        })
        token = response.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        return token
    
    def test_super_admin_can_view_audit_logs(self):
        """Test Super Admin can view audit logs."""
        self._authenticate(self.super_admin_user)
        
        response = self.client.get('/api/auth/audit-logs/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 3)
    
    def test_employee_cannot_view_audit_logs(self):
        """Test Employee cannot view audit logs."""
        self._authenticate(self.employee_user)
        
        response = self.client.get('/api/auth/audit-logs/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_filter_audit_logs_by_action(self):
        """Test filtering audit logs by action type."""
        self._authenticate(self.super_admin_user)
        
        response = self.client.get('/api/auth/audit-logs/?action=ROLE_ASSIGNED')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
        for log in response.data:
            self.assertEqual(log['action'], 'ROLE_ASSIGNED')
    
    def test_filter_audit_logs_by_user_id(self):
        """Test filtering audit logs by actor user ID."""
        self._authenticate(self.super_admin_user)
        
        response = self.client.get(f'/api/auth/audit-logs/?user_id={self.super_admin_user.id}')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for log in response.data:
            if log['actor']:
                self.assertEqual(log['actor']['id'], self.super_admin_user.id)
    
    def test_filter_audit_logs_by_target_user_id(self):
        """Test filtering audit logs by target user ID."""
        self._authenticate(self.super_admin_user)
        
        response = self.client.get(f'/api/auth/audit-logs/?target_user_id={self.target_user.id}')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for log in response.data:
            if log['target_user']:
                self.assertEqual(log['target_user']['id'], self.target_user.id)
    
    def test_filter_audit_logs_by_resource_type(self):
        """Test filtering audit logs by resource type."""
        self._authenticate(self.super_admin_user)
        
        response = self.client.get('/api/auth/audit-logs/?resource_type=Role')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for log in response.data:
            self.assertEqual(log['resource_type'], 'Role')
    
    def test_export_audit_logs_as_csv(self):
        """Test exporting audit logs as CSV."""
        self._authenticate(self.super_admin_user)
        
        response = self.client.get('/api/auth/audit-logs/?export=csv')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('attachment', response['Content-Disposition'])
        self.assertIn('audit_logs_', response['Content-Disposition'])


class ForbiddenResponseIntegrationTests(TestCase):
    """Integration tests for 403 Forbidden responses with proper error messages."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create roles
        self.employee_role, _ = ensure_role_exists(ROLE_EMPLOYEE)
        self.dept_head_role, _ = ensure_role_exists(ROLE_DEPARTMENT_HEAD)
        
        # Create users
        self.employee_user = self._create_user_with_role('employee', ROLE_EMPLOYEE, 'Computer Science')
        self.dept_head_user = self._create_user_with_role('depthead', ROLE_DEPARTMENT_HEAD, 'Computer Science')
        
        # Create employees
        self.cs_employee = Employee.objects.create(
            firstName='John',
            lastName='Doe',
            employeeId='EMP001',
            personalEmail='john@example.com',
            mobileNumber='1234567890',
            joiningDate='2024-01-01',
            department='Computer Science',
            designation='Developer'
        )
        
        self.math_employee = Employee.objects.create(
            firstName='Bob',
            lastName='Johnson',
            employeeId='EMP002',
            personalEmail='bob@example.com',
            mobileNumber='5555555555',
            joiningDate='2024-01-01',
            department='Mathematics',
            designation='Professor'
        )
        
        # Link employee to employee_user profile
        self.employee_user.profile.employee = self.cs_employee
        self.employee_user.profile.save()
    
    def _create_user_with_role(self, username, role_name, department):
        """Helper to create user with role and profile."""
        user = User.objects.create_user(
            username=username,
            email=f'{username}@example.com',
            password='testpass123'
        )
        UserProfile.objects.create(user=user, department=department)
        role, _ = ensure_role_exists(role_name)
        user.groups.add(role)
        return user
    
    def _authenticate(self, user):
        """Helper to authenticate a user and set credentials."""
        response = self.client.post('/api/auth/login/', {
            'username': user.username,
            'password': 'testpass123'
        })
        token = response.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        return token
    
    def test_403_response_for_insufficient_permissions(self):
        """Test 403 response when user lacks required permissions."""
        self._authenticate(self.employee_user)
        
        response = self.client.post('/api/employees/', {
            'firstName': 'New',
            'lastName': 'Employee',
            'employeeId': 'EMP999',
            'personalEmail': 'new@example.com',
            'mobileNumber': '9999999999',
            'joiningDate': '2024-01-01',
            'department': 'Computer Science',
            'designation': 'Developer'
        })
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('detail', response.data)
    
    def test_403_response_for_department_scope_violation(self):
        """Test 403 response when accessing resources outside department scope."""
        self._authenticate(self.dept_head_user)
        
        # Try to access employee from different department
        response = self.client.get(f'/api/employees/{self.math_employee.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_403_response_creates_audit_log(self):
        """Test 403 responses create audit log entries."""
        self._authenticate(self.employee_user)
        
        initial_count = AuditLog.objects.filter(action='ACCESS_DENIED').count()
        
        # Attempt unauthorized action
        self.client.post('/api/employees/', {
            'firstName': 'New',
            'lastName': 'Employee',
            'employeeId': 'EMP999',
            'personalEmail': 'new@example.com',
            'mobileNumber': '9999999999',
            'joiningDate': '2024-01-01',
            'department': 'Computer Science',
            'designation': 'Developer'
        })
        
        # Check if audit log was created
        final_count = AuditLog.objects.filter(action='ACCESS_DENIED').count()
        self.assertGreater(final_count, initial_count)
    
    def test_403_response_for_role_management_without_super_admin(self):
        """Test 403 response when non-Super Admin tries role management."""
        self._authenticate(self.dept_head_user)
        
        response = self.client.get('/api/auth/roles/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_403_response_for_audit_logs_without_super_admin(self):
        """Test 403 response when non-Super Admin tries to view audit logs."""
        self._authenticate(self.employee_user)
        
        response = self.client.get('/api/auth/audit-logs/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
