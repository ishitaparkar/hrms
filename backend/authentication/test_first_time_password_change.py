from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

from .models import UserProfile


class FirstTimePasswordChangeTests(TestCase):
    """Test cases for first-time password change endpoint."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create test user
        self.user = User.objects.create_user(
            username='testuser@example.com',
            email='testuser@example.com',
            password='TempPass123'
        )
        
        # Create user profile with password_changed = False
        self.profile = UserProfile.objects.create(
            user=self.user,
            department='Computer Science',
            password_changed=False
        )
    
    def test_first_time_password_change_success(self):
        """Test successful first-time password change."""
        # Authenticate user
        self.client.force_authenticate(user=self.user)
        
        # Change password
        response = self.client.post('/api/auth/first-login-password-change/', {
            'old_password': 'TempPass123',
            'new_password': 'NewSecure123'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Password changed successfully.')
        
        # Verify password was changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewSecure123'))
        
        # Verify password_changed flag was set
        self.profile.refresh_from_db()
        self.assertTrue(self.profile.password_changed)
    
    def test_first_time_password_change_incorrect_old_password(self):
        """Test password change fails with incorrect old password."""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.post('/api/auth/first-login-password-change/', {
            'old_password': 'WrongPassword',
            'new_password': 'NewSecure123'
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'Old password is incorrect.')
        
        # Verify password was not changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('TempPass123'))
        
        # Verify password_changed flag was not set
        self.profile.refresh_from_db()
        self.assertFalse(self.profile.password_changed)
    
    def test_first_time_password_change_too_short(self):
        """Test password change fails when new password is too short."""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.post('/api/auth/first-login-password-change/', {
            'old_password': 'TempPass123',
            'new_password': 'Short1'
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'New password must be at least 8 characters long.')
        
        # Verify password was not changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('TempPass123'))
    
    def test_first_time_password_change_no_letters(self):
        """Test password change fails when new password has no letters."""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.post('/api/auth/first-login-password-change/', {
            'old_password': 'TempPass123',
            'new_password': '12345678'
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'New password must contain both letters and numbers.')
    
    def test_first_time_password_change_no_numbers(self):
        """Test password change fails when new password has no numbers."""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.post('/api/auth/first-login-password-change/', {
            'old_password': 'TempPass123',
            'new_password': 'OnlyLetters'
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'New password must contain both letters and numbers.')
    
    def test_first_time_password_change_missing_old_password(self):
        """Test password change fails when old_password is missing."""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.post('/api/auth/first-login-password-change/', {
            'new_password': 'NewSecure123'
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'Both old_password and new_password are required.')
    
    def test_first_time_password_change_missing_new_password(self):
        """Test password change fails when new_password is missing."""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.post('/api/auth/first-login-password-change/', {
            'old_password': 'TempPass123'
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'Both old_password and new_password are required.')
    
    def test_first_time_password_change_unauthenticated(self):
        """Test password change fails for unauthenticated user."""
        response = self.client.post('/api/auth/first-login-password-change/', {
            'old_password': 'TempPass123',
            'new_password': 'NewSecure123'
        })
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_first_time_password_change_user_without_profile(self):
        """Test password change works for user without profile."""
        # Create user without profile
        user_no_profile = User.objects.create_user(
            username='noprofile@example.com',
            email='noprofile@example.com',
            password='TempPass123'
        )
        
        self.client.force_authenticate(user=user_no_profile)
        
        response = self.client.post('/api/auth/first-login-password-change/', {
            'old_password': 'TempPass123',
            'new_password': 'NewSecure123'
        })
        
        # Should still succeed (password changed, but no profile to update)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify password was changed
        user_no_profile.refresh_from_db()
        self.assertTrue(user_no_profile.check_password('NewSecure123'))
