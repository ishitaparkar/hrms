"""
Management command to test email configuration.
"""
from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings


class Command(BaseCommand):
    help = 'Test email configuration by sending a test email'

    def add_arguments(self, parser):
        parser.add_argument(
            '--to',
            type=str,
            help='Email address to send test email to',
            default='test@example.com'
        )

    def handle(self, *args, **options):
        recipient = options['to']
        
        self.stdout.write(self.style.WARNING(f'Testing email configuration...'))
        self.stdout.write(f'Email Backend: {settings.EMAIL_BACKEND}')
        
        if settings.EMAIL_BACKEND == 'django.core.mail.backends.smtp.EmailBackend':
            self.stdout.write(f'SMTP Host: {settings.EMAIL_HOST}')
            self.stdout.write(f'SMTP Port: {settings.EMAIL_PORT}')
            self.stdout.write(f'Use TLS: {settings.EMAIL_USE_TLS}')
            self.stdout.write(f'From Email: {settings.DEFAULT_FROM_EMAIL}')
        
        try:
            send_mail(
                subject='HRMS Email Configuration Test',
                message='This is a test email from the HRMS system. If you receive this, your email configuration is working correctly.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient],
                fail_silently=False,
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'✓ Test email sent successfully to {recipient}')
            )
            
            if settings.EMAIL_BACKEND == 'django.core.mail.backends.console.EmailBackend':
                self.stdout.write(
                    self.style.WARNING(
                        '\nNote: Using console backend. Check the console output above for the email content.'
                    )
                )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Failed to send test email: {str(e)}')
            )
            self.stdout.write(
                self.style.WARNING(
                    '\nTroubleshooting tips:'
                    '\n1. Check your EMAIL_HOST and EMAIL_PORT settings'
                    '\n2. Verify EMAIL_HOST_USER and EMAIL_HOST_PASSWORD are correct'
                    '\n3. Ensure your email provider allows SMTP access'
                    '\n4. For Gmail, you may need to use an App Password'
                )
            )
