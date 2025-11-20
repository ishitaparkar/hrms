"""
Unit tests for phone authentication models.
"""
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from authentication.models import PhoneAuthAttempt, AccountSetupToken
from employee_management.models import Employee
import uuid


class PhoneAuthAttemptModelTest(TestCase):
    """Test PhoneAuthAttempt model functionality."""
    
    def test_create_phone_auth_attempt(self):
        """Test creating a phone authentication attempt."""
        attempt = PhoneAuthAttempt.objects.create(
            email='test@example.com',
            phone_number='+919876543210',
            success=False,
            ip_address='192.168.1.1',
            user_agent='Mozilla/5.0'
        )
        
        self.assertEqual(attempt.email, 'test@example.com')
        self.assertEqual(attempt.phone_number, '+919876543210')
        self.assertFalse(attempt.success)
        self.assertEqual(attempt.ip_address, '192.168.1.1')
        self.assertIsNotNone(attempt.attempt_time)
    
    def test_phone_auth_attempt_string_representation(self):
        """Test string representation of PhoneAuthAttempt."""
        attempt = PhoneAuthAttempt.objects.create(
            email='test@example.com',
            phone_number='+919876543210',
            success=True
        )
        
        self.assertIn('test@example.com', str(attempt))
        self.assertIn('Success', str(attempt))
    
    def test_phone_auth_attempt_ordering(self):
        """Test that attempts are ordered by time (newest first)."""
        attempt1 = PhoneAuthAttempt.objects.create(
            email='test1@example.com',
            phone_number='+919876543210'
        )
        attempt2 = PhoneAuthAttempt.objects.create(
            email='test2@example.com',
            phone_number='+919876543211'
        )
        
        attempts = PhoneAuthAttempt.objects.all()
        self.assertEqual(attempts[0].id, attempt2.id)
        self.assertEqual(attempts[1].id, attempt1.id)


class AccountSetupTokenModelTest(TestCase):
    """Test AccountSetupToken model functionality."""
    
    def setUp(self):
        """Create a test employee."""
        self.employee = Employee.objects.create(
            firstName='Test',
            lastName='Employee',
            employeeId='TEST001',
            personalEmail='test@example.com',
            mobileNumber='+919876543210',
            joiningDate='2025-01-01',
            department='Engineering',
            designation='Software Engineer'
        )
    
    def test_create_account_setup_token(self):
        """Test creating an account setup token."""
        token = AccountSetupToken.objects.create(
            employee=self.employee,
            token=str(uuid.uuid4())
        )
        
        self.assertEqual(token.employee, self.employee)
        self.assertIsNotNone(token.token)
        self.assertIsNotNone(token.created_at)
        self.assertIsNotNone(token.expires_at)
        self.assertFalse(token.used)
        self.assertIsNone(token.used_at)
    
    def test_token_auto_expiration(self):
        """Test that token expiration is automatically set to 1 hour."""
        token = AccountSetupToken.objects.create(
            employee=self.employee,
            token=str(uuid.uuid4())
        )
        
        # Check that expires_at is approximately 1 hour from now
        time_diff = token.expires_at - token.created_at
        self.assertAlmostEqual(time_diff.total_seconds(), 3600, delta=5)
    
    def test_token_is_valid_when_not_used_and_not_expired(self):
        """Test that token is valid when not used and not expired."""
        token = AccountSetupToken.objects.create(
            employee=self.employee,
            token=str(uuid.uuid4())
        )
        
        self.assertTrue(token.is_valid())
    
    def test_token_is_invalid_when_used(self):
        """Test that token is invalid when marked as used."""
        token = AccountSetupToken.objects.create(
            employee=self.employee,
            token=str(uuid.uuid4()),
            used=True,
            used_at=timezone.now()
        )
        
        self.assertFalse(token.is_valid())
    
    def test_token_is_invalid_when_expired(self):
        """Test that token is invalid when expired."""
        token = AccountSetupToken.objects.create(
            employee=self.employee,
            token=str(uuid.uuid4()),
            expires_at=timezone.now() - timedelta(hours=1)
        )
        
        self.assertFalse(token.is_valid())
    
    def test_token_string_representation(self):
        """Test string representation of AccountSetupToken."""
        token = AccountSetupToken.objects.create(
            employee=self.employee,
            token=str(uuid.uuid4())
        )
        
        self.assertIn('Test', str(token))
        self.assertIn('Employee', str(token))
        self.assertIn('Active', str(token))
    
    def test_token_unique_constraint(self):
        """Test that token field has unique constraint."""
        token_value = str(uuid.uuid4())
        AccountSetupToken.objects.create(
            employee=self.employee,
            token=token_value
        )
        
        # Try to create another token with the same value
        with self.assertRaises(Exception):
            AccountSetupToken.objects.create(
                employee=self.employee,
                token=token_value
            )
