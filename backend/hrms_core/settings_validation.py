"""
Settings validation module for HRMS application.

This module validates that all required environment variables are properly configured
and provides helpful error messages for missing or invalid settings.
"""

import os
import sys
from django.core.exceptions import ImproperlyConfigured


def validate_required_settings():
    """
    Validate that all required environment variables are properly configured.
    
    This function should be called during Django startup to ensure the application
    has all necessary configuration before accepting requests.
    
    Raises:
        ImproperlyConfigured: If any required settings are missing or invalid
    """
    errors = []
    warnings = []
    
    # Check if we're in production mode
    is_production = os.environ.get('DEBUG', 'True') != 'True'
    
    # =============================================================================
    # CRITICAL SETTINGS (Required in all environments)
    # =============================================================================
    
    # Database configuration
    required_db_vars = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT']
    for var in required_db_vars:
        if not os.environ.get(var):
            errors.append(f"Missing required environment variable: {var}")
    
    # =============================================================================
    # PRODUCTION-ONLY CRITICAL SETTINGS
    # =============================================================================
    
    if is_production:
        # Secret key must be changed in production
        secret_key = os.environ.get('SECRET_KEY', '')
        if not secret_key or 'django-insecure' in secret_key:
            errors.append(
                "SECRET_KEY must be set to a secure value in production. "
                "Generate one using: python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'"
            )
        
        # Allowed hosts must be configured
        if not os.environ.get('ALLOWED_HOSTS'):
            errors.append(
                "ALLOWED_HOSTS must be configured in production. "
                "Set it to a comma-separated list of allowed domains."
            )
        
        # Email backend should be SMTP in production
        email_backend = os.environ.get('EMAIL_BACKEND', '')
        if 'console' in email_backend.lower():
            warnings.append(
                "EMAIL_BACKEND is set to console backend in production. "
                "Consider using SMTP backend for production environments."
            )
        
        # SMTP settings should be configured if using SMTP backend
        if 'smtp' in email_backend.lower():
            smtp_vars = ['EMAIL_HOST', 'EMAIL_HOST_USER', 'EMAIL_HOST_PASSWORD']
            for var in smtp_vars:
                if not os.environ.get(var):
                    errors.append(f"Missing required SMTP setting: {var}")
    
    # =============================================================================
    # ONBOARDING CONFIGURATION VALIDATION
    # =============================================================================
    
    # Portal URL should be configured
    portal_url = os.environ.get('PORTAL_URL', '')
    if not portal_url:
        warnings.append(
            "PORTAL_URL is not configured. Using default: http://localhost:3000. "
            "Set this to your actual frontend URL in production."
        )
    elif is_production and 'localhost' in portal_url:
        warnings.append(
            "PORTAL_URL contains 'localhost' in production environment. "
            "This should be set to your actual production domain."
        )
    
    # Organization name should be configured
    if not os.environ.get('ORGANIZATION_NAME'):
        warnings.append(
            "ORGANIZATION_NAME is not configured. Using default: 'HRMS'. "
            "Set this to your organization's name for better branding."
        )
    
    # =============================================================================
    # NUMERIC SETTINGS VALIDATION
    # =============================================================================
    
    numeric_settings = {
        'ACCOUNT_SETUP_TOKEN_EXPIRY_HOURS': (1, 168),  # 1 hour to 7 days
        'MAX_FAILED_AUTH_ATTEMPTS': (1, 10),
        'PHONE_AUTH_RATE_LIMIT_ATTEMPTS': (1, 100),
        'PHONE_AUTH_RATE_LIMIT_WINDOW_MINUTES': (1, 60),
        'TEMP_PASSWORD_MIN_LENGTH': (8, 32),
        'PASSWORD_MIN_LENGTH': (8, 32),
        'AUDIT_LOG_RETENTION_DAYS': (1, 3650),  # 1 day to 10 years
    }
    
    for setting_name, (min_val, max_val) in numeric_settings.items():
        value_str = os.environ.get(setting_name)
        if value_str:
            try:
                value = int(value_str)
                if value < min_val or value > max_val:
                    warnings.append(
                        f"{setting_name}={value} is outside recommended range [{min_val}, {max_val}]"
                    )
            except ValueError:
                errors.append(
                    f"{setting_name} must be a valid integer, got: {value_str}"
                )
    
    # =============================================================================
    # REPORT VALIDATION RESULTS
    # =============================================================================
    
    if warnings:
        print("\n" + "="*80)
        print("CONFIGURATION WARNINGS:")
        print("="*80)
        for warning in warnings:
            print(f"⚠️  {warning}")
        print("="*80 + "\n")
    
    if errors:
        print("\n" + "="*80)
        print("CONFIGURATION ERRORS:")
        print("="*80)
        for error in errors:
            print(f"❌ {error}")
        print("="*80 + "\n")
        
        raise ImproperlyConfigured(
            f"Application configuration is invalid. Found {len(errors)} error(s). "
            "Please check the error messages above and update your .env file."
        )
    
    # Success message
    if not warnings and not errors:
        print("✅ All configuration settings validated successfully")


def print_configuration_summary():
    """
    Print a summary of current configuration settings.
    
    This is useful for debugging and verifying configuration in different environments.
    """
    print("\n" + "="*80)
    print("CONFIGURATION SUMMARY")
    print("="*80)
    
    # Environment
    is_production = os.environ.get('DEBUG', 'True') != 'True'
    print(f"Environment: {'PRODUCTION' if is_production else 'DEVELOPMENT'}")
    
    # Database
    print(f"\nDatabase:")
    print(f"  Host: {os.environ.get('DB_HOST', 'localhost')}")
    print(f"  Name: {os.environ.get('DB_NAME', 'hrms_db')}")
    print(f"  User: {os.environ.get('DB_USER', 'postgres')}")
    
    # Email
    email_backend = os.environ.get('EMAIL_BACKEND', 'console')
    print(f"\nEmail:")
    print(f"  Backend: {email_backend}")
    if 'smtp' in email_backend.lower():
        print(f"  Host: {os.environ.get('EMAIL_HOST', 'not set')}")
        print(f"  From: {os.environ.get('DEFAULT_FROM_EMAIL', 'not set')}")
    
    # Onboarding
    print(f"\nOnboarding:")
    print(f"  Organization: {os.environ.get('ORGANIZATION_NAME', 'HRMS')}")
    print(f"  Portal URL: {os.environ.get('PORTAL_URL', 'http://localhost:3000')}")
    print(f"  Token Expiry: {os.environ.get('ACCOUNT_SETUP_TOKEN_EXPIRY_HOURS', '24')} hours")
    print(f"  Max Failed Attempts: {os.environ.get('MAX_FAILED_AUTH_ATTEMPTS', '3')}")
    
    print("="*80 + "\n")


if __name__ == '__main__':
    # Allow running this module directly to validate settings
    from dotenv import load_dotenv
    load_dotenv()
    
    try:
        validate_required_settings()
        print_configuration_summary()
    except ImproperlyConfigured as e:
        print(f"\n❌ Configuration validation failed: {e}\n")
        sys.exit(1)
