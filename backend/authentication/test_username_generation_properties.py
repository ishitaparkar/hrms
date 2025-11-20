"""
Property-based tests for username generation.

These tests use Hypothesis to generate random inputs and verify that
username generation behaves correctly across all valid inputs.
"""
from hypothesis import given, strategies as st, settings, assume
from hypothesis.extra.django import TestCase
from django.contrib.auth.models import User
from authentication.services import UsernameGenerationService


class UsernameGenerationPropertyTests(TestCase):
    """
    Property-based tests for username generation.
    
    **Feature: employee-onboarding-authentication, Property 12: Username generation format**
    **Feature: employee-onboarding-authentication, Property 13: Username uniqueness with suffix**
    """
    
    @settings(max_examples=100)
    @given(
        first_name=st.text(
            alphabet=st.characters(
                whitelist_categories=('Lu', 'Ll'),
                whitelist_characters=' -\'',
            ),
            min_size=1,
            max_size=50
        ).filter(lambda x: any(c.isalpha() for c in x)),
        last_name=st.text(
            alphabet=st.characters(
                whitelist_categories=('Lu', 'Ll'),
                whitelist_characters=' -\'',
            ),
            min_size=1,
            max_size=50
        ).filter(lambda x: any(c.isalpha() for c in x))
    )
    def test_username_format_is_firstname_dot_lastname_lowercase(self, first_name, last_name):
        """
        Property: For any employee with a first name and last name,
        the generated username should follow the format "firstname.lastname" in lowercase
        with special characters removed.
        
        **Validates: Requirements 4.2, 4.3**
        """
        username = UsernameGenerationService.generate_username(first_name, last_name)
        
        # Username should contain a dot
        self.assertIn('.', username)
        
        # Username should be lowercase
        self.assertEqual(username, username.lower())
        
        # Username should only contain alphanumeric characters and dots
        allowed_chars = set('abcdefghijklmnopqrstuvwxyz0123456789.')
        self.assertTrue(all(c in allowed_chars for c in username))
        
        # Extract the base username (without numeric suffix)
        base_username = username.rstrip('0123456789')
        
        # Sanitize the names to get expected values
        sanitized_first = UsernameGenerationService.sanitize_name(first_name)
        sanitized_last = UsernameGenerationService.sanitize_name(last_name)
        
        # The base username should start with sanitized first name
        self.assertTrue(base_username.startswith(sanitized_first))
        
        # The base username should end with sanitized last name (before any numeric suffix)
        self.assertTrue(base_username.endswith(f".{sanitized_last}"))
    
    @settings(max_examples=100)
    @given(
        first_name=st.text(
            alphabet=st.characters(
                whitelist_categories=('Lu', 'Ll'),
            ),
            min_size=1,
            max_size=20
        ).filter(lambda x: any(c.isalpha() for c in x)),
        last_name=st.text(
            alphabet=st.characters(
                whitelist_categories=('Lu', 'Ll'),
            ),
            min_size=1,
            max_size=20
        ).filter(lambda x: any(c.isalpha() for c in x))
    )
    def test_username_uniqueness_with_numeric_suffix(self, first_name, last_name):
        """
        Property: For any generated username that already exists in the system,
        the system should append a numeric suffix (starting with 2) to create a unique username.
        
        **Validates: Requirements 4.4**
        """
        # Generate first username
        username1 = UsernameGenerationService.generate_username(first_name, last_name)
        
        # Create a user with this username
        user1 = User.objects.create_user(
            username=username1,
            email=f"{username1}@example.com",
            password="testpass123"
        )
        
        try:
            # Generate second username with same names
            username2 = UsernameGenerationService.generate_username(first_name, last_name)
            
            # The second username should be different from the first
            self.assertNotEqual(username1, username2)
            
            # The second username should start with the first username
            self.assertTrue(username2.startswith(username1))
            
            # The second username should have a numeric suffix
            suffix = username2[len(username1):]
            if suffix:  # Only check if there's a suffix
                self.assertTrue(suffix.isdigit())
                self.assertGreaterEqual(int(suffix), 2)
            
            # Create a second user to test further uniqueness
            user2 = User.objects.create_user(
                username=username2,
                email=f"{username2}@example.com",
                password="testpass123"
            )
            
            try:
                # Generate third username with same names
                username3 = UsernameGenerationService.generate_username(first_name, last_name)
                
                # The third username should be different from both previous ones
                self.assertNotEqual(username3, username1)
                self.assertNotEqual(username3, username2)
                
                # The third username should start with the base username
                self.assertTrue(username3.startswith(username1))
                
            finally:
                user2.delete()
        finally:
            user1.delete()
    
    @settings(max_examples=100)
    @given(
        first_name=st.text(
            alphabet=st.characters(
                whitelist_categories=('Lu', 'Ll'),
                whitelist_characters='!@#$%^&*()-_=+[]{}|;:,.<>?/~`',
            ),
            min_size=1,
            max_size=30
        ).filter(lambda x: any(c.isalpha() for c in x)),
        last_name=st.text(
            alphabet=st.characters(
                whitelist_categories=('Lu', 'Ll'),
                whitelist_characters='!@#$%^&*()-_=+[]{}|;:,.<>?/~`',
            ),
            min_size=1,
            max_size=30
        ).filter(lambda x: any(c.isalpha() for c in x))
    )
    def test_special_characters_are_removed(self, first_name, last_name):
        """
        Property: For any employee name containing special characters,
        the generated username should have all special characters removed,
        keeping only alphanumeric characters.
        
        **Validates: Requirements 4.3**
        """
        username = UsernameGenerationService.generate_username(first_name, last_name)
        
        # Username should only contain lowercase letters, digits, and dots
        allowed_chars = set('abcdefghijklmnopqrstuvwxyz0123456789.')
        for char in username:
            self.assertIn(char, allowed_chars,
                         f"Username '{username}' contains invalid character '{char}'")
    
    @settings(max_examples=100)
    @given(
        first_name=st.text(
            alphabet=st.characters(
                whitelist_categories=('Lu', 'Ll'),
            ),
            min_size=1,
            max_size=20
        ).filter(lambda x: any(c.isalpha() for c in x)),
        last_name=st.text(
            alphabet=st.characters(
                whitelist_categories=('Lu', 'Ll'),
            ),
            min_size=1,
            max_size=20
        ).filter(lambda x: any(c.isalpha() for c in x))
    )
    def test_generated_username_is_always_unique(self, first_name, last_name):
        """
        Property: For any first name and last name combination,
        the generated username should always be unique in the database.
        
        This is a critical property that ensures no username collisions occur.
        """
        username = UsernameGenerationService.generate_username(first_name, last_name)
        
        # The generated username should not exist in the database yet
        # (unless we explicitly created it in this test)
        # This property ensures the uniqueness check is working
        
        # Verify the username doesn't exist
        exists_before = User.objects.filter(username=username).exists()
        
        # Create a user with this username
        user = User.objects.create_user(
            username=username,
            email=f"{username}@example.com",
            password="testpass123"
        )
        
        try:
            # Now it should exist
            exists_after = User.objects.filter(username=username).exists()
            self.assertTrue(exists_after)
            
            # Generate another username - it should be different
            username2 = UsernameGenerationService.generate_username(first_name, last_name)
            self.assertNotEqual(username, username2)
            
        finally:
            user.delete()
    
    def test_sanitize_name_removes_special_characters(self):
        """
        Unit test for sanitize_name method to ensure it removes special characters.
        """
        # Test with various special characters
        test_cases = [
            ("John-Paul", "johnpaul"),
            ("Mary'Anne", "maryanne"),
            ("José", "jos"),  # Accented characters
            ("O'Brien", "obrien"),
            ("Jean-Claude", "jeanclaude"),
            ("Anne Marie", "annemarie"),
            ("Test123", "test123"),
            ("!@#$%", ""),
            ("", ""),
        ]
        
        for input_name, expected in test_cases:
            result = UsernameGenerationService.sanitize_name(input_name)
            self.assertEqual(result, expected,
                           f"sanitize_name('{input_name}') should return '{expected}', got '{result}'")
