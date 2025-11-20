"""
Property-based tests for password hashing security.

**Feature: employee-onboarding-authentication, Property 16: Password hashing security**
**Validates: Requirements 5.7**
"""
from hypothesis import given, strategies as st, settings
from hypothesis.extra.django import TestCase
from django.contrib.auth.models import User
from django.contrib.auth.hashers import check_password


class TestPasswordHashingProperties(TestCase):
    """
    Property-based tests for password hashing security.
    
    These tests verify that passwords are properly hashed and never stored in plaintext.
    """
    
    @given(
        username=st.text(min_size=1, max_size=50, alphabet=st.characters(
            whitelist_categories=('Lu', 'Ll', 'Nd'),
            whitelist_characters='@.-_'
        )),
        password=st.text(min_size=8, max_size=128)
    )
    @settings(max_examples=100, deadline=None)
    def test_password_hashing_security(self, username, password):
        """
        **Feature: employee-onboarding-authentication, Property 16: Password hashing security**
        
        Property: For any valid password submitted during account setup,
        the stored password in the database should be a cryptographic hash
        and should never match the plaintext password.
        
        This test verifies:
        1. The stored password is not the plaintext password
        2. The stored password is a valid hash
        3. The hash can be verified against the original password
        """
        # Clean up any existing user with this username
        User.objects.filter(username=username).delete()
        
        try:
            # Create a user with the password
            user = User.objects.create_user(
                username=username,
                password=password
            )
            
            # Verify the stored password is NOT the plaintext password
            assert user.password != password, \
                f"Password stored in plaintext! Stored: {user.password}, Original: {password}"
            
            # Verify the stored password is a hash (should start with algorithm identifier)
            # Django uses formats like: pbkdf2_sha256$..., argon2$..., bcrypt$...
            assert '$' in user.password, \
                f"Password does not appear to be hashed (missing $ separator): {user.password}"
            
            # Verify the hash can be verified against the original password
            assert check_password(password, user.password), \
                f"Password hash verification failed for password: {password}"
            
            # Verify a different password doesn't match
            if len(password) > 0:
                wrong_password = password + 'x'
                assert not check_password(wrong_password, user.password), \
                    f"Wrong password incorrectly verified as correct"
            
        finally:
            # Clean up
            User.objects.filter(username=username).delete()
