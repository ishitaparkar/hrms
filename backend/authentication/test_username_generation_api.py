"""
Integration tests for username generation API endpoint.

These tests verify the complete username generation flow through the API,
including JWT token authentication, username generation with various names,
duplicate username handling, and special character removal.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**
"""
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
import jwt
from datetime import timedelta

from authentication.models import AccountSetupToken, UserProfile
from authentication.services import PhoneAuthenticationService
from employee_management.models import Employee
from django.conf import settings


class UsernameGenerationAPIIntegrationTests(TestCase):
    """
    Integration tests for username generation API endpoint.
    
    Tests the complete flow from HTTP request to response, including:
    - JWT token authentication
    - Username generation with various names
    - Duplicate username handling
    - Special character removal
    - Employee details display
    - Error handling
    
    **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
    """
    
    def setUp(self):
        """Set up test fixtures."""
        self.client = APIClient()
        self.url = reverse('generate-username')
        
        # Create a test employee
        self.employee = Employee.objects.create(
            firstName='John',
            lastName='Doe',
            personalEmail='john.doe@example.com',
            mobileNumber='+14155552671',
            employeeId='EMP001',
            department='Engineering',
            designation='Software Engineer',
            joiningDate=timezone.now().date(),
        )
        
        # Generate a valid auth token for the employee
        self.auth_token = PhoneAuthenticationService.generate_auth_token(self.employee)
    
    def tearDown(self):
        """Clean up test data."""
        Employee.objects.all().delete()
        AccountSetupToken.objects.all().delete()
        User.objects.all().delete()
        UserProfile.objects.all().delete()
    
    def test_successful_username_generation(self):
        """
        Test successful username generation with valid token.
        
        Verifies that:
        1. Valid JWT token is accepted
        2. Username is generated in correct format (firstname.lastname)
        3. Employee details are returned
        4. Response includes all required fields
        
        **Validates: Requirements 4.1, 4.2**
        """
        # Set authorization header
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.auth_token}')
        
        # Make request
        response = self.client.post(self.url, {}, format='json')
        
        # Verify response status
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify response structure
        self.assertIn('username', response.data)
        self.assertIn('employee_details', response.data)
        
        # Verify username format
        expected_username = 'john.doe'
        self.assertEqual(response.data['username'], expected_username)
        
        # Verify employee details
        employee_details = response.data['employee_details']
        self.assertEqual(employee_details['first_name'], self.employee.firstName)
        self.assertEqual(employee_details['last_name'], self.employee.lastName)
        self.assertEqual(employee_details['email'], self.employee.personalEmail)
        self.assertEqual(employee_details['department'], self.employee.department)
        self.assertEqual(employee_details['designation'], self.employee.designation)
    
    def test_username_generation_with_uppercase_names(self):
        """
        Test username generation converts uppercase names to lowercase.
        
        **Validates: Requirements 4.2**
        """
        # Create employee with uppercase names
        employee = Employee.objects.create(
            firstName='ALICE',
            lastName='SMITH',
            personalEmail='alice.smith@example.com',
            mobileNumber='+14155559999',
            employeeId='EMP002',
            department='Marketing',
            designation='Marketing Manager',
            joiningDate=timezone.now().date(),
        )
        
        # Generate token for this employee
        auth_token = PhoneAuthenticationService.generate_auth_token(employee)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {auth_token}')
        
        # Make request
        response = self.client.post(self.url, {}, format='json')
        
        # Verify username is lowercase
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'alice.smith')
        
        # Clean up
        employee.delete()
    
    def test_username_generation_with_special_characters(self):
        """
        Test username generation removes special characters from names.
        
        **Validates: Requirements 4.3**
        """
        # Create employee with special characters in name
        employee = Employee.objects.create(
            firstName="O'Brien",
            lastName='Smith-Jones',
            personalEmail='obrien.smithjones@example.com',
            mobileNumber='+14155558888',
            employeeId='EMP003',
            department='HR',
            designation='HR Manager',
            joiningDate=timezone.now().date(),
        )
        
        # Generate token for this employee
        auth_token = PhoneAuthenticationService.generate_auth_token(employee)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {auth_token}')
        
        # Make request
        response = self.client.post(self.url, {}, format='json')
        
        # Verify special characters are removed
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # O'Brien -> obrien, Smith-Jones -> smithjones
        self.assertEqual(response.data['username'], 'obrien.smithjones')
        
        # Clean up
        employee.delete()
    
    def test_username_generation_with_duplicate_username(self):
        """
        Test username generation handles duplicate usernames with numeric suffix.
        
        **Validates: Requirements 4.4**
        """
        # Create a user with the username that would be generated
        existing_user = User.objects.create_user(
            username='john.doe',
            email='existing@example.com',
            password='testpass123'
        )
        
        # Set authorization header
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.auth_token}')
        
        # Make request
        response = self.client.post(self.url, {}, format='json')
        
        # Verify username has numeric suffix
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'john.doe2')
        
        # Clean up
        existing_user.delete()
    
    def test_username_generation_with_multiple_duplicates(self):
        """
        Test username generation handles multiple duplicate usernames.
        
        **Validates: Requirements 4.4**
        """
        # Create users with john.doe, john.doe2, john.doe3
        user1 = User.objects.create_user(username='john.doe', email='user1@example.com', password='pass')
        user2 = User.objects.create_user(username='john.doe2', email='user2@example.com', password='pass')
        user3 = User.objects.create_user(username='john.doe3', email='user3@example.com', password='pass')
        
        # Set authorization header
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.auth_token}')
        
        # Make request
        response = self.client.post(self.url, {}, format='json')
        
        # Verify username has correct suffix
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'john.doe4')
        
        # Clean up
        user1.delete()
        user2.delete()
        user3.delete()
    
    def test_username_generation_with_numbers_in_name(self):
        """
        Test username generation preserves numbers in names.
        
        **Validates: Requirements 4.3**
        """
        # Create employee with numbers in name
        employee = Employee.objects.create(
            firstName='John2',
            lastName='Doe3',
            personalEmail='john2.doe3@example.com',
            mobileNumber='+14155557777',
            employeeId='EMP004',
            department='IT',
            designation='IT Support',
            joiningDate=timezone.now().date(),
        )
        
        # Generate token for this employee
        auth_token = PhoneAuthenticationService.generate_auth_token(employee)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {auth_token}')
        
        # Make request
        response = self.client.post(self.url, {}, format='json')
        
        # Verify numbers are preserved
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'john2.doe3')
        
        # Clean up
        employee.delete()
    
    def test_username_generation_without_token(self):
        """
        Test username generation fails without authentication token.
        
        **Validates: Requirements 4.1**
        """
        # Make request without token
        response = self.client.post(self.url, {}, format='json')
        
        # Verify authentication is required
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_username_generation_with_invalid_token(self):
        """
        Test username generation fails with invalid JWT token.
        
        **Validates: Requirements 4.1**
        """
        # Set invalid token
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid.token.here')
        
        # Make request
        response = self.client.post(self.url, {}, format='json')
        
        # Verify authentication fails
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_username_generation_with_expired_token(self):
        """
        Test username generation fails with expired JWT token.
        
        **Validates: Requirements 4.1**
        """
        # Create an expired token
        expired_time = timezone.now() - timedelta(hours=2)
        payload = {
            'employee_id': self.employee.id,
            'employee_email': self.employee.personalEmail,
            'exp': expired_time,
            'iat': expired_time - timedelta(hours=1)
        }
        expired_token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
        
        # Set expired token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {expired_token}')
        
        # Make request
        response = self.client.post(self.url, {}, format='json')
        
        # Verify authentication fails
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_username_generation_with_nonexistent_employee(self):
        """
        Test username generation fails when employee doesn't exist.
        
        **Validates: Requirements 4.1**
        """
        # Create a token for a non-existent employee
        payload = {
            'employee_id': 99999,  # Non-existent ID
            'employee_email': 'nonexistent@example.com',
            'exp': timezone.now() + timedelta(hours=1),
            'iat': timezone.now()
        }
        fake_token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
        
        # Set fake token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {fake_token}')
        
        # Make request
        response = self.client.post(self.url, {}, format='json')
        
        # Verify error is returned
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_username_generation_with_unicode_characters(self):
        """
        Test username generation handles unicode characters.
        
        **Validates: Requirements 4.3**
        """
        # Create employee with unicode characters
        employee = Employee.objects.create(
            firstName='José',
            lastName='García',
            personalEmail='jose.garcia@example.com',
            mobileNumber='+14155556666',
            employeeId='EMP005',
            department='Sales',
            designation='Sales Rep',
            joiningDate=timezone.now().date(),
        )
        
        # Generate token for this employee
        auth_token = PhoneAuthenticationService.generate_auth_token(employee)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {auth_token}')
        
        # Make request
        response = self.client.post(self.url, {}, format='json')
        
        # Verify unicode characters are removed (only ASCII alphanumeric kept)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # José -> jos, García -> garca
        self.assertEqual(response.data['username'], 'jos.garca')
        
        # Clean up
        employee.delete()
    
    def test_username_generation_response_includes_all_employee_details(self):
        """
        Test that response includes all required employee details.
        
        **Validates: Requirements 4.5**
        """
        # Set authorization header
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.auth_token}')
        
        # Make request
        response = self.client.post(self.url, {}, format='json')
        
        # Verify response status
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify all required employee details are present
        employee_details = response.data['employee_details']
        required_fields = ['first_name', 'last_name', 'email', 'department', 'designation']
        
        for field in required_fields:
            self.assertIn(field, employee_details)
            self.assertIsNotNone(employee_details[field])
    
    def test_username_generation_with_empty_names(self):
        """
        Test username generation handles edge case of empty names.
        
        **Validates: Requirements 4.3**
        """
        # Create employee with minimal names
        employee = Employee.objects.create(
            firstName='A',
            lastName='B',
            personalEmail='a.b@example.com',
            mobileNumber='+14155555555',
            employeeId='EMP006',
            department='Admin',
            designation='Admin',
            joiningDate=timezone.now().date(),
        )
        
        # Generate token for this employee
        auth_token = PhoneAuthenticationService.generate_auth_token(employee)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {auth_token}')
        
        # Make request
        response = self.client.post(self.url, {}, format='json')
        
        # Verify username is generated
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'a.b')
        
        # Clean up
        employee.delete()
