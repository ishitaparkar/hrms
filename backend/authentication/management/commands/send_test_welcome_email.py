"""
Management command to send a test welcome email to an existing employee.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from employee_management.models import Employee
from authentication.services import AccountCreationService


class Command(BaseCommand):
    help = 'Send a test welcome email to an existing employee'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            required=True,
            help='Email address of the employee to send test email to'
        )

    def handle(self, *args, **options):
        email = options['email']
        
        self.stdout.write(self.style.WARNING(f'Looking for employee with email: {email}'))
        
        try:
            # Find the employee by personal email
            employee = Employee.objects.get(personalEmail=email)
            self.stdout.write(self.style.SUCCESS(f'✓ Found employee: {employee.firstName} {employee.lastName} (ID: {employee.employeeId})'))
            
            # Check if user account exists
            user = None
            if hasattr(employee, 'user') and employee.user:
                user = employee.user
                self.stdout.write(self.style.SUCCESS(f'✓ User account exists: {user.email}'))
            else:
                # Try to find existing user by email
                try:
                    user = User.objects.get(email=email)
                    self.stdout.write(self.style.SUCCESS(f'✓ Found existing user: {user.email}'))
                except User.DoesNotExist:
                    self.stdout.write(self.style.WARNING('⚠ No user account found for this employee'))
                    
                    # Create a temporary user for testing
                    self.stdout.write(self.style.WARNING('Creating temporary user account for testing...'))
                    user = User.objects.create_user(
                        username=email,
                        email=email,
                        first_name=employee.firstName,
                        last_name=employee.lastName
                    )
                    self.stdout.write(self.style.SUCCESS(f'✓ Created temporary user: {user.email}'))
            
            # Generate a test temporary password
            temporary_password = 'TestPass123!'
            
            self.stdout.write(self.style.WARNING('\nSending test welcome email...'))
            self.stdout.write(f'To: {email}')
            self.stdout.write(f'Employee: {employee.firstName} {employee.lastName}')
            self.stdout.write(f'Employee ID: {employee.employeeId}')
            self.stdout.write(f'Username: {user.email}')
            self.stdout.write(f'Temporary Password: {temporary_password}')
            
            # Send the welcome email
            success = AccountCreationService.send_welcome_email(
                user=user,
                employee=employee,
                temporary_password=temporary_password
            )
            
            if success:
                self.stdout.write(
                    self.style.SUCCESS('\n✓ Test welcome email sent successfully!')
                )
                self.stdout.write(
                    self.style.SUCCESS(f'Check the inbox for {email}')
                )
            else:
                self.stdout.write(
                    self.style.ERROR('\n✗ Failed to send test welcome email')
                )
                
        except Employee.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'✗ No employee found with email: {email}')
            )
            self.stdout.write(
                self.style.WARNING('\nAvailable employees:')
            )
            for emp in Employee.objects.all()[:10]:
                self.stdout.write(f'  - {emp.firstName} {emp.lastName}: {emp.personalEmail}')
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Error: {str(e)}')
            )
            import traceback
            self.stdout.write(traceback.format_exc())
