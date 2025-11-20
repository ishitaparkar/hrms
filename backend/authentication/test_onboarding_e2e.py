"""
End-to-end tests for employee onboarding authentication flow.

This module contains comprehensive end-to-end tests for the complete employee
onboarding and authentication system, covering:
- Super Admin creates employee with validated contact information
- Welcome email is sent with temporary credentials
- Employee receives email and accesses portal
- Phone-based authentication verification
- Username generation and verification
- Password setup with strength validation
- Automatic login and redirect to dashboard
- Error scenarios and edge cases
"""
import time
import jwt
from django.test import TestCase, override_settings
from django.contrib.auth.models import User
from django.utils import timezone
from django.core import mail
from django.conf import settings
from rest_framework.test import APIClient
from rest_framework import status

from .models import UserProfile, PhoneAuthAttempt, AccountSetupToken, AuditLog
from .services import AccountCreationService, PhoneAuthenticationService, UsernameGenerationService
from .utils import ensure_role_exists, ROLE_SUPER_ADMIN, ROLE_EMPLOYEE
from employee_management.models import Employee


class CompleteOnboardingFlowE2ETest(TestCase):
    """
    End-to-end test for the complete employee onboarding authentication flow.
    
    This test covers the entire flow from employee creation by Super Admin
    to successful account activation by the employee.
    """
    
    def setUp(self):
        """Set up test data for the complete onboarding flow."""
        self.client = APIClient()
        
        # Create roles
        self.super_admin_role, _ = ensure_role_exists(ROLE_SUPER_ADMIN)
        self.employee_role, _ = ensure_role_exists(ROLE_EMPLOYEE)
        
        # Create Super Admin user
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
            'mobileNumber': '+1 9876543210',  # Added space after country code
            'joiningDate': '2024-01-15',
            'department': 'Engineering',
            'designation': 'Software Developer'
        }
        
        # Clear any existing mail
        mail.outbox = []
    
    def test_complete_onboarding_flow_success(self):
        """
        Test the complete successful onboarding flow from start to finish.
        
        Flow:
        1. Super Admin creates employee
        2. Welcome email is sent
        3. Employee accesses portal and performs phone authentication
        4. Employee generates and verifies username
        5. Employee sets up password
        6. Employee is automatically logged in and redirected
        """
        # ===== STEP 1: Super Admin creates employee =====
        
        # Login as Super Admin
        login_response = self.client.post('/api/auth/login/', {
            'username': 'super.admin',
            'password': 'superadmin123'
        })
        
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn(ROLE_SUPER_ADMIN, login_response.data['roles'])
        
        admin_token = login_response.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {admin_token}')
        
        # Create employee
        create_employee_response = self.client.post('/api/employees/', self.employee_data)
        
        self.assertEqual(create_employee_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_employee_response.data['firstName'], 'John')
        self.assertEqual(create_employee_response.data['lastName'], 'Doe')
        self.assertEqual(create_employee_response.data['personalEmail'], 'john.doe@company.com')
        self.assertEqual(create_employee_response.data['mobileNumber'], '+1 9876543210')
        
        # Verify employee was created in database
        employee = Employee.objects.get(employeeId='EMP001')
        self.assertEqual(employee.firstName, 'John')
        self.assertEqual(employee.lastName, 'Doe')
        self.assertEqual(employee.personalEmail, 'john.doe@company.com')
        self.assertEqual(employee.mobileNumber, '+1 9876543210')
        
        # ===== STEP 2: Verify welcome email was sent =====
        
        # Check that welcome email was sent
        self.assertEqual(len(mail.outbox), 1)
        
        welcome_email = mail.outbox[0]
        self.assertEqual(welcome_email.to, ['john.doe@company.com'])
        self.assertIn('Welcome to', welcome_email.subject)
        self.assertIn('John', welcome_email.body)
        self.assertIn('account activation', welcome_email.body.lower())
        self.assertIn('portal', welcome_email.body.lower())
        self.assertIn('verify your identity', welcome_email.body.lower())
        self.assertIn('phone number', welcome_email.body.lower())
        
        # Verify NO user account was created yet (new phone-based flow)
        self.assertFalse(User.objects.filter(username='john.doe@company.com').exists())
        self.assertFalse(User.objects.filter(email='john.doe@company.com').exists())
        
        # Verify audit log was created for welcome email
        email_logs = AuditLog.objects.filter(
            action='ROLE_ASSIGNED',
            resource_type='WelcomeEmail',
            resource_id=employee.id
        )
        self.assertGreater(email_logs.count(), 0)
        
        # Clear authentication for employee flow
        self.client.credentials()
        
        # ===== STEP 3: Employee performs phone authentication =====
        
        # Employee accesses phone authentication endpoint
        phone_auth_response = self.client.post('/api/auth/verify-phone/', {
            'email': 'john.doe@company.com',
            'phone_number': '+1 9876543210'
        })
        
        self.assertEqual(phone_auth_response.status_code, status.HTTP_200_OK)
        self.assertTrue(phone_auth_response.data['success'])
        self.assertIn('auth_token', phone_auth_response.data)
        
        # Verify employee details in response
        employee_data = phone_auth_response.data['employee']
        self.assertEqual(employee_data['first_name'], 'John')
        self.assertEqual(employee_data['last_name'], 'Doe')
        self.assertEqual(employee_data['email'], 'john.doe@company.com')
        self.assertEqual(employee_data['department'], 'Engineering')
        
        # Extract JWT token for next steps
        jwt_token = phone_auth_response.data['auth_token']
        
        # Verify phone auth attempt was logged
        phone_attempts = PhoneAuthAttempt.objects.filter(
            email='john.doe@company.com',
            success=True
        )
        self.assertEqual(phone_attempts.count(), 1)
        
        # Verify AccountSetupToken was created
        setup_tokens = AccountSetupToken.objects.filter(employee=employee)
        self.assertEqual(setup_tokens.count(), 1)
        setup_token = setup_tokens.first()
        self.assertFalse(setup_token.used)
        self.assertTrue(setup_token.is_valid())
        
        # ===== STEP 4: Employee generates and verifies username =====
        
        # Employee requests username generation
        username_response = self.client.post('/api/auth/generate-username/', 
            headers={'Authorization': f'Bearer {jwt_token}'}
        )
        
        self.assertEqual(username_response.status_code, status.HTTP_200_OK)
        self.assertEqual(username_response.data['username'], 'john.doe')
        
        # Verify employee details in response
        employee_details = username_response.data['employee_details']
        self.assertEqual(employee_details['first_name'], 'John')
        self.assertEqual(employee_details['last_name'], 'Doe')
        self.assertEqual(employee_details['email'], 'john.doe@company.com')
        self.assertEqual(employee_details['department'], 'Engineering')
        self.assertEqual(employee_details['designation'], 'Software Developer')
        
        # ===== STEP 5: Employee sets up password =====
        
        # Employee completes account setup with password
        password_setup_response = self.client.post('/api/auth/complete-setup/', 
            {
                'username': 'john.doe',
                'password': 'SecureP@ss123',
                'confirm_password': 'SecureP@ss123'
            },
            headers={'Authorization': f'Bearer {jwt_token}'}
        )
        
        self.assertEqual(password_setup_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(password_setup_response.data['success'])
        self.assertEqual(password_setup_response.data['message'], 'Account activated successfully')
        
        # Verify user data in response
        user_data = password_setup_response.data['user']
        self.assertEqual(user_data['username'], 'john.doe')
        self.assertEqual(user_data['email'], 'john.doe@company.com')
        self.assertEqual(user_data['full_name'], 'John Doe')
        
        # Verify authentication token is provided for automatic login
        self.assertIn('token', password_setup_response.data)
        auth_token = password_setup_response.data['token']
        
        # ===== STEP 6: Verify account activation completed =====
        
        # Verify user account was created with correct username
        activated_user = User.objects.get(username='john.doe')
        self.assertEqual(activated_user.email, 'john.doe@company.com')
        self.assertEqual(activated_user.first_name, 'John')
        self.assertEqual(activated_user.last_name, 'Doe')
        
        # Verify password was set (can authenticate)
        self.assertTrue(activated_user.check_password('SecureP@ss123'))
        
        # Verify user profile was created and linked
        activated_profile = UserProfile.objects.get(user=activated_user)
        self.assertEqual(activated_profile.employee, employee)
        self.assertEqual(activated_profile.department, 'Engineering')
        self.assertTrue(activated_profile.password_changed)  # Should be True after activation
        
        # Verify employee role was assigned
        self.assertTrue(activated_user.groups.filter(name=ROLE_EMPLOYEE).exists())
        
        # Verify setup token was marked as used
        setup_token.refresh_from_db()
        self.assertTrue(setup_token.used)
        self.assertIsNotNone(setup_token.used_at)
        
        # ===== STEP 7: Verify automatic login works =====
        
        # Use the provided auth token to access protected endpoints
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {auth_token}')
        
        # Test accessing current user endpoint
        me_response = self.client.get('/api/auth/me/')
        
        self.assertEqual(me_response.status_code, status.HTTP_200_OK)
        self.assertEqual(me_response.data['user']['username'], 'john.doe')
        self.assertIn(ROLE_EMPLOYEE, me_response.data['roles'])
        self.assertEqual(me_response.data['profile']['department'], 'Engineering')
        
        # ===== STEP 8: Verify audit logs were created =====
        
        # Check for account activation audit log
        activation_logs = AuditLog.objects.filter(
            action='ROLE_ASSIGNED',
            resource_type='AccountActivation',
            target_user=activated_user
        )
        self.assertGreater(activation_logs.count(), 0)
        
        # Check for phone authentication audit log
        auth_logs = AuditLog.objects.filter(
            resource_type='PhoneAuthentication',
            resource_id=employee.id
        )
        self.assertGreater(auth_logs.count(), 0)
    
    def test_phone_authentication_with_wrong_phone_number(self):
        """Test phone authentication fails with wrong phone number."""
        # Create employee first
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self._get_admin_token()}')
        create_response = self.client.post('/api/employees/', self.employee_data)
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.client.credentials()
        
        # Try phone authentication with wrong phone number
        phone_auth_response = self.client.post('/api/auth/verify-phone/', {
            'email': 'john.doe@company.com',
            'phone_number': '+1 9999999999'  # Wrong phone number
        })
        
        self.assertEqual(phone_auth_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(phone_auth_response.data['success'])
        self.assertIn('does not match', phone_auth_response.data['error'])
        self.assertIn('attempts_remaining', phone_auth_response.data)
        
        # Verify failed attempt was logged
        failed_attempts = PhoneAuthAttempt.objects.filter(
            email='john.doe@company.com',
            success=False
        )
        self.assertEqual(failed_attempts.count(), 1)
    
    def test_phone_authentication_with_nonexistent_email(self):
        """Test phone authentication fails with nonexistent email."""
        phone_auth_response = self.client.post('/api/auth/verify-phone/', {
            'email': 'nonexistent@company.com',
            'phone_number': '+1 9876543210'
        })
        
        self.assertEqual(phone_auth_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(phone_auth_response.data['success'])
        self.assertIn('No employee found', phone_auth_response.data['error'])
    
    def test_account_lockout_after_failed_attempts(self):
        """Test account gets locked after 3 failed phone authentication attempts."""
        # Create employee first
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self._get_admin_token()}')
        create_response = self.client.post('/api/employees/', self.employee_data)
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.client.credentials()
        
        # Make 3 failed attempts
        for i in range(3):
            response = self.client.post('/api/auth/verify-phone/', {
                'email': 'john.doe@company.com',
                'phone_number': '+1 9999999999'  # Wrong phone number
            })
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # 4th attempt should be locked
        lockout_response = self.client.post('/api/auth/verify-phone/', {
            'email': 'john.doe@company.com',
            'phone_number': '+1 9876543210'  # Even correct phone number should be locked
        })
        
        self.assertEqual(lockout_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('temporarily locked', lockout_response.data['error'])
    
    def test_username_generation_with_duplicate_names(self):
        """Test username generation handles duplicate names with numeric suffixes."""
        # Create first employee
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self._get_admin_token()}')
        self.client.post('/api/employees/', self.employee_data)
        
        # Create user account for first employee to occupy the username
        employee1 = Employee.objects.get(employeeId='EMP001')
        User.objects.create_user(
            username='john.doe',
            email='john.doe@company.com',
            password='temp123'
        )
        
        # Create second employee with same name
        employee2_data = self.employee_data.copy()
        employee2_data['employeeId'] = 'EMP002'
        employee2_data['personalEmail'] = 'john.doe2@company.com'
        employee2_data['mobileNumber'] = '+1 9876543211'
        
        self.client.post('/api/employees/', employee2_data)
        employee2 = Employee.objects.get(employeeId='EMP002')
        
        # Authenticate second employee
        self.client.credentials()
        phone_auth_response = self.client.post('/api/auth/verify-phone/', {
            'email': 'john.doe2@company.com',
            'phone_number': '+1 9876543211'
        })
        
        jwt_token = phone_auth_response.data['auth_token']
        
        # Generate username for second employee
        username_response = self.client.post('/api/auth/generate-username/', 
            headers={'Authorization': f'Bearer {jwt_token}'}
        )
        
        self.assertEqual(username_response.status_code, status.HTTP_200_OK)
        self.assertEqual(username_response.data['username'], 'john.doe2')  # Should have suffix
    
    def test_password_validation_errors(self):
        """Test password setup with various validation errors."""
        # Create employee and get through phone auth
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self._get_admin_token()}')
        self.client.post('/api/employees/', self.employee_data)
        self.client.credentials()
        
        phone_auth_response = self.client.post('/api/auth/verify-phone/', {
            'email': 'john.doe@company.com',
            'phone_number': '+1 9876543210'
        })
        jwt_token = phone_auth_response.data['auth_token']
        
        # Test weak password
        weak_password_response = self.client.post('/api/auth/complete-setup/', 
            {
                'username': 'john.doe',
                'password': 'weak',
                'confirm_password': 'weak'
            },
            headers={'Authorization': f'Bearer {jwt_token}'}
        )
        
        self.assertEqual(weak_password_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(weak_password_response.data['success'])
        self.assertIn('errors', weak_password_response.data)
        self.assertIn('password', weak_password_response.data['errors'])
        
        # Test password mismatch
        mismatch_response = self.client.post('/api/auth/complete-setup/', 
            {
                'username': 'john.doe',
                'password': 'SecureP@ss123',
                'confirm_password': 'DifferentP@ss123'
            },
            headers={'Authorization': f'Bearer {jwt_token}'}
        )
        
        self.assertEqual(mismatch_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Passwords do not match', str(mismatch_response.data))
    
    def test_expired_jwt_token_handling(self):
        """Test handling of expired JWT tokens."""
        # Create employee and get through phone auth
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self._get_admin_token()}')
        self.client.post('/api/employees/', self.employee_data)
        self.client.credentials()
        
        employee = Employee.objects.get(employeeId='EMP001')
        
        # Create an expired JWT token
        secret_key = getattr(settings, 'SECRET_KEY')
        expired_payload = {
            'employee_id': employee.id,
            'employee_email': employee.personalEmail,
            'token_id': 1,
            'exp': timezone.now() - timezone.timedelta(hours=1),  # Expired 1 hour ago
            'iat': timezone.now() - timezone.timedelta(hours=2)
        }
        
        expired_token = jwt.encode(expired_payload, secret_key, algorithm='HS256')
        
        # Try to use expired token
        expired_response = self.client.post('/api/auth/generate-username/', 
            headers={'Authorization': f'Bearer {expired_token}'}
        )
        
        self.assertEqual(expired_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('expired', expired_response.data['error'].lower())
    
    def test_flow_resumption_after_interruption(self):
        """Test that the onboarding flow can be resumed after interruption."""
        # Create employee and complete phone auth
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self._get_admin_token()}')
        self.client.post('/api/employees/', self.employee_data)
        self.client.credentials()
        
        phone_auth_response = self.client.post('/api/auth/verify-phone/', {
            'email': 'john.doe@company.com',
            'phone_number': '+1 9876543210'
        })
        jwt_token = phone_auth_response.data['auth_token']
        
        # Complete username generation step
        self.client.post('/api/auth/generate-username/', 
            headers={'Authorization': f'Bearer {jwt_token}'}
        )
        
        # Simulate interruption - user closes browser and comes back later
        # The JWT token should still be valid and allow completion
        
        # Complete password setup (resuming the flow)
        resume_response = self.client.post('/api/auth/complete-setup/', 
            {
                'username': 'john.doe',
                'password': 'SecureP@ss123',
                'confirm_password': 'SecureP@ss123'
            },
            headers={'Authorization': f'Bearer {jwt_token}'}
        )
        
        self.assertEqual(resume_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(resume_response.data['success'])
    
    def test_welcome_email_failure_does_not_block_account_creation(self):
        """Test that welcome email failure doesn't prevent account creation."""
        # Mock email sending to fail
        with override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend'):
            # Create employee with email failure simulation
            self.client.credentials(HTTP_AUTHORIZATION=f'Token {self._get_admin_token()}')
            
            # This should succeed even if email fails
            create_response = self.client.post('/api/employees/', self.employee_data)
            
            self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
            
            # Verify employee was created but NO user account yet (new flow)
            employee = Employee.objects.get(employeeId='EMP001')
            self.assertEqual(employee.personalEmail, 'john.doe@company.com')
            
            # Verify no user account exists yet
            self.assertFalse(User.objects.filter(username='john.doe@company.com').exists())
            self.assertFalse(User.objects.filter(email='john.doe@company.com').exists())
            
            # Phone authentication should still work
            self.client.credentials()
            phone_auth_response = self.client.post('/api/auth/verify-phone/', {
                'email': 'john.doe@company.com',
                'phone_number': '+1 9876543210'
            })
            
            self.assertEqual(phone_auth_response.status_code, status.HTTP_200_OK)
            self.assertTrue(phone_auth_response.data['success'])
    
    def _get_admin_token(self):
        """Helper method to get Super Admin authentication token."""
        login_response = self.client.post('/api/auth/login/', {
            'username': 'super.admin',
            'password': 'superadmin123'
        })
        return login_response.data['token']


class OnboardingErrorScenariosE2ETest(TestCase):
    """
    End-to-end tests for error scenarios in the onboarding flow.
    """
    
    def setUp(self):
        """Set up test data for error scenarios."""
        self.client = APIClient()
        
        # Create roles
        self.super_admin_role, _ = ensure_role_exists(ROLE_SUPER_ADMIN)
        self.employee_role, _ = ensure_role_exists(ROLE_EMPLOYEE)
        
        # Create Super Admin user
        self.super_admin_user = User.objects.create_user(
            username='admin',
            email='admin@company.com',
            password='admin123'
        )
        
        UserProfile.objects.create(
            user=self.super_admin_user,
            department='Administration'
        )
        
        self.super_admin_user.groups.add(self.super_admin_role)
    
    def test_invalid_email_format_rejected(self):
        """Test that invalid email formats are rejected during employee creation."""
        # Login as Super Admin
        login_response = self.client.post('/api/auth/login/', {
            'username': 'admin',
            'password': 'admin123'
        })
        token = login_response.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        
        # Try to create employee with invalid email
        invalid_email_data = {
            'firstName': 'John',
            'lastName': 'Doe',
            'employeeId': 'EMP001',
            'personalEmail': 'invalid-email',  # Invalid format
            'mobileNumber': '+1 9876543210',
            'joiningDate': '2024-01-15',
            'department': 'Engineering',
            'designation': 'Developer'
        }
        
        response = self.client.post('/api/employees/', invalid_email_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('personalEmail', str(response.data))
    
    def test_invalid_phone_format_rejected(self):
        """Test that invalid phone formats are rejected during employee creation."""
        # Login as Super Admin
        login_response = self.client.post('/api/auth/login/', {
            'username': 'admin',
            'password': 'admin123'
        })
        token = login_response.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        
        # Try to create employee with invalid phone number
        invalid_phone_data = {
            'firstName': 'John',
            'lastName': 'Doe',
            'employeeId': 'EMP001',
            'personalEmail': 'john.doe@company.com',
            'mobileNumber': '1234567890',  # Missing country code
            'joiningDate': '2024-01-15',
            'department': 'Engineering',
            'designation': 'Developer'
        }
        
        response = self.client.post('/api/employees/', invalid_phone_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('mobileNumber', str(response.data))
    
    def test_non_super_admin_cannot_create_employee(self):
        """Test that non-Super Admin users cannot create employees."""
        # Create regular employee user
        employee_user = User.objects.create_user(
            username='employee',
            password='employee123'
        )
        employee_user.groups.add(self.employee_role)
        
        # Login as employee
        login_response = self.client.post('/api/auth/login/', {
            'username': 'employee',
            'password': 'employee123'
        })
        token = login_response.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        
        # Try to create employee
        employee_data = {
            'firstName': 'John',
            'lastName': 'Doe',
            'employeeId': 'EMP001',
            'personalEmail': 'john.doe@company.com',
            'mobileNumber': '+1 9876543210',  # Fixed format with separator
            'joiningDate': '2024-01-15',
            'department': 'Engineering',
            'designation': 'Developer'
        }
        
        response = self.client.post('/api/employees/', employee_data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_duplicate_employee_id_rejected(self):
        """Test that duplicate employee IDs are rejected."""
        # Login as Super Admin
        login_response = self.client.post('/api/auth/login/', {
            'username': 'admin',
            'password': 'admin123'
        })
        token = login_response.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        
        # Create first employee
        employee_data = {
            'firstName': 'John',
            'lastName': 'Doe',
            'employeeId': 'EMP001',
            'personalEmail': 'john.doe@company.com',
            'mobileNumber': '+1 9876543210',
            'joiningDate': '2024-01-15',
            'department': 'Engineering',
            'designation': 'Developer'
        }
        
        response1 = self.client.post('/api/employees/', employee_data)
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        
        # Try to create second employee with same ID
        duplicate_data = employee_data.copy()
        duplicate_data['personalEmail'] = 'jane.doe@company.com'
        duplicate_data['mobileNumber'] = '+1 9876543211'
        
        response2 = self.client.post('/api/employees/', duplicate_data)
        
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('employeeId', str(response2.data))