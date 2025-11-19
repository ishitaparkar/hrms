"""
Management command to identify and assign admin roles to users based on criteria.

Usage:
    python manage.py assign_admin_roles --list
    python manage.py assign_admin_roles --assign <username> --role <role_name>
    python manage.py assign_admin_roles --auto-detect
"""

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User, Group
from authentication.models import UserProfile, RoleAssignment
from employee_management.models import Employee


class Command(BaseCommand):
    help = 'Identify and assign admin roles to users based on criteria'

    def add_arguments(self, parser):
        parser.add_argument(
            '--list',
            action='store_true',
            help='List all users with their current roles and potential admin candidates',
        )
        parser.add_argument(
            '--assign',
            type=str,
            help='Username to assign a role to',
        )
        parser.add_argument(
            '--role',
            type=str,
            choices=['Super Admin', 'HR Manager', 'Department Head', 'Employee'],
            help='Role to assign (Super Admin, HR Manager, Department Head, Employee)',
        )
        parser.add_argument(
            '--auto-detect',
            action='store_true',
            help='Auto-detect and suggest admin role assignments based on criteria',
        )
        parser.add_argument(
            '--notes',
            type=str,
            default='',
            help='Notes for the role assignment',
        )

    def handle(self, *args, **options):
        if options['list']:
            self.list_users()
        elif options['assign'] and options['role']:
            self.assign_role(options['assign'], options['role'], options['notes'])
        elif options['auto_detect']:
            self.auto_detect_admins()
        else:
            self.stdout.write(self.style.ERROR('Please specify --list, --assign, or --auto-detect'))
            self.stdout.write('Usage examples:')
            self.stdout.write('  python manage.py assign_admin_roles --list')
            self.stdout.write('  python manage.py assign_admin_roles --assign john.doe --role "HR Manager"')
            self.stdout.write('  python manage.py assign_admin_roles --auto-detect')

    def list_users(self):
        """List all users with their current roles."""
        self.stdout.write(self.style.SUCCESS('\n=== Current Users and Roles ===\n'))
        
        users = User.objects.all().prefetch_related('groups', 'profile')
        
        for user in users:
            roles = [group.name for group in user.groups.all()]
            roles_str = ', '.join(roles) if roles else 'No roles'
            
            # Get employee info if linked
            employee_info = ''
            if hasattr(user, 'profile') and user.profile.employee:
                emp = user.profile.employee
                employee_info = f' | Employee: {emp.firstName} {emp.lastName} ({emp.designation}, {emp.department})'
            
            self.stdout.write(f'User: {user.username} | Email: {user.email} | Roles: {roles_str}{employee_info}')
        
        self.stdout.write(self.style.SUCCESS(f'\nTotal users: {users.count()}'))

    def assign_role(self, username, role_name, notes=''):
        """Assign a specific role to a user."""
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise CommandError(f'User "{username}" does not exist')
        
        try:
            role = Group.objects.get(name=role_name)
        except Group.DoesNotExist:
            raise CommandError(f'Role "{role_name}" does not exist. Please run init_roles command first.')
        
        # Check if user already has this role
        if user.groups.filter(name=role_name).exists():
            self.stdout.write(self.style.WARNING(f'User {username} already has role "{role_name}"'))
            return
        
        # Assign the role
        user.groups.add(role)
        
        # Create RoleAssignment record
        RoleAssignment.objects.create(
            user=user,
            role=role,
            assigned_by=None,  # Manual assignment via command
            is_active=True,
            notes=notes or f'Manually assigned via management command'
        )
        
        self.stdout.write(self.style.SUCCESS(f'Successfully assigned role "{role_name}" to user {username}'))

    def auto_detect_admins(self):
        """Auto-detect potential admin users based on criteria."""
        self.stdout.write(self.style.SUCCESS('\n=== Auto-Detecting Potential Admin Users ===\n'))
        
        suggestions = []
        
        # Criteria 1: Users with "admin" in username or email
        admin_users = User.objects.filter(username__icontains='admin') | User.objects.filter(email__icontains='admin')
        for user in admin_users:
            suggestions.append({
                'user': user,
                'suggested_role': 'Super Admin',
                'reason': 'Username or email contains "admin"'
            })
        
        # Criteria 2: Superuser flag
        superusers = User.objects.filter(is_superuser=True)
        for user in superusers:
            if user not in [s['user'] for s in suggestions]:
                suggestions.append({
                    'user': user,
                    'suggested_role': 'Super Admin',
                    'reason': 'Django superuser flag is set'
                })
        
        # Criteria 3: Staff users
        staff_users = User.objects.filter(is_staff=True)
        for user in staff_users:
            if user not in [s['user'] for s in suggestions]:
                suggestions.append({
                    'user': user,
                    'suggested_role': 'HR Manager',
                    'reason': 'Django staff flag is set'
                })
        
        # Criteria 4: Employees with HR-related designations
        hr_employees = Employee.objects.filter(
            designation__icontains='HR'
        ) | Employee.objects.filter(
            designation__icontains='Human Resource'
        ) | Employee.objects.filter(
            designation__icontains='Manager'
        )
        
        for employee in hr_employees:
            if hasattr(employee, 'user_profile') and employee.user_profile:
                user = employee.user_profile.user
                if user not in [s['user'] for s in suggestions]:
                    suggested_role = 'HR Manager' if 'HR' in employee.designation else 'Department Head'
                    suggestions.append({
                        'user': user,
                        'suggested_role': suggested_role,
                        'reason': f'Employee designation: {employee.designation}'
                    })
        
        # Criteria 5: Employees with "Head" or "Director" in designation
        head_employees = Employee.objects.filter(
            designation__icontains='Head'
        ) | Employee.objects.filter(
            designation__icontains='Director'
        ) | Employee.objects.filter(
            designation__icontains='Chief'
        )
        
        for employee in head_employees:
            if hasattr(employee, 'user_profile') and employee.user_profile:
                user = employee.user_profile.user
                if user not in [s['user'] for s in suggestions]:
                    suggestions.append({
                        'user': user,
                        'suggested_role': 'Department Head',
                        'reason': f'Employee designation: {employee.designation}'
                    })
        
        # Display suggestions
        if not suggestions:
            self.stdout.write(self.style.WARNING('No potential admin users detected based on criteria.'))
            self.stdout.write('\nYou can manually assign roles using:')
            self.stdout.write('  python manage.py assign_admin_roles --assign <username> --role "<role_name>"')
            return
        
        self.stdout.write(self.style.SUCCESS(f'Found {len(suggestions)} potential admin user(s):\n'))
        
        for i, suggestion in enumerate(suggestions, 1):
            user = suggestion['user']
            current_roles = [group.name for group in user.groups.all()]
            current_roles_str = ', '.join(current_roles) if current_roles else 'None'
            
            self.stdout.write(f'{i}. User: {user.username}')
            self.stdout.write(f'   Email: {user.email}')
            self.stdout.write(f'   Current Roles: {current_roles_str}')
            self.stdout.write(f'   Suggested Role: {suggestion["suggested_role"]}')
            self.stdout.write(f'   Reason: {suggestion["reason"]}')
            self.stdout.write('')
        
        self.stdout.write(self.style.SUCCESS('\nTo assign roles, use:'))
        self.stdout.write('  python manage.py assign_admin_roles --assign <username> --role "<role_name>"')
        self.stdout.write('\nAvailable roles: Super Admin, HR Manager, Department Head, Employee')
