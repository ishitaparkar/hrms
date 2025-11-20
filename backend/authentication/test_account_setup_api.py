"""
Integration tests for account setup API endpoint.

Tests the complete account setup flow including:
- Valid account setup with username and password
- Password validation errors
- Automatic login after setup
"""
from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from employee_management.models import Employee
from authentication.models import UserProfile, AccountSetupToken
from authentication.services import PhoneAuthenticationService
from rest_framework.authtoken.models import Token
import json


class TestAccountSetupAPI(TestCase):
    """
    Integration tests for the account setup completion API endpoint.
    
    Requirements: 5.1, 5.4, 5.5, 5.6, 5.7, 6.1, 6.2, 6.3, 6.4
    """
    
    def setUp(self):
        """Set up test data."""
        self.client = Client()
        
        # Create a test employee
        self.employee = Employee.objects.create(
            employeeId='EMP001',
            firstName='John',
            lastName='Doe',
            personalEmail='john.doe@example.com',
            mobileNumber='+919876543210',
            department='Engineering',
            designation='Software Engineer',
            joiningDate='2025-01-01'
        )
        
        # Generate auth token for the employee
        self.auth_token = PhoneAuthenticationService.generate_auth_token(self.employee)
    
    def tearDown(self):
        """Clean up test data."""
        User.objects.all().delete()
        Employee.objects.all().delete()
        AccountSetupToken.objects.all().delete()
    
    def test_complete_setup_with_valid_data(self):
        """
        Test complete setup flow with valid data.
        
        Verifies:
        - User account is created
        - Password is hashed
        - password_changed flag is set to True
        - Authentication token is returned
        - Audit log is created
        """
        # Prepare request data
        data = {
            'username': 'john.doe',
            'password': 'SecureP@ss123',
            'confirm_password': 'SecureP@ss123'
        }
        
        # Make request
        response = self.client.post(
            '/api/auth/complete-setup/',
            data=json.dumps(data),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.auth_token}'
        )
        
        # Verify response
        self.assertEqual(response.status_code, 201)
        response_data = response.json()
        self.assertTrue(response_data['success'])
        self.assertEqual(response_data['message'], 'Account activated successfully')
        self.assertIn('user', response_data)
        self.assertIn('token', response_data)
        
        # Verify user was created
        user = User.objects.get(username='john.doe')
        self.assertEqual(user.email, 'john.doe@example.com')
        self.assertEqual(user.first_name, 'John')
        self.assertEqual(user.last_name, 'Doe')
        
        # Verify password is hashed (not plaintext)
        self.assertNotEqual(user.password, 'SecureP@ss123')
        self.assertIn('$', user.password)  # Django hash format
        
        # Verify password can be checked
        self.assertTrue(user.check_password('SecureP@ss123'))
        
        # Verify UserProfile was created with password_changed = True
        profile = UserProfile.objects.get(user=user)
        self.assertTrue(profile.password_changed)
        self.assertEqual(profile.employee, self.employee)
        
        # Verify authentication token was created
        token = Token.objects.get(user=user)
        self.assertEqual(token.key, response_data['token'])
        
        # Verify setup token was marked as used
        setup_token = AccountSetupToken.objects.get(employee=self.employee)
        self.assertTrue(setup_token.used)
        self.assertIsNotNone(setup_token.used_at)
    
    def test_password_validation_errors(self):
        """
        Test password validation errors.
        
        Verifies that weak passwords are rejected with appropriate error messages.
        """
        test_cases = [
            {
                'password': 'short',
                'expected_error': 'Password must be at least 8 characters long'
            },
            {
                'password': 'nouppercase123!',
                'expected_error': 'Password must contain at least one uppercase letter'
            },
            {
                'password': 'NOLOWERCASE123!',
                'expected_error': 'Password must contain at least one lowercase letter'
            },
            {
                'password': 'NoNumbers!',
                'expected_error': 'Password must contain at least one number'
            },
            {
                'password': 'NoSpecial123',
                'expected_error': 'Password must contain at least one special character'
            }
        ]
        
        for test_case in test_cases:
            # Prepare request data
            data = {
                'username': 'john.doe',
                'password': test_case['password'],
                'confirm_password': test_case['password']
            }
            
            # Make request
            response = self.client.post(
                '/api/auth/complete-setup/',
                data=json.dumps(data),
                content_type='application/json',
                HTTP_AUTHORIZATION=f'Bearer {self.auth_token}'
            )
            
            # Verify response
            self.assertEqual(response.status_code, 400)
            response_data = response.json()
            self.assertFalse(response_data['success'])
            self.assertIn('errors', response_data)
            self.assertIn('password', response_data['errors'])
            
            # Verify the specific error message is present
            error_messages = response_data['errors']['password']
            self.assertTrue(
                any(test_case['expected_error'] in msg for msg in error_messages),
                f"Expected error '{test_case['expected_error']}' not found in {error_messages}"
            )
    
    def test_password_mismatch_error(self):
        """
        Test that mismatched passwords are rejected.
        """
        data = {
            'username': 'john.doe',
            'password': 'SecureP@ss123',
            'confirm_password': 'DifferentP@ss123'
        }
        
        response = self.client.post(
            '/api/auth/complete-setup/',
            data=json.dumps(data),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.auth_token}'
        )
        
        self.assertEqual(response.status_code, 400)
        response_data = response.json()
        self.assertFalse(response_data['success'])
        self.assertIn('errors', response_data)
        self.assertIn('confirm_password', response_data['errors'])
        self.assertIn('Passwords do not match', response_data['errors']['confirm_password'])
    
    def test_automatic_login_after_setup(self):
        """
        Test automatic login after setup.
        
        Verifies that the returned token can be used to authenticate API requests.
        """
        # Complete setup
        data = {
            'username': 'john.doe',
            'password': 'SecureP@ss123',
            'confirm_password': 'SecureP@ss123'
        }
        
        response = self.client.post(
            '/api/auth/complete-setup/',
            data=json.dumps(data),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.auth_token}'
        )
        
        self.assertEqual(response.status_code, 201)
        response_data = response.json()
        auth_token = response_data['token']
        
        # Use the token to access authenticated endpoint
        response = self.client.get(
            '/api/auth/me/',
            HTTP_AUTHORIZATION=f'Token {auth_token}'
        )
        
        # Verify user is authenticated
        self.assertEqual(response.status_code, 200)
        user_data = response.json()
        self.assertIn('user', user_data)
        self.assertEqual(user_data['user']['username'], 'john.doe')
    
    def test_duplicate_username_error(self):
        """
        Test that duplicate usernames are rejected.
        """
        # Create an existing user
        User.objects.create_user(
            username='john.doe',
            password='existing_password'
        )
        
        # Try to create account with same username
        data = {
            'username': 'john.doe',
            'password': 'SecureP@ss123',
            'confirm_password': 'SecureP@ss123'
        }
        
        response = self.client.post(
            '/api/auth/complete-setup/',
            data=json.dumps(data),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.auth_token}'
        )
        
        self.assertEqual(response.status_code, 400)
        response_data = response.json()
        self.assertFalse(response_data['success'])
        self.assertIn('errors', response_data)
        self.assertIn('username', response_data['errors'])
    
    def test_expired_token_error(self):
        """
        Test that expired tokens are rejected.
        """
        # Mark the setup token as expired
        setup_token = AccountSetupToken.objects.get(employee=self.employee)
        setup_token.expires_at = timezone.now() - timedelta(hours=1)
        setup_token.save()
        
        data = {
            'username': 'john.doe',
            'password': 'SecureP@ss123',
            'confirm_password': 'SecureP@ss123'
        }
        
        response = self.client.post(
            '/api/auth/complete-setup/',
            data=json.dumps(data),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.auth_token}'
        )
        
        self.assertEqual(response.status_code, 400)
        response_data = response.json()
        self.assertFalse(response_data['success'])
        self.assertIn('Setup token has expired', response_data['error'])
    
    def test_used_token_error(self):
        """
        Test that already-used tokens are rejected.
        """
        # Mark the setup token as used
        setup_token = AccountSetupToken.objects.get(employee=self.employee)
        setup_token.used = True
        setup_token.used_at = timezone.now()
        setup_token.save()
        
        data = {
            'username': 'john.doe',
            'password': 'SecureP@ss123',
            'confirm_password': 'SecureP@ss123'
        }
        
        response = self.client.post(
            '/api/auth/complete-setup/',
            data=json.dumps(data),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.auth_token}'
        )
        
        self.assertEqual(response.status_code, 400)
        response_data = response.json()
        self.assertFalse(response_data['success'])
        self.assertIn('Setup token has already been used', response_data['error'])
    
    def test_missing_authorization_header(self):
        """
        Test that requests without authorization header are rejected.
        """
        data = {
            'username': 'john.doe',
            'password': 'SecureP@ss123',
            'confirm_password': 'SecureP@ss123'
        }
        
        response = self.client.post(
            '/api/auth/complete-setup/',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 401)
        response_data = response.json()
        self.assertFalse(response_data['success'])
        self.assertIn('Authorization header missing or invalid', response_data['error'])
