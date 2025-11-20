"""
Tests for custom exception handler and permission error responses.
"""
from django.test import TestCase, RequestFactory
from django.contrib.auth.models import User, Group
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from .models import UserProfile
from employee_management.models import Employee


class PermissionErrorHandlingTestCase(APITestCase):
    """Test cases for permission error handling and 403 responses."""
    
    def setUp(self):
        """Set up test data."""
        # Create roles
        self.employee_role = Group.objects.create(name='Employee')
        self.hr_manager_role = Group.objects.create(name='HR Manager')
        self.super_admin_role = Group.objects.create(name='Super Admin')
        
        # Create test users
        self.employee_user = User.objects.create_user(
            username='employee1',
            email='employee1@test.com',
            password='testpass123'
        )
        self.employee_user.groups.add(self.employee_role)
        
        self.hr_user = User.objects.create_user(
            username='hrmanager1',
            email='hr1@test.com',
            password='testpass123'
        )
        self.hr_user.groups.add(self.hr_manager_role)
        
        # Create user profiles
        self.employee_profile = UserProfile.objects.create(
            user=self.employee_user,
            department='Computer Science'
        )
        
        self.hr_profile = UserProfile.objects.create(
            user=self.hr_user,
            department='Human Resources'
        )
        
        # Create employee records
        self.employee_record = Employee.objects.create(
            employeeId='EMP001',
            firstName='John',
            lastName='Doe',
            personalEmail='employee1@test.com',
            department='Computer Science',
            designation='Lecturer',
            joiningDate='2024-01-01'
        )
        
        self.employee_profile.employee = self.employee_record
        self.employee_profile.save()
        
        # Create tokens
        self.employee_token = Token.objects.create(user=self.employee_user)
        self.hr_token = Token.objects.create(user=self.hr_user)
        
        self.client = APIClient()
    
    def test_403_response_includes_user_roles(self):
        """Test that 403 responses include user's current roles."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.employee_token.key}')
        
        # Try to access role management endpoint (requires Super Admin)
        response = self.client.get('/api/roles/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('user_roles', response.data)
        self.assertIn('Employee', response.data['user_roles'])
    
    def test_403_response_includes_required_roles(self):
        """Test that 403 responses include required roles."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.employee_token.key}')
        
        # Try to access role management endpoint
        response = self.client.get('/api/roles/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('required_roles', response.data)
    
    def test_403_response_includes_user_friendly_message(self):
        """Test that 403 responses include user-friendly messages."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.employee_token.key}')
        
        # Try to access role management endpoint
        response = self.client.get('/api/roles/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('message', response.data)
        self.assertTrue(len(response.data['message']) > 0)
    
    def test_403_response_includes_department_info(self):
        """Test that 403 responses include department information when applicable."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.employee_token.key}')
        
        # Try to access an endpoint that might trigger department scope check
        response = self.client.get('/api/employees/')
        
        # If 403, should include department info
        if response.status_code == status.HTTP_403_FORBIDDEN:
            self.assertIn('user_department', response.data)
            self.assertEqual(response.data['user_department'], 'Computer Science')
    
    def test_403_response_structure(self):
        """Test that 403 responses have the correct structure."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.employee_token.key}')
        
        # Try to access role management endpoint
        response = self.client.get('/api/roles/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Check required fields
        self.assertIn('detail', response.data)
        self.assertIn('status_code', response.data)
        self.assertIn('error_type', response.data)
        self.assertIn('message', response.data)
        
        # Check values
        self.assertEqual(response.data['status_code'], 403)
        self.assertEqual(response.data['error_type'], 'PermissionDenied')
    
    def test_hr_manager_can_access_employees(self):
        """Test that HR Manager can access employee endpoints (no 403)."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.hr_token.key}')
        
        # HR Manager should be able to access employees
        response = self.client.get('/api/employees/')
        
        # Should not be 403
        self.assertNotEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_employee_cannot_delete_other_employees(self):
        """Test that Employee role cannot delete other employees."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.employee_token.key}')
        
        # Try to delete an employee
        response = self.client.delete(f'/api/employees/{self.employee_record.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('message', response.data)
