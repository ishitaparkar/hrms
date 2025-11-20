"""
Unit tests for username generation service.

These tests verify the basic functionality of the UsernameGenerationService.
"""
from django.test import TestCase
from django.contrib.auth.models import User
from authentication.services import UsernameGenerationService


class UsernameGenerationUnitTests(TestCase):
    """
    Unit tests for username generation.
    """
    
    def test_basic_username_generation(self):
        """Test basic username generation with simple names."""
        username = UsernameGenerationService.generate_username('John', 'Doe')
        self.assertEqual(username, 'john.doe')
    
    def test_username_with_special_characters(self):
        """Test username generation removes special characters."""
        username = UsernameGenerationService.generate_username('Jean-Claude', "O'Brien")
        self.assertEqual(username, 'jeanclaude.obrien')
    
    def test_username_with_spaces(self):
        """Test username generation removes spaces."""
        username = UsernameGenerationService.generate_username('Mary Anne', 'Van Der Berg')
        self.assertEqual(username, 'maryanne.vanderberg')
    
    def test_username_uniqueness_with_suffix(self):
        """Test that duplicate usernames get numeric suffixes."""
        # Create first user
        User.objects.create_user(
            username='john.doe',
            email='john.doe@example.com',
            password='testpass123'
        )
        
        # Generate username for same name - should get suffix
        username = UsernameGenerationService.generate_username('John', 'Doe')
        self.assertEqual(username, 'john.doe2')
        
        # Create second user
        User.objects.create_user(
            username='john.doe2',
            email='john.doe2@example.com',
            password='testpass123'
        )
        
        # Generate username again - should get next suffix
        username = UsernameGenerationService.generate_username('John', 'Doe')
        self.assertEqual(username, 'john.doe3')
    
    def test_sanitize_name_basic(self):
        """Test sanitize_name with basic input."""
        result = UsernameGenerationService.sanitize_name('John')
        self.assertEqual(result, 'john')
    
    def test_sanitize_name_with_special_chars(self):
        """Test sanitize_name removes special characters."""
        test_cases = [
            ('José', 'jos'),
            ("O'Brien", 'obrien'),
            ('Jean-Claude', 'jeanclaude'),
            ('Mary Anne', 'maryanne'),
            ('Test123', 'test123'),
            ('!@#$%', ''),
            ('', ''),
        ]
        
        for input_name, expected in test_cases:
            with self.subTest(input_name=input_name):
                result = UsernameGenerationService.sanitize_name(input_name)
                self.assertEqual(result, expected)
    
    def test_username_is_lowercase(self):
        """Test that generated usernames are always lowercase."""
        username = UsernameGenerationService.generate_username('JOHN', 'DOE')
        self.assertEqual(username, 'john.doe')
        self.assertEqual(username, username.lower())
    
    def test_username_format_with_numbers(self):
        """Test username generation with names containing numbers."""
        username = UsernameGenerationService.generate_username('John2', 'Doe3')
        self.assertEqual(username, 'john2.doe3')
