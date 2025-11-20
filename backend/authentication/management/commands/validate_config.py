"""
Management command to validate HRMS configuration settings.

This command checks all environment variables and settings to ensure
the application is properly configured for the current environment.
"""

from django.core.management.base import BaseCommand
from django.conf import settings
from hrms_core.settings_validation import validate_required_settings, print_configuration_summary


class Command(BaseCommand):
    help = 'Validate HRMS configuration settings and display summary'

    def add_arguments(self, parser):
        parser.add_argument(
            '--summary',
            action='store_true',
            help='Display configuration summary',
        )
        parser.add_argument(
            '--check-email',
            action='store_true',
            help='Test email configuration by sending a test email',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting configuration validation...\n'))

        # Validate settings
        try:
            validate_required_settings()
            self.stdout.write(self.style.SUCCESS('✅ Configuration validation passed!\n'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Configuration validation failed: {e}\n'))
            return

        # Display summary if requested
        if options['summary']:
            print_configuration_summary()

        # Test email if requested
        if options['check_email']:
            self.test_email_configuration()

    def test_email_configuration(self):
        """Test email configuration by attempting to send a test email."""
        self.stdout.write('\nTesting email configuration...')
        
        from django.core.mail import send_mail
        from django.core.mail import get_connection
        
        try:
            # Test connection
            connection = get_connection()
            connection.open()
            connection.close()
            
            self.stdout.write(self.style.SUCCESS('✅ Email connection successful'))
            
            # Ask if user wants to send test email
            self.stdout.write('\nEmail configuration appears valid.')
            self.stdout.write('To send a test email, use:')
            self.stdout.write('  python manage.py shell')
            self.stdout.write('  >>> from django.core.mail import send_mail')
            self.stdout.write('  >>> send_mail("Test", "Test message", "from@example.com", ["to@example.com"])')
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Email connection failed: {e}'))
            self.stdout.write('\nPlease check your email settings:')
            self.stdout.write(f'  EMAIL_BACKEND: {settings.EMAIL_BACKEND}')
            self.stdout.write(f'  EMAIL_HOST: {settings.EMAIL_HOST}')
            self.stdout.write(f'  EMAIL_PORT: {settings.EMAIL_PORT}')
            self.stdout.write(f'  EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}')
