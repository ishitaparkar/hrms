"""
Property-based tests for phone authentication service.

These tests verify the correctness properties of the phone authentication system
using Hypothesis for property-based testing.
"""
from hypothesis import given, strategies as st, settings
from hypothesis.extra.django import TestCase
from django.test import RequestFactory
from django.utils import timezone
from datetime import timedelta

from authentication.services import PhoneAuthenticationService
from authentication.models import PhoneAuthAttempt, AccountSetupToken
from employee_management.models import Employee


# Custom strategies for generating test data
@st.composite
def valid_email(draw):
    """Generate valid email addresses."""
    username = draw(st.text(
        alphabet=st.characters(whitelist_categories=('Ll', 'Nd'), min_codepoint=97, max_codepoint=122),
        min_size=3,
        max_size=20
    ))
    domain = draw(st.sampled_from(['example.com', 'test.org', 'company.net']))
    return f"{username}@{domain}"


@st.composite
def valid_phone_number(draw):
    """Generate valid phone numbers with country code."""
    country_code = draw(st.sampled_from(['+1', '+44', '+91', '+61', '+81']))
    # Generate 10-15 digits
    digit_count = draw(st.integers(min_value=10, max_value=15))
    digits = ''.join([str(draw(st.integers(min_value=0, max_value=9))) for _ in range(digit_count)])
    return f"{country_code}{digits}"


@st.composite
def employee_data(draw):
    """Generate valid employee data."""
    first_name = draw(st.text(
        alphabet=st.characters(whitelist_categories=('Lu', 'Ll'), min_codepoint=65, max_codepoint=122),
        min_size=2,
        max_size=20
    ))
    last_name = draw(st.text(
        alphabet=st.characters(whitelist_categories=('Lu', 'Ll'), min_codepoint=65, max_codepoint=122),
        min_size=2,
        max_size=20
    ))
    email = draw(valid_email())
    phone = draw(valid_phone_number())
    employee_id = draw(st.text(
        alphabet=st.characters(whitelist_categories=('Lu', 'Nd')),
        min_size=5,
        max_size=10
    ))
    
    return {
        'firstName': first_name,
        'lastName': last_name,
        'personalEmail': email,
        'mobileNumber': phone,
        'employeeId': employee_id,
        'department': 'Engineering',
        'designation': 'Software Engineer',
        'joiningDate': timezone.now().date(),
    }


class PhoneAuthenticationPropertyTests(TestCase):
    """
    Property-based tests for phone authentication.
    
    **Feature: employee-onboarding-authentication, Property 9: Email lookup verification**
    **Feature: employee-onboarding-authentication, Property 10: Phone number matching validation**
    **Feature: employee-onboarding-authentication, Property 11: Successful authentication proceeds to setup**
    **Validates: Requirements 3.2, 3.3, 3.4**
    """
    
    def setUp(self):
        """Set up test fixtures."""
        self.factory = RequestFactory()
    
    @settings(max_examples=100, deadline=None)
    @given(emp_data=employee_data())
    def test_property_9_email_lookup_verification(self, emp_data):
        """
        Property 9: Email lookup verification
        
        For any email address entered during phone authentication, the system should 
        return success if the email exists in an employee record and failure if it 
        does not exist.
        
        **Feature: employee-onboarding-authentication, Property 9: Email lookup verification**
        **Validates: Requirements 3.2**
        """
        # Create employee with the generated data
        employee = Employee.objects.create(**emp_data)
        
        # Test with existing email - should find the employee
        success, found_employee, error = PhoneAuthenticationService.verify_phone_number(
            email=emp_data['personalEmail'],
            phone_number=emp_data['mobileNumber']
        )
        
        # Should succeed and return the employee
        self.assertTrue(success, f"Authentication should succeed for existing email: {error}")
        self.assertIsNotNone(found_employee)
        self.assertEqual(found_employee.id, employee.id)
        
        # Test with non-existing email - should fail
        non_existing_email = f"nonexistent_{emp_data['personalEmail']}"
        success, found_employee, error = PhoneAuthenticationService.verify_phone_number(
            email=non_existing_email,
            phone_number=emp_data['mobileNumber']
        )
        
        # Should fail and return None
        self.assertFalse(success, "Authentication should fail for non-existing email")
        self.assertIsNone(found_employee)
        self.assertIn("No employee found", error)
        
        # Clean up
        employee.delete()
    
    @settings(max_examples=100, deadline=None)
    @given(emp_data=employee_data(), wrong_phone=valid_phone_number())
    def test_property_10_phone_number_matching_validation(self, emp_data, wrong_phone):
        """
        Property 10: Phone number matching validation
        
        For any employee record and phone number input, the authentication should 
        succeed if and only if the phone number exactly matches the phone number 
        stored in the employee record.
        
        **Feature: employee-onboarding-authentication, Property 10: Phone number matching validation**
        **Validates: Requirements 3.3**
        """
        # Ensure wrong_phone is different from the employee's phone
        if wrong_phone == emp_data['mobileNumber']:
            wrong_phone = wrong_phone + '1'  # Make it different
        
        # Create employee
        employee = Employee.objects.create(**emp_data)
        
        # Test with correct phone number - should succeed
        success, found_employee, error = PhoneAuthenticationService.verify_phone_number(
            email=emp_data['personalEmail'],
            phone_number=emp_data['mobileNumber']
        )
        
        self.assertTrue(success, f"Authentication should succeed with matching phone: {error}")
        self.assertIsNotNone(found_employee)
        self.assertEqual(found_employee.mobileNumber, emp_data['mobileNumber'])
        
        # Test with wrong phone number - should fail
        success, found_employee, error = PhoneAuthenticationService.verify_phone_number(
            email=emp_data['personalEmail'],
            phone_number=wrong_phone
        )
        
        self.assertFalse(success, "Authentication should fail with non-matching phone")
        self.assertIsNone(found_employee)
        self.assertIn("does not match", error.lower())
        
        # Clean up
        employee.delete()
    
    @settings(max_examples=100, deadline=None)
    @given(emp_data=employee_data())
    def test_property_11_successful_authentication_proceeds_to_setup(self, emp_data):
        """
        Property 11: Successful authentication proceeds to setup
        
        For any valid email and matching phone number combination, the authentication 
        should succeed and generate a temporary setup token that allows access to the 
        account setup flow.
        
        **Feature: employee-onboarding-authentication, Property 11: Successful authentication proceeds to setup**
        **Validates: Requirements 3.4**
        """
        # Create employee
        employee = Employee.objects.create(**emp_data)
        
        # Verify phone number (should succeed)
        success, found_employee, error = PhoneAuthenticationService.verify_phone_number(
            email=emp_data['personalEmail'],
            phone_number=emp_data['mobileNumber']
        )
        
        self.assertTrue(success, f"Authentication should succeed: {error}")
        self.assertIsNotNone(found_employee)
        
        # Generate auth token
        token = PhoneAuthenticationService.generate_auth_token(found_employee)
        
        # Verify token was generated
        self.assertIsNotNone(token)
        self.assertIsInstance(token, str)
        self.assertGreater(len(token), 0)
        
        # Verify AccountSetupToken was created
        setup_tokens = AccountSetupToken.objects.filter(employee=employee)
        self.assertGreater(setup_tokens.count(), 0, "Setup token should be created")
        
        # Verify token is valid (not used and not expired)
        latest_token = setup_tokens.latest('created_at')
        self.assertFalse(latest_token.used, "Token should not be marked as used")
        self.assertGreater(latest_token.expires_at, timezone.now(), "Token should not be expired")
        self.assertTrue(latest_token.is_valid(), "Token should be valid")
        
        # Clean up
        employee.delete()



class AuthenticationAttemptLoggingPropertyTests(TestCase):
    """
    Property-based tests for authentication attempt logging.
    
    **Feature: employee-onboarding-authentication, Property 23: Authentication attempt logging**
    **Feature: employee-onboarding-authentication, Property 24: Failed authentication counter increment**
    **Validates: Requirements 7.4, 7.5**
    """
    
    def setUp(self):
        """Set up test fixtures."""
        self.factory = RequestFactory()
    
    @settings(max_examples=100, deadline=None)
    @given(emp_data=employee_data())
    def test_property_23_authentication_attempt_logging(self, emp_data):
        """
        Property 23: Authentication attempt logging
        
        For any phone-based authentication attempt, an audit log entry should be 
        created with the timestamp, email, and outcome (success or failure).
        
        **Feature: employee-onboarding-authentication, Property 23: Authentication attempt logging**
        **Validates: Requirements 7.4**
        """
        from authentication.models import AuditLog
        
        # Create employee
        employee = Employee.objects.create(**emp_data)
        
        # Count initial attempts and audit logs
        initial_attempt_count = PhoneAuthAttempt.objects.filter(email=emp_data['personalEmail']).count()
        initial_audit_count = AuditLog.objects.filter(
            details__email=emp_data['personalEmail']
        ).count()
        
        # Perform successful authentication
        success, found_employee, error = PhoneAuthenticationService.verify_phone_number(
            email=emp_data['personalEmail'],
            phone_number=emp_data['mobileNumber']
        )
        
        # Verify PhoneAuthAttempt was created
        new_attempt_count = PhoneAuthAttempt.objects.filter(email=emp_data['personalEmail']).count()
        self.assertEqual(new_attempt_count, initial_attempt_count + 1, 
                        "PhoneAuthAttempt should be created for authentication")
        
        # Verify the attempt has correct data
        latest_attempt = PhoneAuthAttempt.objects.filter(email=emp_data['personalEmail']).latest('attempt_time')
        self.assertEqual(latest_attempt.email, emp_data['personalEmail'])
        self.assertEqual(latest_attempt.phone_number, emp_data['mobileNumber'])
        self.assertTrue(latest_attempt.success, "Attempt should be marked as successful")
        self.assertIsNotNone(latest_attempt.attempt_time)
        
        # Verify AuditLog was created
        new_audit_count = AuditLog.objects.filter(
            details__email=emp_data['personalEmail']
        ).count()
        self.assertGreater(new_audit_count, initial_audit_count, 
                          "AuditLog should be created for authentication")
        
        # Verify audit log contains required information
        latest_audit = AuditLog.objects.filter(
            details__email=emp_data['personalEmail']
        ).latest('timestamp')
        self.assertIn('email', latest_audit.details)
        self.assertEqual(latest_audit.details['email'], emp_data['personalEmail'])
        self.assertIsNotNone(latest_audit.timestamp)
        
        # Clean up
        employee.delete()
    
    @settings(max_examples=100, deadline=None)
    @given(emp_data=employee_data(), wrong_phone=valid_phone_number())
    def test_property_24_failed_authentication_counter_increment(self, emp_data, wrong_phone):
        """
        Property 24: Failed authentication counter increment
        
        For any failed phone-based authentication attempt, the failure counter for 
        that email should increment by exactly 1.
        
        **Feature: employee-onboarding-authentication, Property 24: Failed authentication counter increment**
        **Validates: Requirements 7.5**
        """
        # Ensure wrong_phone is different
        if wrong_phone == emp_data['mobileNumber']:
            wrong_phone = wrong_phone + '1'
        
        # Create employee
        employee = Employee.objects.create(**emp_data)
        
        # Get initial failed attempt count
        initial_failed_count = PhoneAuthenticationService.increment_failed_attempts(emp_data['personalEmail'])
        
        # Perform failed authentication (wrong phone number)
        success, found_employee, error = PhoneAuthenticationService.verify_phone_number(
            email=emp_data['personalEmail'],
            phone_number=wrong_phone
        )
        
        # Verify authentication failed
        self.assertFalse(success, "Authentication should fail with wrong phone")
        
        # Get new failed attempt count
        new_failed_count = PhoneAuthenticationService.increment_failed_attempts(emp_data['personalEmail'])
        
        # Verify counter incremented by exactly 1
        self.assertEqual(new_failed_count, initial_failed_count + 1,
                        f"Failed attempt counter should increment by 1. Initial: {initial_failed_count}, New: {new_failed_count}")
        
        # Verify PhoneAuthAttempt was created with success=False
        failed_attempts = PhoneAuthAttempt.objects.filter(
            email=emp_data['personalEmail'],
            success=False
        )
        self.assertGreater(failed_attempts.count(), 0, "Failed attempt should be logged")
        
        latest_failed = failed_attempts.latest('attempt_time')
        self.assertFalse(latest_failed.success, "Attempt should be marked as failed")
        self.assertEqual(latest_failed.email, emp_data['personalEmail'])
        
        # Clean up
        employee.delete()



class AccountLockoutUnitTests(TestCase):
    """
    Unit tests for account lockout functionality.
    
    Tests that 3 failed attempts trigger account lockout and that lockout 
    prevents further authentication.
    
    **Validates: Requirements 3.6**
    """
    
    def setUp(self):
        """Set up test fixtures."""
        self.factory = RequestFactory()
        
        # Create a test employee
        self.employee = Employee.objects.create(
            firstName='John',
            lastName='Doe',
            personalEmail='john.doe@example.com',
            mobileNumber='+919876543210',
            employeeId='EMP001',
            department='Engineering',
            designation='Software Engineer',
            joiningDate=timezone.now().date(),
        )
    
    def tearDown(self):
        """Clean up test data."""
        self.employee.delete()
    
    def test_three_failed_attempts_trigger_lockout(self):
        """
        Test that 3 failed attempts trigger account lockout.
        
        **Validates: Requirements 3.6**
        """
        wrong_phone = '+911234567890'
        
        # Attempt 1 - should fail but not lock
        success, employee, error = PhoneAuthenticationService.verify_phone_number(
            email=self.employee.personalEmail,
            phone_number=wrong_phone
        )
        self.assertFalse(success)
        self.assertIn("attempts remaining", error.lower())
        
        # Attempt 2 - should fail but not lock
        success, employee, error = PhoneAuthenticationService.verify_phone_number(
            email=self.employee.personalEmail,
            phone_number=wrong_phone
        )
        self.assertFalse(success)
        self.assertIn("attempts remaining", error.lower())
        
        # Attempt 3 - should fail but not lock
        success, employee, error = PhoneAuthenticationService.verify_phone_number(
            email=self.employee.personalEmail,
            phone_number=wrong_phone
        )
        self.assertFalse(success)
        self.assertIn("attempts remaining", error.lower())
        
        # Attempt 4 - should be locked
        success, employee, error = PhoneAuthenticationService.verify_phone_number(
            email=self.employee.personalEmail,
            phone_number=wrong_phone
        )
        self.assertFalse(success)
        self.assertIn("locked", error.lower())
        self.assertIn("contact hr", error.lower())
    
    def test_lockout_prevents_further_authentication(self):
        """
        Test that lockout prevents further authentication even with correct credentials.
        
        **Validates: Requirements 3.6**
        """
        wrong_phone = '+911234567890'
        
        # Create 3 failed attempts to trigger lockout
        for _ in range(3):
            PhoneAuthenticationService.verify_phone_number(
                email=self.employee.personalEmail,
                phone_number=wrong_phone
            )
        
        # Now try with correct phone number - should still be locked
        success, employee, error = PhoneAuthenticationService.verify_phone_number(
            email=self.employee.personalEmail,
            phone_number=self.employee.mobileNumber
        )
        
        self.assertFalse(success, "Authentication should fail when account is locked")
        self.assertIn("locked", error.lower())
        
        # Verify that no successful attempt was logged
        successful_attempts = PhoneAuthAttempt.objects.filter(
            email=self.employee.personalEmail,
            success=True
        )
        self.assertEqual(successful_attempts.count(), 0, 
                        "No successful attempts should be logged when account is locked")
    
    def test_lockout_creates_audit_log(self):
        """
        Test that account lockout creates an audit log entry.
        
        **Validates: Requirements 3.6**
        """
        from authentication.models import AuditLog
        
        wrong_phone = '+911234567890'
        
        # Create 3 failed attempts
        for _ in range(3):
            PhoneAuthenticationService.verify_phone_number(
                email=self.employee.personalEmail,
                phone_number=wrong_phone
            )
        
        # Get initial audit log count
        initial_audit_count = AuditLog.objects.filter(
            details__email=self.employee.personalEmail,
            details__reason__icontains='locked'
        ).count()
        
        # Attempt authentication while locked
        PhoneAuthenticationService.verify_phone_number(
            email=self.employee.personalEmail,
            phone_number=wrong_phone
        )
        
        # Verify audit log was created for lockout
        new_audit_count = AuditLog.objects.filter(
            details__email=self.employee.personalEmail,
            details__reason__icontains='locked'
        ).count()
        
        self.assertGreater(new_audit_count, initial_audit_count,
                          "Audit log should be created for account lockout")
