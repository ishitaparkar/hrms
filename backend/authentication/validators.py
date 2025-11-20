"""
Validation utilities for email and phone number validation.
"""
import re
from django.core.exceptions import ValidationError
from django.core.validators import EmailValidator as DjangoEmailValidator


def validate_email_format(value):
    """
    Validate email format according to RFC 5322.
    
    Uses Django's built-in EmailValidator which implements RFC 5322 validation.
    
    Args:
        value (str): Email address to validate
        
    Raises:
        ValidationError: If email format is invalid
        
    Example:
        >>> validate_email_format("user@example.com")  # Valid
        >>> validate_email_format("invalid.email")  # Raises ValidationError
    """
    if not value:
        raise ValidationError("Email address is required")
    
    # Use Django's EmailValidator which implements RFC 5322
    validator = DjangoEmailValidator(message="Please enter a valid email address (e.g., user@example.com)")
    validator(value)


def validate_phone_number(value):
    """
    Validate phone number format with country code.
    
    Format requirements:
    - Must start with '+' followed by 1-3 digit country code
    - Must have a separator (space, hyphen, or parenthesis) after country code
    - Phone number part must be 10-15 digits (excluding country code)
    - May contain additional spaces, hyphens, or parentheses for formatting
    
    Examples of valid formats:
        +91 9876543210
        +1 415 555 2671
        +44 20 7946 0958
        +1-415-555-2671
        +91 (987) 654-3210
    
    Args:
        value (str): Phone number to validate
        
    Raises:
        ValidationError: If phone number format is invalid
    """
    if not value:
        raise ValidationError("Phone number is required")
    
    # Check if phone number starts with country code
    if not value.startswith('+'):
        raise ValidationError("Phone number must include country code (e.g., +1, +91, +44)")
    
    # Validate that the phone number contains only valid characters
    # Allow digits, spaces, hyphens, parentheses, and the leading +
    if not re.match(r'^\+[\d\s\-\(\)]+$', value):
        raise ValidationError("Phone number contains invalid characters")
    
    # Match country code (1-3 digits) followed by a separator
    # This ensures clear delineation between country code and phone number
    country_code_match = re.match(r'^\+(\d{1,3})[\s\-\(]', value)
    if not country_code_match:
        raise ValidationError("Phone number must have a separator (space, hyphen, or parenthesis) after the country code")
    
    # Remove all non-digit characters to count digits
    digits_only = re.sub(r'[^\d]', '', value)
    
    # Calculate phone number length (excluding country code)
    country_code_length = len(country_code_match.group(1))
    phone_number_length = len(digits_only) - country_code_length
    
    # Validate phone number length (10-15 digits)
    if phone_number_length < 10:
        raise ValidationError("Phone number must be between 10 and 15 digits excluding the country code")
    
    if phone_number_length > 15:
        raise ValidationError("Phone number must be between 10 and 15 digits excluding the country code")
