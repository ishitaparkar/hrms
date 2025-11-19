#!/usr/bin/env python
"""
Quick script to check if email configuration is set up correctly.
Run this before attempting to send emails.
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrms_core.settings')
django.setup()

from django.conf import settings

print("=" * 70)
print("EMAIL CONFIGURATION CHECK")
print("=" * 70)

# Check if .env file exists
env_file = os.path.join(settings.BASE_DIR, '.env')
if os.path.exists(env_file):
    print("✓ .env file found")
else:
    print("✗ .env file NOT found")
    print("  Create it at: backend/.env")
    exit(1)

print("\nCurrent Email Settings:")
print("-" * 70)

# Email Backend
backend = settings.EMAIL_BACKEND
print(f"EMAIL_BACKEND: {backend}")
if backend == 'django.core.mail.backends.console.EmailBackend':
    print("  ⚠ WARNING: Using console backend (emails will print to console)")
    print("  To send real emails, set EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend")
elif backend == 'django.core.mail.backends.smtp.EmailBackend':
    print("  ✓ Using SMTP backend (will send real emails)")
else:
    print(f"  ⚠ Unknown backend: {backend}")

# SMTP Settings
print(f"\nSMTP Configuration:")
print(f"  EMAIL_HOST: {settings.EMAIL_HOST}")
print(f"  EMAIL_PORT: {settings.EMAIL_PORT}")
print(f"  EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
print(f"  EMAIL_USE_SSL: {settings.EMAIL_USE_SSL}")

# Credentials
print(f"\nCredentials:")
email_user = settings.EMAIL_HOST_USER
email_pass = settings.EMAIL_HOST_PASSWORD

if not email_user or email_user == 'your-gmail-address@gmail.com':
    print("  ✗ EMAIL_HOST_USER not configured")
    print("    Update EMAIL_HOST_USER in .env file")
else:
    print(f"  ✓ EMAIL_HOST_USER: {email_user}")

if not email_pass or email_pass == 'your-16-char-app-password-here':
    print("  ✗ EMAIL_HOST_PASSWORD not configured")
    print("    Update EMAIL_HOST_PASSWORD in .env file")
    print("    Get App Password from: https://myaccount.google.com/apppasswords")
else:
    # Show only first and last 2 characters for security
    masked_pass = email_pass[:2] + '*' * (len(email_pass) - 4) + email_pass[-2:]
    print(f"  ✓ EMAIL_HOST_PASSWORD: {masked_pass} ({len(email_pass)} characters)")
    
    if len(email_pass) != 16:
        print("    ⚠ WARNING: Gmail App Passwords are typically 16 characters")

# From Email
print(f"\nSender Configuration:")
print(f"  DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
print(f"  SERVER_EMAIL: {settings.SERVER_EMAIL}")

# Final Check
print("\n" + "=" * 70)
if (backend == 'django.core.mail.backends.smtp.EmailBackend' and 
    email_user and email_user != 'your-gmail-address@gmail.com' and
    email_pass and email_pass != 'your-16-char-app-password-here'):
    print("✓ Configuration looks good! Ready to send emails.")
    print("\nNext step: Run the test command:")
    print("  python manage.py send_test_welcome_email --email ishitaparkar04@gmail.com")
else:
    print("✗ Configuration incomplete. Please update your .env file.")
    print("\nRequired steps:")
    if backend != 'django.core.mail.backends.smtp.EmailBackend':
        print("  1. Set EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend")
    if not email_user or email_user == 'your-gmail-address@gmail.com':
        print("  2. Set EMAIL_HOST_USER to your Gmail address")
    if not email_pass or email_pass == 'your-16-char-app-password-here':
        print("  3. Set EMAIL_HOST_PASSWORD to your Gmail App Password")
    print("\nSee QUICK_EMAIL_TEST.md for detailed instructions.")

print("=" * 70)
