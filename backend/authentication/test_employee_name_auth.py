"""
Tests for employee name data in authentication responses.
"""
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

from .models import UserProfile
from .utils import ensure_role_exists, ROLE_EMPLOYEE
from employee_management.models import Employee


class EmployeeNameAuthenticationTests(TestCase):
    """Test cases for employee name data in authentication responses."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create employee role manually to avoid utils.py bug
        from django.contrib.auth.models import Group
        self.employee_role, _ = Group.objects.get_or_create(name=ROLE_EMPLOYEE)
        
        # Create user
        self.user = User.objects.create_user(
            username='test@example.com',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create employee
        self.employee = Employee.objects.create(
            firstName='John',
            lastName='Doe',
            employeeId='EMP001',
            personalEmail='test@example.com',
            mobileNumber='1234567890',
            joiningDate='2024-01-01',
            department='Computer Science',
            designation='Developer'
        )
        
        # Create user profile linking user and employee
        self.profile = UserProfile.objects.create(
            user=self.user,
            employee=self.employee,
            department='Computer Science',
            password_changed=True
        )
        
        # Assign employee role
        self.user.groups.add(self.employee_role)
    
    def test_login_returns_employee_name_fields(self):
        """Test login endpoint returns employee name fields."""
        response = self.client.post('/api/auth/login/', {
            'username': 'test@example.com',
            'password': 'testpass123'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('first_name', response.data)
        self.assertIn('last_name', response.data)
        self.assertIn('full_name', response.data)
        self.assertIn('employee_id', response.data)
        self.assertIn('requires_password_change', response.data)
        
        self.assertEqual(response.data['first_name'], 'John')
        self.assertEqual(response.data['last_name'], 'Doe')
        self.assertEqual(response.data['full_name'], 'John Doe')
        self.assertEqual(response.data['employee_id'], 'EMP001')
        self.assertFalse(response.data['requires_password_change'])
    
    def test_login_returns_null_when_no_employee_link(self):
        """Test login returns null for employee fields when no employee is linked."""
        # Create user without employee link
        user_no_employee = User.objects.create_user(
            username='noemployee@example.com',
            email='noemployee@example.com',
            password='testpass123'
        )
        
        UserProfile.objects.create(
            user=user_no_employee,
            department='HR',
            password_changed=True
        )
        
        user_no_employee.groups.add(self.employee_role)
        
        response = self.client.post('/api/auth/login/', {
            'username': 'noemployee@example.com',
            'password': 'testpass123'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data['first_name'])
        self.assertIsNone(response.data['last_name'])
        self.assertIsNone(response.data['full_name'])
        self.assertIsNone(response.data['employee_id'])
    
    def test_login_returns_requires_password_change_flag(self):
        """Test login returns requires_password_change flag based on UserProfile."""
        # Create user with password_changed=False
        user_new = User.objects.create_user(
            username='newuser@example.com',
            email='newuser@example.com',
            password='temppass123'
        )
        
        employee_new = Employee.objects.create(
            firstName='Jane',
            lastName='Smith',
            employeeId='EMP002',
            personalEmail='newuser@example.com',
            mobileNumber='0987654321',
            joiningDate='2024-01-15',
            department='Mathematics',
            designation='Professor'
        )
        
        UserProfile.objects.create(
            user=user_new,
            employee=employee_new,
            department='Mathematics',
            password_changed=False  # New user needs to change password
        )
        
        user_new.groups.add(self.employee_role)
        
        response = self.client.post('/api/auth/login/', {
            'username': 'newuser@example.com',
            'password': 'temppass123'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['requires_password_change'])
    
    def test_current_user_endpoint_returns_employee_name_fields(self):
        """Test /api/auth/me/ returns employee name fields."""
        # Login to get token
        login_response = self.client.post('/api/auth/login/', {
            'username': 'test@example.com',
            'password': 'testpass123'
        })
        token = login_response.data['token']
        
        # Call /api/auth/me/
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        response = self.client.get('/api/auth/me/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('first_name', response.data)
        self.assertIn('last_name', response.data)
        self.assertIn('full_name', response.data)
        self.assertIn('employee_id', response.data)
        self.assertIn('requires_password_change', response.data)
        
        self.assertEqual(response.data['first_name'], 'John')
        self.assertEqual(response.data['last_name'], 'Doe')
        self.assertEqual(response.data['full_name'], 'John Doe')
        self.assertEqual(response.data['employee_id'], 'EMP001')
        self.assertFalse(response.data['requires_password_change'])
    
    def test_current_user_endpoint_returns_null_when_no_employee_link(self):
        """Test /api/auth/me/ returns null for employee fields when no employee is linked."""
        # Create user without employee link
        user_no_employee = User.objects.create_user(
            username='noemployee2@example.com',
            email='noemployee2@example.com',
            password='testpass123'
        )
        
        UserProfile.objects.create(
            user=user_no_employee,
            department='HR',
            password_changed=True
        )
        
        user_no_employee.groups.add(self.employee_role)
        
        # Login to get token
        login_response = self.client.post('/api/auth/login/', {
            'username': 'noemployee2@example.com',
            'password': 'testpass123'
        })
        token = login_response.data['token']
        
        # Call /api/auth/me/
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        response = self.client.get('/api/auth/me/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data['first_name'])
        self.assertIsNone(response.data['last_name'])
        self.assertIsNone(response.data['full_name'])
        self.assertIsNone(response.data['employee_id'])
