"""
Integration tests for Super Admin authorization enforcement.

Tests employee creation with different user roles to verify authorization checks.
**Validates: Requirements 8.1, 8.2**
"""
from django.test import TestCase
from django.contrib.auth.models import User, Group
from rest_framework.test import APIClient
from rest_framework import status
from employee_management.models import Employee
from authentication.models import UserProfile, AuditLog
from authentication.utils import ROLE_SUPER_ADMIN, ROLE_HR_MANAGER, ROLE_EMPLOYEE


class TestSuperAdminAuthorizationIntegration(TestCase):
    """
    Integration tests for Super Admin authorization on employee creation.
    """
    
    def setUp(self):
        """Set up test client, users, and roles."""
        self.client = APIClient()
        
        # Create role groups
        self.super_admin_group, _ = Group.objects.get_or_create(name=ROLE_SUPER_ADMIN)
        self.hr_manager_group, _ = Group.objects.get_or_create(name=ROLE_HR_MANAGER)
        self.employee_group, _ = Group.objects.get_or_create(name=ROLE_EMPLOYEE)
        
        # Create test users with different roles
        self.super_admin_user = self._create_user_with_role('superadmin', ROLE_SUPER_ADMIN)
        self.hr_manager_user = self._create_user_with_role('hrmanager', ROLE_HR_MANAGER)
        self.employee_user = self._create_user_with_role('employee', ROLE_EMPLOYEE)
        
        # Sample employee data
        self.employee_data = {
            'firstName': 'John',
            'lastName': 'Doe',
            'employeeId': 'EMP001',
            'personalEmail': 'john.doe@example.com',
            'mobileNumber': '+91 9876543210',
            'department': 'Engineering',
            'designation': 'Software Engineer',
            'joiningDate': '2025-01-15',
        }
    
    def _create_user_with_role(self, username, role_name):
        """Helper to create a user with a specific role."""
        user = User.objects.create_user(
            username=username,
            password='testpass123',
            email=f'{username}@example.com'
        )
        
        if role_name == ROLE_SUPER_ADMIN:
            user.groups.add(self.super_admin_group)
        elif role_name == ROLE_HR_MANAGER:
            user.groups.add(self.hr_manager_group)
        elif role_name == ROLE_EMPLOYEE:
            user.groups.add(self.employee_group)
        
        # Create user profile
        UserProfile.objects.create(user=user)
        
        return user
    
    def test_super_admin_can_create_employee(self):
        """
        Test that Super Admin can successfully create an employee.
        
        Validates: Requirements 8.1
        """
        # Authenticate as Super Admin
        self.client.force_authenticate(user=self.super_admin_user)
        
        # Attempt to create employee
        response = self.client.post('/api/employees/', self.employee_data, format='json')
        
        # Should succeed
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('firstName', response.data)
        self.assertEqual(response.data['firstName'], 'John')
        
        # Verify employee was created in database
        employee = Employee.objects.get(personalEmail='john.doe@example.com')
        self.assertEqual(employee.firstName, 'John')
        self.assertEqual(employee.lastName, 'Doe')
        self.assertEqual(employee.department, 'Engineering')
        
        # Verify audit log was created (Requirement 8.3)
        audit_logs = AuditLog.objects.filter(
            action='EMPLOYEE_CREATED',
            actor=self.super_admin_user
        )
        self.assertTrue(audit_logs.exists(), "Audit log should be created for employee creation")
    
    def test_hr_manager_cannot_create_employee(self):
        """
        Test that HR Manager cannot create an employee.
        
        Validates: Requirements 8.1, 8.2
        """
        # Authenticate as HR Manager
        self.client.force_authenticate(user=self.hr_manager_user)
        
        # Attempt to create employee
        response = self.client.post('/api/employees/', self.employee_data, format='json')
        
        # Should be forbidden
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('detail', response.data)
        
        # Verify employee was NOT created
        self.assertFalse(
            Employee.objects.filter(personalEmail='john.doe@example.com').exists()
        )
    
    def test_regular_employee_cannot_create_employee(self):
        """
        Test that regular Employee cannot create an employee.
        
        Validates: Requirements 8.1, 8.2
        """
        # Authenticate as regular Employee
        self.client.force_authenticate(user=self.employee_user)
        
        # Attempt to create employee
        response = self.client.post('/api/employees/', self.employee_data, format='json')
        
        # Should be forbidden
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Verify employee was NOT created
        self.assertFalse(
            Employee.objects.filter(personalEmail='john.doe@example.com').exists()
        )
    
    def test_unauthenticated_user_cannot_create_employee(self):
        """
        Test that unauthenticated user cannot create an employee.
        
        Validates: Requirements 8.1, 8.2
        """
        # No authentication
        self.client.force_authenticate(user=None)
        
        # Attempt to create employee
        response = self.client.post('/api/employees/', self.employee_data, format='json')
        
        # Should be unauthorized or forbidden
        self.assertIn(response.status_code, [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN
        ])
        
        # Verify employee was NOT created
        self.assertFalse(
            Employee.objects.filter(personalEmail='john.doe@example.com').exists()
        )
    
    def test_super_admin_user_id_recorded_in_audit_log(self):
        """
        Test that Super Admin's user ID is recorded in audit log.
        
        Validates: Requirements 8.3
        """
        # Authenticate as Super Admin
        self.client.force_authenticate(user=self.super_admin_user)
        
        # Create employee
        response = self.client.post('/api/employees/', self.employee_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify audit log contains Super Admin's user ID
        audit_log = AuditLog.objects.filter(
            action='EMPLOYEE_CREATED',
            actor=self.super_admin_user
        ).first()
        
        self.assertIsNotNone(audit_log, "Audit log should exist")
        self.assertEqual(audit_log.actor.id, self.super_admin_user.id)
        self.assertEqual(audit_log.actor.username, 'superadmin')
    
    def test_multiple_employees_creation_by_super_admin(self):
        """
        Test that Super Admin can create multiple employees.
        
        Validates: Requirements 8.1
        """
        # Authenticate as Super Admin
        self.client.force_authenticate(user=self.super_admin_user)
        
        # Create first employee
        response1 = self.client.post('/api/employees/', self.employee_data, format='json')
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        
        # Create second employee with different data
        employee_data_2 = self.employee_data.copy()
        employee_data_2['employeeId'] = 'EMP002'
        employee_data_2['personalEmail'] = 'jane.smith@example.com'
        employee_data_2['firstName'] = 'Jane'
        employee_data_2['lastName'] = 'Smith'
        employee_data_2['mobileNumber'] = '+91 9876543211'
        
        response2 = self.client.post('/api/employees/', employee_data_2, format='json')
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)
        
        # Verify both employees exist
        self.assertEqual(Employee.objects.count(), 2)
        self.assertTrue(Employee.objects.filter(personalEmail='john.doe@example.com').exists())
        self.assertTrue(Employee.objects.filter(personalEmail='jane.smith@example.com').exists())
    
    def test_session_expiration_requires_reauthentication(self):
        """
        Test that expired session requires re-authentication.
        
        Validates: Requirements 8.4
        """
        # Authenticate as Super Admin
        self.client.force_authenticate(user=self.super_admin_user)
        
        # Create employee successfully
        response = self.client.post('/api/employees/', self.employee_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Simulate session expiration by removing authentication
        self.client.force_authenticate(user=None)
        
        # Attempt to create another employee
        employee_data_2 = self.employee_data.copy()
        employee_data_2['employeeId'] = 'EMP002'
        employee_data_2['personalEmail'] = 'jane.smith@example.com'
        employee_data_2['mobileNumber'] = '+91 9876543211'
        
        response = self.client.post('/api/employees/', employee_data_2, format='json')
        
        # Should require authentication
        self.assertIn(response.status_code, [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN
        ])
        
        # Verify second employee was NOT created
        self.assertFalse(
            Employee.objects.filter(personalEmail='jane.smith@example.com').exists()
        )
