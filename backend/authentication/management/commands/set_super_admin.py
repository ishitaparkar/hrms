from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group
from authentication.models import UserProfile
from employee_management.models import Employee
from datetime import date


class Command(BaseCommand):
    help = 'Set ishitaparkar as Super Admin only'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            default='ishitaparkar',
            help='Username to set as Super Admin (default: ishitaparkar)'
        )

    def handle(self, *args, **options):
        username = options['username']
        
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User "{username}" not found!'))
            return

        # Get Super Admin role
        try:
            super_admin_role = Group.objects.get(name='Super Admin')
        except Group.DoesNotExist:
            self.stdout.write(self.style.ERROR('Super Admin role not found. Run init_roles first.'))
            return

        # Clear all existing roles
        user.groups.clear()
        self.stdout.write(f'Cleared all existing roles for {username}')

        # Assign Super Admin role only
        user.groups.add(super_admin_role)
        self.stdout.write(self.style.SUCCESS(f'✓ Assigned Super Admin role to {username}'))

        # Ensure user has a profile
        if not hasattr(user, 'profile'):
            # Create employee if doesn't exist
            employee, created = Employee.objects.get_or_create(
                personalEmail=user.email,
                defaults={
                    'firstName': user.first_name or username,
                    'lastName': user.last_name or 'Admin',
                    'employeeId': f'ADMIN{user.id:04d}',
                    'mobileNumber': '+1-555-0000',
                    'joiningDate': date.today(),
                    'department': 'Administration',
                    'designation': 'System Administrator',
                }
            )

            # Create profile
            UserProfile.objects.create(
                user=user,
                employee=employee,
                department='Administration'
            )
            self.stdout.write(f'✓ Created UserProfile for {username}')
        else:
            self.stdout.write(f'✓ UserProfile already exists for {username}')

        # Display current roles
        roles = list(user.groups.values_list('name', flat=True))
        self.stdout.write(self.style.SUCCESS(f'\nCurrent roles for {username}: {", ".join(roles)}'))
