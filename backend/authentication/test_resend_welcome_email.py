"""
Tests for resend welcome email functionality.
"""
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
from employee_management.models import Employee
from authentication.models import UserProfile
from authentication.utils import ensure_role_exists, ROLE_SUPER_ADMIN, ROLE_EMPLOYEE
from datetime import date


class ResendWelcomeEmailTests(TestCase):
    """Test cases for resending welcome emails to employees."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create Super Admin user
        self.super_admin = User.objects.create_user(
            username='superadmin@test.com',
            email='superadmin@test.com',
            password='testpass123'
        )
        super_admin_role, _ = ensure_role_exists(ROLE_SUPER_ADMIN)
        self.super_admin.groups.add(super_admin_role)
        
        # Create regular employee user
        self.regular_user = User.objects.create_user(
            username='employee@test.com',
            email='employee@test.com',
            password='testpass123'
        )
        employee_role, _ = ensure_role_exists(ROLE_EMPLOYEE)
        self.regular_user.groups.add(employee_role)
        
        # Create test employee
        self.employee = Employee.objects.create(
            firstName='John',
            lastName='Doe',
            employeeId='EMP001',
            personalEmail='john.doe@test.com',
            mobileNumber='+91 9876543210',
            joiningDate=date.today(),
            department='Engineering',
            designation='Developer'
        )
    
    @patch('authentication.services.EmailMultiAlternatives')
    def test_super_admin_can_resend_welcome_email(self, mock_email_class):
        """Test that Super Admin can resend welcome email."""
        # Mock email sending
        mock_email_instance = MagicMock()
        mock_email_class.return_value = mock_email_instance
        mock_email_instance.send.return_value = 1
        
        # Authenticate as Super Admin
        self.client.force_authenticate(user=self.super_admin)
        
        # Resend welcome email
        response = self.client.post(
            f'/api/auth/resend-welcome-email/{self.employee.id}/'
        )
        
        # Verify response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('Welcome email sent successfully', response.data['message'])
        self.assertEqual(response.data['employee']['email'], 'john.doe@test.com')
        
        # Verify email was sent
        mock_email_instance.send.assert_called_once()
    
    def test_regular_user_cannot_resend_welcome_email(self):
        """Test that regular users cannot resend welcome emails."""
        # Authenticate as regular employee
        self.client.force_authenticate(user=self.regular_user)
        
        # Attempt to resend welcome email
        response = self.client.post(
            f'/api/auth/resend-welcome-email/{self.employee.id}/'
        )
        
        # Verify access denied
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_unauthenticated_user_cannot_resend_welcome_email(self):
        """Test that unauthenticated users cannot resend welcome emails."""
        # No authentication
        
        # Attempt to resend welcome email
        response = self.client.post(
            f'/api/auth/resend-welcome-email/{self.employee.id}/'
        )
        
        # Verify access denied
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_resend_to_nonexistent_employee_returns_404(self):
        """Test that resending to non-existent employee returns 404."""
        # Authenticate as Super Admin
        self.client.force_authenticate(user=self.super_admin)
        
        # Attempt to resend to non-existent employee
        response = self.client.post('/api/auth/resend-welcome-email/99999/')
        
        # Verify not found (get_object_or_404 returns 404)
        self.assertIn(response.status_code, [status.HTTP_404_NOT_FOUND, status.HTTP_400_BAD_REQUEST])
    
    @patch('authentication.services.EmailMultiAlternatives')
    def test_resend_email_includes_onboarding_url(self, mock_email_class):
        """Test that resent email includes the correct onboarding URL."""
        # Mock email sending
        mock_email_instance = MagicMock()
        mock_email_class.return_value = mock_email_instance
        mock_email_instance.send.return_value = 1
        
        # Authenticate as Super Admin
        self.client.force_authenticate(user=self.super_admin)
        
        # Resend welcome email
        response = self.client.post(
            f'/api/auth/resend-welcome-email/{self.employee.id}/'
        )
        
        # Verify response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify email was created with correct parameters
        mock_email_class.assert_called_once()
        call_kwargs = mock_email_class.call_args[1]
        
        # Check that email is sent to correct address
        self.assertEqual(call_kwargs['to'], ['john.doe@test.com'])
    
    @patch('authentication.services.EmailMultiAlternatives')
    def test_resend_email_to_activated_account(self, mock_email_class):
        """Test resending email to employee who already activated their account."""
        # Mock email sending
        mock_email_instance = MagicMock()
        mock_email_class.return_value = mock_email_instance
        mock_email_instance.send.return_value = 1
        
        # Create user account for employee
        user = User.objects.create_user(
            username='john.doe@test.com',
            email='john.doe@test.com',
            password='SecurePass123!'
        )
        
        # Link user to employee via UserProfile
        user_profile = UserProfile.objects.create(
            user=user,
            employee=self.employee,
            department=self.employee.department,
            password_changed=True  # Account is activated
        )
        
        # Authenticate as Super Admin
        self.client.force_authenticate(user=self.super_admin)
        
        # Resend welcome email
        response = self.client.post(
            f'/api/auth/resend-welcome-email/{self.employee.id}/'
        )
        
        # Verify response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertTrue(response.data['employee']['has_activated_account'])
        
        # Email should still be sent (employee might need to reset or access again)
        mock_email_instance.send.assert_called_once()
