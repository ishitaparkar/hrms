"""
Property-based tests for password validation.

These tests verify that password validation correctly enforces security requirements
across a wide range of password inputs.
"""
from hypothesis import given, strategies as st, settings
from hypothesis.extra.django import TestCase
from authentication.services import PasswordValidationService


# Custom strategies for password generation
@st.composite
def valid_passwords(draw):
    """Generate valid passwords that meet all requirements."""
    # Minimum length is 8, generate passwords between 8 and 30 characters
    length = draw(st.integers(min_value=8, max_value=30))
    
    # Ensure at least one of each required character type
    uppercase = draw(st.sampled_from('ABCDEFGHIJKLMNOPQRSTUVWXYZ'))
    lowercase = draw(st.sampled_from('abcdefghijklmnopqrstuvwxyz'))
    digit = draw(st.sampled_from('0123456789'))
    special = draw(st.sampled_from('!@#$%^&*'))
    
    # Fill remaining length with any valid characters
    remaining_length = length - 4
    all_chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    remaining = draw(st.text(alphabet=all_chars, min_size=remaining_length, max_size=remaining_length))
    
    # Combine and shuffle
    password_chars = list(uppercase + lowercase + digit + special + remaining)
    draw(st.randoms()).shuffle(password_chars)
    
    return ''.join(password_chars)


@st.composite
def short_passwords(draw):
    """Generate passwords that are too short (less than 8 characters)."""
    length = draw(st.integers(min_value=0, max_value=7))
    all_chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    return draw(st.text(alphabet=all_chars, min_size=length, max_size=length))


@st.composite
def passwords_missing_uppercase(draw):
    """Generate passwords missing uppercase letters."""
    length = draw(st.integers(min_value=8, max_value=30))
    # Only lowercase, digits, and special characters
    chars = 'abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    password = draw(st.text(alphabet=chars, min_size=length, max_size=length))
    
    # Ensure it has at least one lowercase, digit, and special char
    if not any(c.islower() for c in password):
        password = 'a' + password[1:]
    if not any(c.isdigit() for c in password):
        password = password[:1] + '1' + password[2:]
    if not any(c in '!@#$%^&*' for c in password):
        password = password[:2] + '!' + password[3:]
    
    return password


@st.composite
def passwords_missing_lowercase(draw):
    """Generate passwords missing lowercase letters."""
    length = draw(st.integers(min_value=8, max_value=30))
    # Only uppercase, digits, and special characters
    chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    password = draw(st.text(alphabet=chars, min_size=length, max_size=length))
    
    # Ensure it has at least one uppercase, digit, and special char
    if not any(c.isupper() for c in password):
        password = 'A' + password[1:]
    if not any(c.isdigit() for c in password):
        password = password[:1] + '1' + password[2:]
    if not any(c in '!@#$%^&*' for c in password):
        password = password[:2] + '!' + password[3:]
    
    return password


@st.composite
def passwords_missing_digit(draw):
    """Generate passwords missing digits."""
    length = draw(st.integers(min_value=8, max_value=30))
    # Only letters and special characters
    chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*'
    password = draw(st.text(alphabet=chars, min_size=length, max_size=length))
    
    # Ensure it has at least one uppercase, lowercase, and special char
    if not any(c.isupper() for c in password):
        password = 'A' + password[1:]
    if not any(c.islower() for c in password):
        password = password[:1] + 'a' + password[2:]
    if not any(c in '!@#$%^&*' for c in password):
        password = password[:2] + '!' + password[3:]
    
    return password


@st.composite
def passwords_missing_special(draw):
    """Generate passwords missing special characters."""
    length = draw(st.integers(min_value=8, max_value=30))
    # Only letters and digits
    chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    password = draw(st.text(alphabet=chars, min_size=length, max_size=length))
    
    # Ensure it has at least one uppercase, lowercase, and digit
    if not any(c.isupper() for c in password):
        password = 'A' + password[1:]
    if not any(c.islower() for c in password):
        password = password[:1] + 'a' + password[2:]
    if not any(c.isdigit() for c in password):
        password = password[:2] + '1' + password[3:]
    
    return password


class PasswordLengthValidationPropertyTests(TestCase):
    """
    **Feature: employee-onboarding-authentication, Property 14: Password length validation**
    **Validates: Requirements 5.4**
    
    Test that password validation correctly enforces minimum length requirement.
    """
    
    @settings(max_examples=100)
    @given(password=valid_passwords())
    def test_valid_length_passwords_accepted(self, password):
        """
        For any password of 8 or more characters that meets all other requirements,
        the validator should accept it (no length error).
        """
        is_valid, errors = PasswordValidationService.validate_password_strength(password)
        
        # Should not have a length error
        length_errors = [e for e in errors if 'at least' in e and 'characters long' in e]
        self.assertEqual(len(length_errors), 0, f"Valid length password rejected with length error: {length_errors}")
    
    @settings(max_examples=100)
    @given(password=short_passwords())
    def test_short_passwords_rejected(self, password):
        """
        For any password shorter than 8 characters, the validator should reject it
        with a length error message.
        """
        is_valid, errors = PasswordValidationService.validate_password_strength(password)
        
        # Should have a length error
        length_errors = [e for e in errors if 'at least' in e and 'characters long' in e]
        self.assertGreater(len(length_errors), 0, f"Short password ({len(password)} chars) not rejected with length error")
        self.assertFalse(is_valid, "Short password marked as valid")


class PasswordComplexityValidationPropertyTests(TestCase):
    """
    **Feature: employee-onboarding-authentication, Property 15: Password complexity validation**
    **Validates: Requirements 5.5**
    
    Test that password validation correctly enforces complexity requirements
    (uppercase, lowercase, digit, special character).
    """
    
    @settings(max_examples=100)
    @given(password=valid_passwords())
    def test_passwords_meeting_all_requirements_accepted(self, password):
        """
        For any password that meets all requirements (length, uppercase, lowercase,
        digit, special character), the validator should accept it.
        """
        is_valid, errors = PasswordValidationService.validate_password_strength(password)
        
        self.assertTrue(is_valid, f"Valid password rejected with errors: {errors}")
        self.assertEqual(len(errors), 0, f"Valid password has errors: {errors}")
    
    @settings(max_examples=100)
    @given(password=passwords_missing_uppercase())
    def test_passwords_missing_uppercase_rejected(self, password):
        """
        For any password missing an uppercase letter, the validator should reject it
        with an uppercase error message.
        """
        is_valid, errors = PasswordValidationService.validate_password_strength(password)
        
        # Should have an uppercase error
        uppercase_errors = [e for e in errors if 'uppercase' in e.lower()]
        self.assertGreater(len(uppercase_errors), 0, "Password missing uppercase not rejected with uppercase error")
        self.assertFalse(is_valid, "Password missing uppercase marked as valid")
    
    @settings(max_examples=100)
    @given(password=passwords_missing_lowercase())
    def test_passwords_missing_lowercase_rejected(self, password):
        """
        For any password missing a lowercase letter, the validator should reject it
        with a lowercase error message.
        """
        is_valid, errors = PasswordValidationService.validate_password_strength(password)
        
        # Should have a lowercase error
        lowercase_errors = [e for e in errors if 'lowercase' in e.lower()]
        self.assertGreater(len(lowercase_errors), 0, "Password missing lowercase not rejected with lowercase error")
        self.assertFalse(is_valid, "Password missing lowercase marked as valid")
    
    @settings(max_examples=100)
    @given(password=passwords_missing_digit())
    def test_passwords_missing_digit_rejected(self, password):
        """
        For any password missing a digit, the validator should reject it
        with a digit/number error message.
        """
        is_valid, errors = PasswordValidationService.validate_password_strength(password)
        
        # Should have a digit error
        digit_errors = [e for e in errors if 'number' in e.lower() or 'digit' in e.lower()]
        self.assertGreater(len(digit_errors), 0, "Password missing digit not rejected with digit error")
        self.assertFalse(is_valid, "Password missing digit marked as valid")
    
    @settings(max_examples=100)
    @given(password=passwords_missing_special())
    def test_passwords_missing_special_character_rejected(self, password):
        """
        For any password missing a special character, the validator should reject it
        with a special character error message.
        """
        is_valid, errors = PasswordValidationService.validate_password_strength(password)
        
        # Should have a special character error
        special_errors = [e for e in errors if 'special' in e.lower()]
        self.assertGreater(len(special_errors), 0, "Password missing special character not rejected with special error")
        self.assertFalse(is_valid, "Password missing special character marked as valid")
    
    @settings(max_examples=100)
    @given(
        password=st.text(
            alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*',
            min_size=8,
            max_size=30
        )
    )
    def test_validation_consistency(self, password):
        """
        For any password, validation should be consistent - calling it multiple times
        should return the same result.
        """
        result1 = PasswordValidationService.validate_password_strength(password)
        result2 = PasswordValidationService.validate_password_strength(password)
        
        self.assertEqual(result1, result2, "Password validation is not consistent")
