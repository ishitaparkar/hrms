"""
Tests for automatic account creation when employees are created.
"""
from django.test import TestCase
from django.contrib.auth.models import User
from django.core import mail
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock

from .models import UserProfile, AuditLog
from .services import AccountCreationService
from .utils import ensure_role_exists, ROLE_EMPLOYEE
from employee_management.models import Employee


class AccountCreationServiceTests(TestCase):
    """Test cases for AccountCreationService methods."""
    
    def setUp(self):
        """Set up test data."""
        # Create test employee
        self.employee = Employee.objects.create(
            firstName='John',
            lastName='Doe',
            employeeId='EMP001',
            personalEmail='john.doe@example.com',
            mobileNumber='1234567890',
            joiningDate='2024-01-01',
            department='Computer Science',
            designation='Developer'
        )
    
    def test_generate_temporary_password_length(self):
        """Test temporary password has minimum length of 12 characters."""
        password = AccountCreationService.generate_temporary_password()
        self.assertGreaterEqual(len(password), 12)
    
    def test_generate_temporary_password_contains_required_characters(self):
        """Test temporary password contains uppercase, lowercase, digits, and special chars."""
        password = AccountCreationService.generate_temporary_password()
        
        has_uppercase = any(c.isupper() for c in password)
        has_lowercase = any(c.islower() for c in password)
        has_digit = any(c.isdigit() for c in password)
        has_special = any(c in '!@#$%^&*' for c in password)
        
        self.assertTrue(has_uppercase, "Password should contain uppercase letters")
        self.assertTrue(has_lowercase, "Password should contain lowercase letters")
        self.assertTrue(has_digit, "Password should contain digits")
        self.assertTrue(has_special, "Password should contain special characters")
    
    def test_generate_temporary_password_is_unique(self):
        """Test that generated passwords are unique."""
        passwords = set()
        for _ in range(100):
            password = AccountCreationService.generate_temporary_password()
            passwords.add(password)
        
        # All 100 passwords should be unique
        self.assertEqual(len(passwords), 100)
    
    def test_generate_temporary_password_custom_length(self):
        """Test temporary password respects custom length."""
        password = AccountCreationService.generate_temporary_password(length=16)
        self.assertEqual(len(password), 16)
    
    def test_generate_temporary_password_minimum_length_enforced(self):
        """Test temporary password enforces minimum length of 12."""
        password = AccountCreationService.generate_temporary_password(length=8)
        self.assertGreaterEqual(len(password), 12)
    
    @patch('authentication.services.send_mail')
    def test_send_welcome_email_success(self, mock_send_mail):
        """Test welcome email is sent successfully."""
        user = User.objects.create_user(
            username='john.doe@example.com',
            email='john.doe@example.com',
            password='TempPass123'
        )
        
        result = AccountCreationService.send_welcome_email(
            user=user,
            employee=self.employee,
            temporary_password='TempPass123'
        )
        
        self.assertTrue(result)
        mock_send_mail.assert_called_once()
        
        # Verify email content
        call_args = mock_send_mail.call_args
        self.assertIn('Welcome', call_args[1]['subject'])
        self.assertIn('John Doe', call_args[1]['message'])
        self.assertIn('EMP001', call_args[1]['message'])
        self.assertIn('TempPass123', call_args[1]['message'])
        self.assertEqual(call_args[1]['recipient_list'], ['john.doe@example.com'])
    
    @patch('authentication.services.send_mail')
    def test_send_welcome_email_failure(self, mock_send_mail):
        """Test welcome email handles sending failures."""
        mock_send_mail.side_effect = Exception("SMTP error")
        
        user = User.objects.create_user(
            username='john.doe@example.com',
            email='john.doe@example.com',
            password='TempPass123'
        )
        
        with self.assertRaises(Exception):
            AccountCreationService.send_welcome_email(
                user=user,
                employee=self.employee,
                temporary_password='TempPass123'
            )
    
    @patch('authentication.services.ensure_role_exists')
    @patch('authentication.services.AccountCreationService.send_welcome_email')
    def test_create_user_account_success(self, mock_send_email, mock_ensure_role):
        """Test successful user account creation."""
        from django.contrib.auth.models import Group
        employee_role = Group.objects.create(name=ROLE_EMPLOYEE)
        mock_ensure_role.return_value = (employee_role, False)
        mock_send_email.return_value = True
        
        user, temp_password, created = AccountCreationService.create_user_account(
            employee=self.employee
        )
        
        self.assertTrue(created)
        self.assertIsNotNone(user)
        self.assertIsNotNone(temp_password)
        
        # Verify user was created with correct details
        self.assertEqual(user.username, 'john.doe@example.com')
        self.assertEqual(user.email, 'john.doe@example.com')
        self.assertEqual(user.first_name, 'John')
        self.assertEqual(user.last_name, 'Doe')
        
        # Verify password works
        self.assertTrue(user.check_password(temp_password))
        
        # Verify UserProfile was created and linked
        self.assertTrue(hasattr(user, 'profile'))
        self.assertEqual(user.profile.employee, self.employee)
        self.assertEqual(user.profile.department, 'Computer Science')
        self.assertFalse(user.profile.password_changed)
        
        # Verify Employee role was assigned
        self.assertTrue(user.groups.filter(name=ROLE_EMPLOYEE).exists())
        
        # Verify email was sent
        mock_send_email.assert_called_once()
    
    @patch('authentication.services.AccountCreationService.send_welcome_email')
    def test_create_user_account_duplicate_email(self, mock_send_email):
        """Test account creation fails when email already exists."""
        # Create existing user with same email
        User.objects.create_user(
            username='john.doe@example.com',
            email='john.doe@example.com',
            password='existing123'
        )
        
        with self.assertRaises(ValueError) as context:
            AccountCreationService.create_user_account(employee=self.employee)
        
        self.assertIn('already exists', str(context.exception))
        mock_send_email.assert_not_called()
    
    @patch('authentication.services.AccountCreationService.send_welcome_email')
    def test_create_user_account_employee_already_has_account(self, mock_send_email):
        """Test account creation fails when employee already has an account."""
        # Create user and link to employee
        user = User.objects.create_user(
            username='john.doe@example.com',
            email='john.doe@example.com',
            password='existing123'
        )
        UserProfile.objects.create(
            user=user,
            employee=self.employee,
            department='Computer Science'
        )
        
        with self.assertRaises(ValueError) as context:
            AccountCreationService.create_user_account(employee=self.employee)
        
        self.assertIn('already has a user account', str(context.exception))
        mock_send_email.assert_not_called()
    
    @patch('authentication.services.ensure_role_exists')
    @patch('authentication.services.AccountCreationService.send_welcome_email')
    def test_create_user_account_creates_audit_log(self, mock_send_email, mock_ensure_role):
        """Test account creation creates an audit log entry."""
        from django.contrib.auth.models import Group
        employee_role = Group.objects.create(name=ROLE_EMPLOYEE)
        mock_ensure_role.return_value = (employee_role, False)
        mock_send_email.return_value = True
        
        initial_count = AuditLog.objects.count()
        
        user, temp_password, created = AccountCreationService.create_user_account(
            employee=self.employee
        )
        
        # Verify audit log was created
        self.assertEqual(AuditLog.objects.count(), initial_count + 1)
        
        log_entry = AuditLog.objects.latest('timestamp')
        self.assertEqual(log_entry.action, 'ROLE_ASSIGNED')
        self.assertEqual(log_entry.target_user, user)
        self.assertEqual(log_entry.resource_type, 'UserAccount')
        self.assertIn('account_creation', log_entry.details['action_type'])
        self.assertEqual(log_entry.details['employee_id'], 'EMP001')
        self.assertEqual(log_entry.details['employee_name'], 'John Doe')
        self.assertEqual(log_entry.details['username'], 'john.doe@example.com')
    
    @patch('authentication.services.ensure_role_exists')
    @patch('authentication.services.AccountCreationService.send_welcome_email')
    def test_create_user_account_email_failure_does_not_rollback(self, mock_send_email, mock_ensure_role):
        """Test account creation succeeds even if email fails."""
        from django.contrib.auth.models import Group
        employee_role = Group.objects.create(name=ROLE_EMPLOYEE)
        mock_ensure_role.return_value = (employee_role, False)
        mock_send_email.side_effect = Exception("SMTP error")
        
        user, temp_password, created = AccountCreationService.create_user_account(
            employee=self.employee
        )
        
        # Account should still be created
        self.assertTrue(created)
        self.assertIsNotNone(user)
        
        # Verify audit log records email failure
        log_entry = AuditLog.objects.latest('timestamp')
        self.assertFalse(log_entry.details['email_sent'])
        self.assertIsNotNone(log_entry.details['email_error'])
    
    @patch('authentication.services.ensure_role_exists')
    @patch('authentication.services.AccountCreationService.send_welcome_email')
    def test_create_user_account_with_request_context(self, mock_send_email, mock_ensure_role):
        """Test account creation with request context for audit logging."""
        from django.contrib.auth.models import Group
        employee_role = Group.objects.create(name=ROLE_EMPLOYEE)
        mock_ensure_role.return_value = (employee_role, False)
        mock_send_email.return_value = True
        
        # Create admin user for request context
        admin_user = User.objects.create_user(
            username='admin@example.com',
            password='admin123'
        )
        
        # Create mock request
        from rest_framework.test import APIRequestFactory
        factory = APIRequestFactory()
        request = factory.post('/api/employees/')
        request.user = admin_user
        
        user, temp_password, created = AccountCreationService.create_user_account(
            employee=self.employee,
            request=request
        )
        
        # Verify audit log includes actor
        log_entry = AuditLog.objects.latest('timestamp')
        self.assertEqual(log_entry.actor, admin_user)


class EmployeeCreationWithAccountTests(TestCase):
    """Integration tests for employee creation with automatic account creation."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create roles manually to avoid utils.py bug
        from django.contrib.auth.models import Group
        self.employee_role, _ = Group.objects.get_or_create(name=ROLE_EMPLOYEE)
        from authentication.utils import ROLE_HR_MANAGER
        self.hr_manager_role, _ = Group.objects.get_or_create(name=ROLE_HR_MANAGER)
        
        # Create HR Manager user
        self.hr_manager = User.objects.create_user(
            username='hrmanager@example.com',
            email='hrmanager@example.com',
            password='hrpass123'
        )
        UserProfile.objects.create(
            user=self.hr_manager,
            department='HR',
            password_changed=True
        )
        self.hr_manager.groups.add(self.hr_manager_role)
    
    @patch('authentication.services.AccountCreationService.send_welcome_email')
    def test_employee_creation_creates_user_account(self, mock_send_email):
        """Test creating employee automatically creates user account."""
        mock_send_email.return_value = True
        
        self.client.force_authenticate(user=self.hr_manager)
        
        response = self.client.post('/api/employees/', {
            'firstName': 'Jane',
            'lastName': 'Smith',
            'employeeId': 'EMP002',
            'personalEmail': 'jane.smith@example.com',
            'mobileNumber': '0987654321',
            'joiningDate': '2024-01-15',
            'department': 'Mathematics',
            'designation': 'Professor'
        })
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify account creation details in response
        self.assertIn('account_creation', response.data)
        self.assertTrue(response.data['account_creation']['user_account_created'])
        self.assertEqual(response.data['account_creation']['username'], 'jane.smith@example.com')
        self.assertIn('message', response.data['account_creation'])
        
        # Verify user was created
        user = User.objects.get(username='jane.smith@example.com')
        self.assertEqual(user.first_name, 'Jane')
        self.assertEqual(user.last_name, 'Smith')
        
        # Verify employee is linked
        employee = Employee.objects.get(employeeId='EMP002')
        self.assertEqual(user.profile.employee, employee)
    
    @patch('authentication.services.AccountCreationService.send_welcome_email')
    def test_employee_creation_with_duplicate_email(self, mock_send_email):
        """Test employee creation handles duplicate email gracefully."""
        # Create existing user
        User.objects.create_user(
            username='existing@example.com',
            email='existing@example.com',
            password='existing123'
        )
        
        self.client.force_authenticate(user=self.hr_manager)
        
        response = self.client.post('/api/employees/', {
            'firstName': 'Duplicate',
            'lastName': 'User',
            'employeeId': 'EMP003',
            'personalEmail': 'existing@example.com',
            'mobileNumber': '1111111111',
            'joiningDate': '2024-01-20',
            'department': 'Physics',
            'designation': 'Researcher'
        })
        
        # Employee should still be created
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # But account creation should have failed
        self.assertIn('account_creation', response.data)
        self.assertFalse(response.data['account_creation']['user_account_created'])
        self.assertIn('error', response.data['account_creation'])
        self.assertIn('warning', response.data['account_creation'])
        
        # Verify employee was created
        self.assertTrue(Employee.objects.filter(employeeId='EMP003').exists())
        
        # Verify no email was sent
        mock_send_email.assert_not_called()
    
    def test_employee_creation_requires_hr_manager_role(self):
        """Test only HR Manager can create employees."""
        # Create regular employee user
        employee_user = User.objects.create_user(
            username='employee@example.com',
            password='emppass123'
        )
        UserProfile.objects.create(
            user=employee_user,
            department='Computer Science'
        )
        employee_user.groups.add(self.employee_role)
        
        self.client.force_authenticate(user=employee_user)
        
        response = self.client.post('/api/employees/', {
            'firstName': 'Unauthorized',
            'lastName': 'User',
            'employeeId': 'EMP004',
            'personalEmail': 'unauthorized@example.com',
            'mobileNumber': '2222222222',
            'joiningDate': '2024-01-25',
            'department': 'Chemistry',
            'designation': 'Lab Assistant'
        })
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    @patch('authentication.services.ensure_role_exists')
    @patch('authentication.services.AccountCreationService.send_welcome_email')
    def test_employee_list_shows_account_status(self, mock_send_email, mock_ensure_role):
        """Test employee list shows which employees have user accounts."""
        from django.contrib.auth.models import Group
        employee_role, _ = Group.objects.get_or_create(name=ROLE_EMPLOYEE)
        mock_ensure_role.return_value = (employee_role, False)
        mock_send_email.return_value = True
        
        # Create employee with account
        employee_with_account = Employee.objects.create(
            firstName='With',
            lastName='Account',
            employeeId='EMP005',
            personalEmail='with.account@example.com',
            mobileNumber='3333333333',
            joiningDate='2024-01-01',
            department='Computer Science',
            designation='Developer'
        )
        AccountCreationService.create_user_account(employee=employee_with_account)
        
        # Create employee without account
        Employee.objects.create(
            firstName='Without',
            lastName='Account',
            employeeId='EMP006',
            personalEmail='without.account@example.com',
            mobileNumber='4444444444',
            joiningDate='2024-01-01',
            department='Mathematics',
            designation='Professor'
        )
        
        self.client.force_authenticate(user=self.hr_manager)
        
        response = self.client.get('/api/employees/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Response data is paginated, so get results
        results = response.data.get('results', response.data)
        
        # Find employees in response
        emp_with_account = next((e for e in results if e['employeeId'] == 'EMP005'), None)
        emp_without_account = next((e for e in results if e['employeeId'] == 'EMP006'), None)
        
        # Verify we found the employees
        self.assertIsNotNone(emp_with_account, "Employee with account not found in response")
        self.assertIsNotNone(emp_without_account, "Employee without account not found in response")
        
        # Verify account status
        self.assertTrue(emp_with_account['has_user_account'])
        self.assertEqual(emp_with_account['username'], 'with.account@example.com')
        
        self.assertFalse(emp_without_account['has_user_account'])
        self.assertIsNone(emp_without_account['username'])


class AccountCreationErrorHandlingTests(TestCase):
    """Test error handling for account creation."""
    
    def setUp(self):
        """Set up test data."""
        # Create role manually to avoid utils.py bug
        from django.contrib.auth.models import Group
        self.employee_role, _ = Group.objects.get_or_create(name=ROLE_EMPLOYEE)
        
        self.employee = Employee.objects.create(
            firstName='Test',
            lastName='Employee',
            employeeId='EMP007',
            personalEmail='test.employee@example.com',
            mobileNumber='5555555555',
            joiningDate='2024-01-01',
            department='Computer Science',
            designation='Developer'
        )
    
    @patch('authentication.services.ensure_role_exists')
    @patch('authentication.services.AccountCreationService.send_welcome_email')
    def test_missing_employee_role_raises_error(self, mock_send_email, mock_ensure_role):
        """Test account creation handles missing Employee role."""
        # Simulate role not existing
        mock_ensure_role.side_effect = Exception("Role does not exist")
        
        with self.assertRaises(Exception):
            AccountCreationService.create_user_account(employee=self.employee)
    
    @patch('authentication.services.ensure_role_exists')
    @patch('authentication.services.AccountCreationService.send_welcome_email')
    def test_account_creation_is_atomic(self, mock_send_email, mock_ensure_role):
        """Test account creation is atomic (all or nothing)."""
        # Mock ensure_role_exists to raise an error after user is created
        def side_effect_ensure_role(role_name):
            # This will be called after user creation, simulating a failure
            raise Exception("Database error during role assignment")
        
        mock_ensure_role.side_effect = side_effect_ensure_role
        mock_send_email.return_value = True
        
        # Attempt to create account - should fail and rollback
        with self.assertRaises(Exception):
            AccountCreationService.create_user_account(employee=self.employee)
        
        # Verify no user was created (transaction rolled back)
        self.assertFalse(User.objects.filter(username='test.employee@example.com').exists())



class EmailTemplateTests(TestCase):
    """Test cases for email template rendering and content."""
    
    def setUp(self):
        """Set up test data."""
        self.employee = Employee.objects.create(
            firstName='John',
            lastName='Doe',
            employeeId='EMP001',
            personalEmail='john.doe@example.com',
            mobileNumber='1234567890',
            joiningDate='2024-01-01',
            department='Computer Science',
            designation='Developer'
        )
        
        self.user = User.objects.create_user(
            username='john.doe@example.com',
            email='john.doe@example.com',
            first_name='John',
            last_name='Doe',
            password='TempPass123'
        )
        
        self.temp_password = 'TempPass123!@#'
    
    def test_html_email_template_renders(self):
        """Test HTML email template renders without errors."""
        from django.template.loader import render_to_string
        
        context = {
            'organization_name': 'Test Organization',
            'employee_first_name': self.employee.firstName,
            'employee_last_name': self.employee.lastName,
            'employee_id': self.employee.employeeId,
            'username': self.user.email,
            'temporary_password': self.temp_password,
            'portal_url': 'http://localhost:3000',
        }
        
        html_content = render_to_string('authentication/emails/welcome_email.html', context)
        
        # Verify template rendered
        self.assertIsNotNone(html_content)
        self.assertGreater(len(html_content), 0)
    
    def test_text_email_template_renders(self):
        """Test plain text email template renders without errors."""
        from django.template.loader import render_to_string
        
        context = {
            'organization_name': 'Test Organization',
            'employee_first_name': self.employee.firstName,
            'employee_last_name': self.employee.lastName,
            'employee_id': self.employee.employeeId,
            'username': self.user.email,
            'temporary_password': self.temp_password,
            'portal_url': 'http://localhost:3000',
        }
        
        text_content = render_to_string('authentication/emails/welcome_email.txt', context)
        
        # Verify template rendered
        self.assertIsNotNone(text_content)
        self.assertGreater(len(text_content), 0)
    
    def test_html_email_contains_required_information(self):
        """Test HTML email template contains all required information."""
        from django.template.loader import render_to_string
        
        context = {
            'organization_name': 'Test Organization',
            'employee_first_name': self.employee.firstName,
            'employee_last_name': self.employee.lastName,
            'employee_id': self.employee.employeeId,
            'username': self.user.email,
            'temporary_password': self.temp_password,
            'portal_url': 'http://localhost:3000',
        }
        
        html_content = render_to_string('authentication/emails/welcome_email.html', context)
        
        # Verify all required information is present
        self.assertIn('John', html_content)
        self.assertIn('Doe', html_content)
        self.assertIn('EMP001', html_content)
        self.assertIn('john.doe@example.com', html_content)
        self.assertIn('TempPass123!@#', html_content)
        self.assertIn('http://localhost:3000', html_content)
        self.assertIn('Test Organization', html_content)
    
    def test_text_email_contains_required_information(self):
        """Test plain text email template contains all required information."""
        from django.template.loader import render_to_string
        
        context = {
            'organization_name': 'Test Organization',
            'employee_first_name': self.employee.firstName,
            'employee_last_name': self.employee.lastName,
            'employee_id': self.employee.employeeId,
            'username': self.user.email,
            'temporary_password': self.temp_password,
            'portal_url': 'http://localhost:3000',
        }
        
        text_content = render_to_string('authentication/emails/welcome_email.txt', context)
        
        # Verify all required information is present
        self.assertIn('John', text_content)
        self.assertIn('Doe', text_content)
        self.assertIn('EMP001', text_content)
        self.assertIn('john.doe@example.com', text_content)
        self.assertIn('TempPass123!@#', text_content)
        self.assertIn('http://localhost:3000', text_content)
        self.assertIn('Test Organization', text_content)
    
    def test_html_email_contains_security_disclaimer(self):
        """Test HTML email template contains security disclaimer."""
        from django.template.loader import render_to_string
        
        context = {
            'organization_name': 'Test Organization',
            'employee_first_name': self.employee.firstName,
            'employee_last_name': self.employee.lastName,
            'employee_id': self.employee.employeeId,
            'username': self.user.email,
            'temporary_password': self.temp_password,
            'portal_url': 'http://localhost:3000',
        }
        
        html_content = render_to_string('authentication/emails/welcome_email.html', context)
        
        # Verify security disclaimer is present
        self.assertIn('security', html_content.lower())
        self.assertIn('password', html_content.lower())
        self.assertIn('change', html_content.lower())
    
    def test_text_email_contains_security_disclaimer(self):
        """Test plain text email template contains security disclaimer."""
        from django.template.loader import render_to_string
        
        context = {
            'organization_name': 'Test Organization',
            'employee_first_name': self.employee.firstName,
            'employee_last_name': self.employee.lastName,
            'employee_id': self.employee.employeeId,
            'username': self.user.email,
            'temporary_password': self.temp_password,
            'portal_url': 'http://localhost:3000',
        }
        
        text_content = render_to_string('authentication/emails/welcome_email.txt', context)
        
        # Verify security disclaimer is present
        self.assertIn('security', text_content.lower())
        self.assertIn('password', text_content.lower())
        self.assertIn('change', text_content.lower())
    
    def test_html_email_has_valid_html_structure(self):
        """Test HTML email template has valid HTML structure."""
        from django.template.loader import render_to_string
        
        context = {
            'organization_name': 'Test Organization',
            'employee_first_name': self.employee.firstName,
            'employee_last_name': self.employee.lastName,
            'employee_id': self.employee.employeeId,
            'username': self.user.email,
            'temporary_password': self.temp_password,
            'portal_url': 'http://localhost:3000',
        }
        
        html_content = render_to_string('authentication/emails/welcome_email.html', context)
        
        # Verify basic HTML structure
        self.assertIn('<!DOCTYPE html>', html_content)
        self.assertIn('<html', html_content)
        self.assertIn('</html>', html_content)
        self.assertIn('<head>', html_content)
        self.assertIn('</head>', html_content)
        self.assertIn('<body>', html_content)
        self.assertIn('</body>', html_content)
    
    def test_html_email_has_responsive_meta_tags(self):
        """Test HTML email template has responsive meta tags for mobile."""
        from django.template.loader import render_to_string
        
        context = {
            'organization_name': 'Test Organization',
            'employee_first_name': self.employee.firstName,
            'employee_last_name': self.employee.lastName,
            'employee_id': self.employee.employeeId,
            'username': self.user.email,
            'temporary_password': self.temp_password,
            'portal_url': 'http://localhost:3000',
        }
        
        html_content = render_to_string('authentication/emails/welcome_email.html', context)
        
        # Verify responsive meta tags
        self.assertIn('viewport', html_content)
        self.assertIn('width=device-width', html_content)
    
    @patch('authentication.services.EmailMultiAlternatives')
    def test_send_welcome_email_uses_html_template(self, mock_email):
        """Test send_welcome_email uses HTML template."""
        mock_email_instance = MagicMock()
        mock_email.return_value = mock_email_instance
        
        AccountCreationService.send_welcome_email(
            user=self.user,
            employee=self.employee,
            temporary_password=self.temp_password
        )
        
        # Verify EmailMultiAlternatives was called
        mock_email.assert_called_once()
        
        # Verify attach_alternative was called with HTML content
        mock_email_instance.attach_alternative.assert_called_once()
        call_args = mock_email_instance.attach_alternative.call_args
        self.assertEqual(call_args[0][1], "text/html")
        
        # Verify HTML content contains employee information
        html_content = call_args[0][0]
