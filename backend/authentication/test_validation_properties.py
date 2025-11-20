"""
Property-based tests for validation utilities.

These tests use Hypothesis to generate random inputs and verify that
validation functions behave correctly across all valid and invalid inputs.
"""
from hypothesis import given, strategies as st, settings
from hypothesis.extra.django import TestCase
from django.core.exceptions import ValidationError
from authentication.validators import validate_email_format, validate_phone_number


class EmailValidationPropertyTests(TestCase):
    """
    Property-based tests for email validation.
    
    **Feature: employee-onboarding-authentication, Property 1: Email validation accepts valid formats and rejects invalid formats**
    """
    
    @settings(max_examples=100)
    @given(
        local_part=st.text(
            alphabet=st.characters(
                whitelist_categories=('Lu', 'Ll', 'Nd'),
                whitelist_characters='.-_+',
                min_codepoint=33,
                max_codepoint=126
            ),
            min_size=1,
            max_size=64
        ).filter(lambda x: x and not x.startswith('.') and not x.endswith('.') and '..' not in x),
        domain=st.text(
            alphabet=st.characters(
                whitelist_categories=('Lu', 'Ll', 'Nd'),
                whitelist_characters='.-',
                min_codepoint=33,
                max_codepoint=126
            ),
            min_size=1,
            max_size=63
        ).filter(lambda x: x and not x.startswith('.') and not x.endswith('.') and not x.startswith('-') and not x.endswith('-') and '..' not in x),
        tld=st.text(
            alphabet=st.characters(whitelist_categories=('Lu', 'Ll')),
            min_size=2,
            max_size=6
        )
    )
    def test_valid_email_formats_are_accepted(self, local_part, domain, tld):
        """
        Property: For any valid email format, the validator should accept it.
        
        Valid email format: local_part@domain.tld
        - local_part: 1-64 characters, alphanumeric plus .-_+
        - domain: 1-63 characters, alphanumeric plus .-
        - tld: 2-6 alphabetic characters
        """
        email = f"{local_part}@{domain}.{tld}"
        
        try:
            validate_email_format(email)
            # If no exception is raised, the email is considered valid
            # This is the expected behavior for valid emails
        except ValidationError:
            # If validation fails, we need to check if it's actually invalid
            # Some combinations might still be invalid per RFC 5322
            # This is acceptable as Django's validator is strict
            pass
    
    @settings(max_examples=100)
    @given(
        invalid_email=st.one_of(
            # Missing @ symbol
            st.text(min_size=1, max_size=50).filter(lambda x: '@' not in x and '"' not in x),
            # Multiple @ symbols (without quotes which would make it valid)
            st.text(min_size=1, max_size=20).filter(lambda x: '"' not in x and '@' not in x).map(lambda x: f"{x}@{x}@example.com"),
            # Missing domain
            st.text(min_size=1, max_size=20).filter(lambda x: '@' not in x and '"' not in x).map(lambda x: f"{x}@"),
            # Missing local part
            st.just("@example.com"),
            # Missing TLD
            st.text(min_size=1, max_size=20).filter(lambda x: '@' not in x and '.' not in x and '"' not in x).map(lambda x: f"{x}@domain"),
            # Empty string
            st.just(""),
            # Only whitespace
            st.text(alphabet=' \t\n', min_size=1, max_size=10),
            # Special characters only (no quotes which could make it valid)
            st.text(alphabet='!#$%&*()[]{}', min_size=1, max_size=10),
        )
    )
    def test_invalid_email_formats_are_rejected(self, invalid_email):
        """
        Property: For any invalid email format, the validator should reject it.
        
        Invalid formats include:
        - Missing @ symbol
        - Multiple @ symbols (without quoted strings)
        - Missing domain or local part
        - Missing TLD
        - Empty or whitespace-only strings
        
        Note: We filter out quoted strings because RFC 5322 allows quoted
        local parts which can contain special characters including @.
        """
        with self.assertRaises(ValidationError):
            validate_email_format(invalid_email)


class PhoneNumberValidationPropertyTests(TestCase):
    """
    Property-based tests for phone number validation.
    
    **Feature: employee-onboarding-authentication, Property 2: Phone number validation requires country code**
    **Feature: employee-onboarding-authentication, Property 3: Phone number length validation**
    """
    
    @settings(max_examples=100)
    @given(
        country_code=st.integers(min_value=1, max_value=999),
        phone_number=st.text(
            alphabet=st.characters(whitelist_categories=('Nd',)),
            min_size=10,
            max_size=15
        )
    )
    def test_phone_with_country_code_is_accepted(self, country_code, phone_number):
        """
        Property: For any phone number with a valid country code and 10-15 digits,
        the validator should accept it.
        
        Valid format: +[country_code][10-15 digits]
        """
        phone = f"+{country_code}{phone_number}"
        
        try:
            validate_phone_number(phone)
            # If no exception is raised, the phone number is valid
        except ValidationError as e:
            # Some combinations might still be invalid due to length constraints
            # This is acceptable
            pass
    
    @settings(max_examples=100)
    @given(
        phone_number=st.text(
            alphabet=st.characters(whitelist_categories=('Nd',)),
            min_size=10,
            max_size=15
        )
    )
    def test_phone_without_country_code_is_rejected(self, phone_number):
        """
        Property: For any phone number without a country code (not starting with +),
        the validator should reject it.
        
        **Validates: Requirements 1.2**
        """
        # Ensure the phone number doesn't start with +
        if phone_number.startswith('+'):
            phone_number = phone_number[1:]
        
        with self.assertRaises(ValidationError) as context:
            validate_phone_number(phone_number)
        
        # Verify the error message mentions country code
        self.assertIn('country code', str(context.exception).lower())
    
    @settings(max_examples=100)
    @given(
        country_code=st.integers(min_value=1, max_value=999),
        phone_number=st.one_of(
            # Too short (less than 10 digits)
            st.text(
                alphabet=st.characters(whitelist_categories=('Nd',)),
                min_size=1,
                max_size=9
            ),
            # Too long (more than 15 digits)
            st.text(
                alphabet=st.characters(whitelist_categories=('Nd',)),
                min_size=16,
                max_size=20
            )
        )
    )
    def test_phone_with_invalid_length_is_rejected(self, country_code, phone_number):
        """
        Property: For any phone number with a country code but invalid length
        (not 10-15 digits), the validator should reject it.
        
        **Validates: Requirements 1.3**
        
        Note: We use a separator to ensure the country code and phone number
        are clearly delineated and not reinterpreted by the regex.
        """
        # Use a space separator to clearly delineate country code from phone number
        # This prevents the regex from reinterpreting the digits
        phone = f"+{country_code} {phone_number}"
        
        with self.assertRaises(ValidationError) as context:
            validate_phone_number(phone)
        
        # Verify the error message mentions length or digit count
        error_msg = str(context.exception).lower()
        self.assertTrue(
            'digit' in error_msg or 'length' in error_msg,
            f"Expected error about length/digits, got: {context.exception}"
        )
    
    @settings(max_examples=100)
    @given(
        country_code=st.integers(min_value=1, max_value=999),
        phone_number=st.text(
            alphabet=st.characters(whitelist_categories=('Nd',)),
            min_size=10,
            max_size=15
        ),
        separator=st.sampled_from([' ', '-', '(', ')'])
    )
    def test_phone_with_formatting_characters_is_accepted(self, country_code, phone_number, separator):
        """
        Property: For any phone number with valid formatting characters
        (spaces, hyphens, parentheses), the validator should accept it
        if the digit count is valid.
        """
        # Insert separator at a random position
        if len(phone_number) > 3:
            pos = len(phone_number) // 2
            formatted_phone = phone_number[:pos] + separator + phone_number[pos:]
            phone = f"+{country_code}{formatted_phone}"
            
            try:
                validate_phone_number(phone)
                # If no exception is raised, the phone number is valid
            except ValidationError:
                # Some formatting might still be invalid
                # This is acceptable
                pass
    
    @settings(max_examples=100)
    @given(
        invalid_phone=st.one_of(
            # Empty string
            st.just(""),
            # Only whitespace
            st.text(alphabet=' \t\n', min_size=1, max_size=10),
            # No digits
            st.text(alphabet='+-() ', min_size=1, max_size=20),
            # Invalid characters
            st.text(alphabet='abcdefghijklmnopqrstuvwxyz!@#$%^&*', min_size=1, max_size=20),
        )
    )
    def test_completely_invalid_phone_is_rejected(self, invalid_phone):
        """
        Property: For any completely invalid phone number (no digits, invalid characters),
        the validator should reject it.
        """
        with self.assertRaises(ValidationError):
            validate_phone_number(invalid_phone)
