"""
Integration tests for User Preferences - Save and Apply functionality.
"""
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from .models import UserPreferences
import time


class UserPreferencesSaveAndApplyTests(TestCase):
    """Test cases to verify preferences save and apply correctly."""
    
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
    
    def test_preferences_save_within_500ms(self):
        """Test that preferences save within 500ms as per requirement 3.4."""
        # Create initial preferences
        UserPreferences.objects.create(user=self.user)
        
        # Update preferences and measure time
        update_data = {
            'email_notifications': False,
            'theme': 'dark'
        }
        
        start_time = time.time()
        response = self.client.patch(
            '/api/auth/preferences/',
            update_data,
            format='json'
        )
        end_time = time.time()
        
        # Verify response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify save time (should be well under 500ms)
        save_time_ms = (end_time - start_time) * 1000
        self.assertLess(save_time_ms, 500, 
                       f"Save took {save_time_ms}ms, should be under 500ms")
        
        # Verify data was saved
        preferences = UserPreferences.objects.get(user=self.user)
        self.assertFalse(preferences.email_notifications)
        self.assertEqual(preferences.theme, 'dark')
    
    def test_preferences_persist_across_requests(self):
        """Test that saved preferences persist across multiple requests."""
        # Create and save preferences
        update_data = {
            'email_notifications': False,
            'sms_notifications': True,
            'push_notifications': False,
            'theme': 'dark'
        }
        
        response = self.client.patch(
            '/api/auth/preferences/',
            update_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Fetch preferences in a new request
        response = self.client.get('/api/auth/preferences/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify all preferences persisted
        self.assertFalse(response.data['email_notifications'])
        self.assertTrue(response.data['sms_notifications'])
        self.assertFalse(response.data['push_notifications'])
        self.assertEqual(response.data['theme'], 'dark')
    
    def test_theme_changes_apply_immediately(self):
        """Test that theme changes are saved and can be retrieved immediately."""
        # Create initial preferences with light theme
        UserPreferences.objects.create(user=self.user, theme='light')
        
        # Change to dark theme
        response = self.client.patch(
            '/api/auth/preferences/',
            {'theme': 'dark'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['theme'], 'dark')
        
        # Immediately fetch preferences
        response = self.client.get('/api/auth/preferences/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['theme'], 'dark')
        
        # Change to system theme
        response = self.client.patch(
            '/api/auth/preferences/',
            {'theme': 'system'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['theme'], 'system')
        
        # Verify it persisted
        response = self.client.get('/api/auth/preferences/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['theme'], 'system')
    
    def test_notification_toggles_save_correctly(self):
        """Test that notification toggle changes save correctly."""
        # Create initial preferences
        UserPreferences.objects.create(
            user=self.user,
            email_notifications=True,
            sms_notifications=False,
            push_notifications=True
        )
        
        # Toggle email notifications off
        response = self.client.patch(
            '/api/auth/preferences/',
            {'email_notifications': False},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['email_notifications'])
        
        # Toggle SMS notifications on
        response = self.client.patch(
            '/api/auth/preferences/',
            {'sms_notifications': True},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['sms_notifications'])
        
        # Verify both changes persisted
        response = self.client.get('/api/auth/preferences/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['email_notifications'])
        self.assertTrue(response.data['sms_notifications'])
        self.assertTrue(response.data['push_notifications'])  # Unchanged
    
    def test_multiple_rapid_updates(self):
        """Test that multiple rapid preference updates all save correctly."""
        # Create initial preferences
        UserPreferences.objects.create(user=self.user)
        
        # Make multiple rapid updates
        updates = [
            {'theme': 'dark'},
            {'email_notifications': False},
            {'sms_notifications': True},
            {'push_notifications': False},
            {'theme': 'light'},
        ]
        
        for update in updates:
            response = self.client.patch(
                '/api/auth/preferences/',
                update,
                format='json'
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify final state
        response = self.client.get('/api/auth/preferences/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['theme'], 'light')
        self.assertFalse(response.data['email_notifications'])
        self.assertTrue(response.data['sms_notifications'])
        self.assertFalse(response.data['push_notifications'])
    
    def test_invalid_theme_rejected(self):
        """Test that invalid theme values are rejected."""
        UserPreferences.objects.create(user=self.user, theme='light')
        
        # Try to set invalid theme
        response = self.client.patch(
            '/api/auth/preferences/',
            {'theme': 'invalid_theme'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Verify original theme unchanged
        response = self.client.get('/api/auth/preferences/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['theme'], 'light')
    
    def test_preferences_updated_timestamp(self):
        """Test that updated_at timestamp changes when preferences are saved."""
        # Create initial preferences
        preferences = UserPreferences.objects.create(user=self.user)
        initial_updated_at = preferences.updated_at
        
        # Wait a moment to ensure timestamp difference
        time.sleep(0.01)
        
        # Update preferences
        response = self.client.patch(
            '/api/auth/preferences/',
            {'theme': 'dark'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify updated_at changed
        preferences.refresh_from_db()
        self.assertGreater(preferences.updated_at, initial_updated_at)
