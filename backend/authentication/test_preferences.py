"""
Tests for User Preferences API.
"""
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from .models import UserPreferences


class UserPreferencesAPITests(TestCase):
    """Test cases for User Preferences API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Authenticate client
        self.client.force_authenticate(user=self.user)
    
    def test_get_preferences_creates_default(self):
        """Test GET /api/auth/preferences/ creates default preferences if none exist."""
        response = self.client.get('/api/auth/preferences/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('email_notifications', response.data)
        self.assertIn('sms_notifications', response.data)
        self.assertIn('push_notifications', response.data)
        self.assertIn('theme', response.data)
        
        # Verify defaults
        self.assertTrue(response.data['email_notifications'])
        self.assertFalse(response.data['sms_notifications'])
        self.assertTrue(response.data['push_notifications'])
        self.assertEqual(response.data['theme'], 'system')
    
    def test_get_preferences_returns_existing(self):
        """Test GET /api/auth/preferences/ returns existing preferences."""
        # Create preferences
        preferences = UserPreferences.objects.create(
            user=self.user,
            email_notifications=False,
            theme='dark'
        )
        
        response = self.client.get('/api/auth/preferences/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], preferences.id)
        self.assertFalse(response.data['email_notifications'])
        self.assertEqual(response.data['theme'], 'dark')
    
    def test_patch_preferences_updates_fields(self):
        """Test PATCH /api/auth/preferences/ updates preferences."""
        # Create initial preferences
        UserPreferences.objects.create(user=self.user)
        
        # Update preferences
        update_data = {
            'email_notifications': False,
            'theme': 'dark'
        }
        
        response = self.client.patch(
            '/api/auth/preferences/',
            update_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['email_notifications'])
        self.assertEqual(response.data['theme'], 'dark')
        
        # Verify database was updated
        preferences = UserPreferences.objects.get(user=self.user)
        self.assertFalse(preferences.email_notifications)
        self.assertEqual(preferences.theme, 'dark')
    
    def test_patch_preferences_partial_update(self):
        """Test PATCH /api/auth/preferences/ allows partial updates."""
        # Create initial preferences
        UserPreferences.objects.create(
            user=self.user,
            email_notifications=True,
            theme='light'
        )
        
        # Update only theme
        update_data = {'theme': 'dark'}
        
        response = self.client.patch(
            '/api/auth/preferences/',
            update_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['theme'], 'dark')
        # Email notifications should remain unchanged
        self.assertTrue(response.data['email_notifications'])
    
    def test_patch_preferences_validates_theme(self):
        """Test PATCH /api/auth/preferences/ validates theme choices."""
        UserPreferences.objects.create(user=self.user)
        
        # Try invalid theme
        update_data = {'theme': 'invalid_theme'}
        
        response = self.client.patch(
            '/api/auth/preferences/',
            update_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('theme', response.data)
    
    def test_preferences_requires_authentication(self):
        """Test preferences endpoints require authentication."""
        # Logout
        self.client.force_authenticate(user=None)
        
        response = self.client.get('/api/auth/preferences/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        response = self.client.patch('/api/auth/preferences/', {})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_user_can_only_access_own_preferences(self):
        """Test users can only access their own preferences."""
        # Create another user
        other_user = User.objects.create_user(
            username='otheruser',
            password='testpass123'
        )
        UserPreferences.objects.create(
            user=other_user,
            theme='dark'
        )
        
        # Current user should get their own preferences
        response = self.client.get('/api/auth/preferences/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should create new preferences for current user, not return other user's
        preferences = UserPreferences.objects.get(user=self.user)
        self.assertEqual(response.data['id'], preferences.id)
