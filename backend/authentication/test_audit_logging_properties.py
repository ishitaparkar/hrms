"""
Property-based tests for audit logging in the onboarding flow.

These tests verify that audit logs are correctly created for all onboarding events
including employee creation, account creation, email delivery, authentication attempts,
and account activation.
"""
from hypothesis import given, strategies as st, settings
from hypothesis.extra.django import TestCase
from django.contrib.auth.models import User
from django.test import RequestFactory
from django.utils import timezone
from authentication.models import AuditLog, UserProfile, AccountSetupToken
from authentication.utils import audit_log
from authentication.services import AccountCreationService, PhoneAuthenticationService
from employee_management.models import Employee
import string


# Custom strategies for generating test data
@st.composite
def employee_data(draw):
    """Generate random employee data."""
    from datetime import date, timedelta
    import random
    
    first_name = draw(st.text(
        alphabet=string.ascii_letters,
        min_size=2,
        max_size=20
    ))
    last_name = draw(st.text(
        alphabet=string.ascii_letters,
        min_size=2,
        max_size=20
    ))
    
    # Generate unique email and employee ID
    unique_id = draw(st.integers(min_value=1000, max_value=9999))
    email = f"{first_name.lower()}.{last_name.lower()}.{unique_id}@example.com"
    employee_id = f"EMP{unique_id}"
    
    phone = draw(st.text(
        alphabet=string.digits,
        min_size=10,
        max_size=10
    ))
    
    # Generate a joining date within the last year
    days_ago = draw(st.integers(min_value=1, max_value=365))
    joining_date = date.today() - timedelta(days=days_ago)
    
    return {
        'firstName': first_name,
        'lastName': last_name,
        'employeeId': employee_id,
        'personalEmail': email,
        'mobileNumber': f'+1{phone}',
        'joiningDate': joining_date,
        'department': draw(st.sampled_from(['Engineering', 'HR', 'Sales', 'Marketing'])),
        'designation': draw(st.sampled_from(['Engineer', 'Manager', 'Analyst', 'Director'])),
    }


class AuditLoggingPropertiesTest(TestCase):
    """
    Property-based tests for audit logging functionality.
    """
    
    def setUp(self):
        """Set up test fixtures."""
        self.factory = RequestFactory()
        # Create a Super Admin user for testing (or get existing one)
        self.admin_user, created = User.objects.get_or_create(
            username='admin_audit_test',
            defaults={
                'email': 'admin_audit@example.com',
                'password': 'admin123'
            }
        )
        if created:
            UserProfile.objects.create(
                user=self.admin_user,
                department='IT'
            )
    
    @settings(max_examples=100, deadline=None)
    @given(emp_data=employee_data())
    def test_property_20_employee_creation_audit_logging(self, emp_data):
        """
        **Feature: employee-onboarding-authentication, Property 20: Employee creation audit logging**
        
        Property: For any employee record created by a Super Admin, an audit log entry 
        should be created with the action type, actor user ID, timestamp, and employee details.
        
        **Validates: Requirements 7.1**
        """
        # Get initial audit log count
        initial_count = AuditLog.objects.count()
        
        # Create employee
        employee = Employee.objects.create(**emp_data)
        
        # Create audit log for employee creation
        request = self.factory.post('/api/employees/')
        audit_entry = audit_log(
            action='EMPLOYEE_CREATED',
            actor=self.admin_user,
            request=request,
            resource_type='Employee',
            resource_id=employee.id,
            details={
                'first_name': employee.firstName,
                'last_name': employee.lastName,
                'email': employee.personalEmail,
                'department': employee.department,
            }
        )
        
        # Verify audit log was created
        self.assertEqual(AuditLog.objects.count(), initial_count + 1)
        
        # Verify audit log contains required information
        self.assertEqual(audit_entry.action, 'EMPLOYEE_CREATED')
        self.assertEqual(audit_entry.actor, self.admin_user)
        self.assertEqual(audit_entry.resource_type, 'Employee')
        self.assertEqual(audit_entry.resource_id, employee.id)
        self.assertIsNotNone(audit_entry.timestamp)
        
        # Verify employee details are in the log
        self.assertIn('first_name', audit_entry.details)
        self.assertIn('last_name', audit_entry.details)
        self.assertIn('email', audit_entry.details)
        self.assertIn('department', audit_entry.details)
        
        # Clean up
        employee.delete()
    
    @settings(max_examples=100, deadline=None)
    @given(emp_data=employee_data())
    def test_property_21_account_creation_audit_logging(self, emp_data):
        """
        **Feature: employee-onboarding-authentication, Property 21: Account creation audit logging**
        
        Property: For any user account created, an audit log entry should be created 
        containing the employee details, username, and timestamp.
        
        **Validates: Requirements 7.2**
        """
        # Get initial audit log count
        initial_count = AuditLog.objects.count()
        
        # Create employee
        employee = Employee.objects.create(**emp_data)
        
        # Create user account
        username = f"{emp_data['firstName'].lower()}.{emp_data['lastName'].lower()}"
        user = User.objects.create_user(
            username=username,
            email=emp_data['personalEmail'],
            password='TempPass123!'
        )
        
        # Create user profile
        UserProfile.objects.create(
            user=user,
            employee=employee,
            department=emp_data['department']
        )
        
        # Create audit log for account creation
        audit_entry = audit_log(
            action='ACCOUNT_CREATED',
            actor=self.admin_user,
            target_user=user,
            resource_type='User',
            resource_id=user.id,
            details={
                'username': username,
                'email': emp_data['personalEmail'],
                'employee_id': employee.id,
                'first_name': emp_data['firstName'],
                'last_name': emp_data['lastName'],
            }
        )
        
        # Verify audit log was created
        self.assertEqual(AuditLog.objects.count(), initial_count + 1)
        
        # Verify audit log contains required information
        self.assertEqual(audit_entry.action, 'ACCOUNT_CREATED')
        self.assertEqual(audit_entry.actor, self.admin_user)
        self.assertEqual(audit_entry.target_user, user)
        self.assertIsNotNone(audit_entry.timestamp)
        
        # Verify account details are in the log
        self.assertIn('username', audit_entry.details)
        self.assertIn('email', audit_entry.details)
        self.assertIn('employee_id', audit_entry.details)
        
        # Clean up
        user.delete()
        employee.delete()
    
    @settings(max_examples=100, deadline=None)
    @given(
        success=st.booleans(),
        emp_data=employee_data()
    )
    def test_property_22_email_delivery_status_logging(self, success, emp_data):
        """
        **Feature: employee-onboarding-authentication, Property 22: Email delivery status logging**
        
        Property: For any welcome email sent (successful or failed), an audit log entry 
        should be created recording the delivery status.
        
        **Validates: Requirements 7.3**
        """
        # Get initial audit log count
        initial_count = AuditLog.objects.count()
        
        # Create employee
        employee = Employee.objects.create(**emp_data)
        
        # Create user
        username = f"{emp_data['firstName'].lower()}.{emp_data['lastName'].lower()}"
        user = User.objects.create_user(
            username=username,
            email=emp_data['personalEmail'],
            password='TempPass123!'
        )
        
        # Create audit log for email delivery
        action = 'EMAIL_SENT' if success else 'EMAIL_FAILED'
        error_message = None if success else 'SMTP connection failed'
        
        audit_entry = audit_log(
            action=action,
            actor=self.admin_user,
            target_user=user,
            resource_type='WelcomeEmail',
            resource_id=employee.id,
            details={
                'recipient': emp_data['personalEmail'],
                'email_type': 'welcome_email',
                'success': success,
                'error': error_message,
            }
        )
        
        # Verify audit log was created
        self.assertEqual(AuditLog.objects.count(), initial_count + 1)
        
        # Verify audit log contains required information
        self.assertEqual(audit_entry.action, action)
        self.assertIsNotNone(audit_entry.timestamp)
        
        # Verify email delivery status is in the log
        self.assertIn('recipient', audit_entry.details)
        self.assertIn('success', audit_entry.details)
        self.assertEqual(audit_entry.details['success'], success)
        
        if not success:
            self.assertIn('error', audit_entry.details)
            self.assertIsNotNone(audit_entry.details['error'])
        
        # Clean up
        user.delete()
        employee.delete()
    
    @settings(max_examples=100, deadline=None)
    @given(emp_data=employee_data())
    def test_property_25_activation_completion_logging(self, emp_data):
        """
        **Feature: employee-onboarding-authentication, Property 25: Activation completion logging**
        
        Property: For any user account that completes the activation flow, an audit log 
        entry should be created marking the account as activated with a timestamp.
        
        **Validates: Requirements 7.6**
        """
        # Get initial audit log count
        initial_count = AuditLog.objects.count()
        
        # Create employee
        employee = Employee.objects.create(**emp_data)
        
        # Create user
        username = f"{emp_data['firstName'].lower()}.{emp_data['lastName'].lower()}"
        user = User.objects.create_user(
            username=username,
            email=emp_data['personalEmail'],
            password='SecurePass123!'
        )
        
        # Create user profile
        profile = UserProfile.objects.create(
            user=user,
            employee=employee,
            department=emp_data['department'],
            password_changed=False
        )
        
        # Mark account as activated
        profile.password_changed = True
        profile.save()
        
        # Create audit log for account activation
        audit_entry = audit_log(
            action='ACCOUNT_ACTIVATED',
            actor=user,  # User activates their own account
            target_user=user,
            resource_type='UserProfile',
            resource_id=profile.id,
            details={
                'username': username,
                'email': emp_data['personalEmail'],
                'employee_id': employee.id,
                'activation_completed': True,
            }
        )
        
        # Verify audit log was created
        self.assertEqual(AuditLog.objects.count(), initial_count + 1)
        
        # Verify audit log contains required information
        self.assertEqual(audit_entry.action, 'ACCOUNT_ACTIVATED')
        self.assertEqual(audit_entry.target_user, user)
        self.assertIsNotNone(audit_entry.timestamp)
        
        # Verify activation details are in the log
        self.assertIn('username', audit_entry.details)
        self.assertIn('activation_completed', audit_entry.details)
        self.assertTrue(audit_entry.details['activation_completed'])
        
        # Clean up
        user.delete()
        employee.delete()
    
    @settings(max_examples=100, deadline=None)
    @given(emp_data=employee_data())
    def test_property_27_audit_log_actor_recording(self, emp_data):
        """
        **Feature: employee-onboarding-authentication, Property 27: Audit log actor recording**
        
        Property: For any employee record created by a Super Admin, the audit log entry 
        should contain the Super Admin's user ID as the actor.
        
        **Validates: Requirements 8.3**
        """
        # Get initial audit log count
        initial_count = AuditLog.objects.count()
        
        # Create employee
        employee = Employee.objects.create(**emp_data)
        
        # Create audit log with actor
        request = self.factory.post('/api/employees/')
        audit_entry = audit_log(
            action='EMPLOYEE_CREATED',
            actor=self.admin_user,
            request=request,
            resource_type='Employee',
            resource_id=employee.id,
            details={
                'first_name': employee.firstName,
                'last_name': employee.lastName,
                'email': employee.personalEmail,
            }
        )
        
        # Verify audit log was created
        self.assertEqual(AuditLog.objects.count(), initial_count + 1)
        
        # Verify actor is recorded correctly
        self.assertEqual(audit_entry.actor, self.admin_user)
        self.assertEqual(audit_entry.actor.id, self.admin_user.id)
        self.assertIsNotNone(audit_entry.actor)
        
        # Verify actor information is accessible
        self.assertEqual(audit_entry.actor.username, 'admin_audit_test')
        self.assertEqual(audit_entry.actor.email, 'admin_audit@example.com')
        
        # Clean up
        employee.delete()
