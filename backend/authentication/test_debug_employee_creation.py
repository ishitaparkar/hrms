"""
Debug test to check employee creation issues.
"""
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

from .models import UserProfile
from .utils import ensure_role_exists, ROLE_SUPER_ADMIN


class DebugEmployeeCreationTest(TestCase):
    """Debug test for employee creation."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create Super Admin role and user
        self.super_admin_role, _ = ensure_role_exists(ROLE_SUPER_ADMIN)
        
        self.super_admin_user = User.objects.create_user(
            username='super.admin',
            email='admin@company.com',
            password='superadmin123'
        )
        
        self.super_admin_profile = UserProfile.objects.create(
            user=self.super_admin_user,
            department='Administration',
            phone_number='+15551234567'
        )
        
        self.super_admin_user.groups.add(self.super_admin_role)
        
        # Test employee data
        self.employee_data = {
            'firstName': 'John',
            'lastName': 'Doe',
            'employeeId': 'EMP001',
            'personalEmail': 'john.doe@company.com',
            'mobileNumber': '+19876543210',
            'joiningDate': '2024-01-15',
            'department': 'Engineering',
            'designation': 'Software Developer'
        }
    
    def test_debug_employee_creation(self):
        """Debug employee creation to see what's failing."""
        # Login as Super Admin
        login_response = self.client.post('/api/auth/login/', {
            'username': 'super.admin',
            'password': 'superadmin123'
        })
        
        print(f"Login response: {login_response.status_code}")
        print(f"Login data: {login_response.data}")
        
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        
        admin_token = login_response.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {admin_token}')
        
        # Try to create employee
        create_response = self.client.post('/api/employees/', self.employee_data)
        
        print(f"Create response status: {create_response.status_code}")
        print(f"Create response data: {create_response.data}")
        
        if create_response.status_code != status.HTTP_201_CREATED:
            print(f"Employee creation failed with: {create_response.data}")