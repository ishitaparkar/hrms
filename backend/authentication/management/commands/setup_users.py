"""
Management command to set up the 3 specific users and delete all others.
Creates: superadmin, hrmanager, employee
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group
from authentication.models import UserProfile, RoleAssignment
from employee_management.models import Employee
from datetime import date


class Command(BaseCommand):
    help = 'Delete all users and create 3 specific users: superadmin, hrmanager, employee'

    def add_arguments(self, parser):
        parser.add_argument(
            '--skip-delete',
            action='store_true',
            help='Skip deleting existing users (only create new ones)',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('='*70))
        self.stdout.write(self.style.SUCCESS('Setting Up User Accounts'))
        self.stdout.write(self.style.SUCCESS('='*70))
        
        # Delete all existing users (except superuser if you want to keep it)
        if not options['skip_delete']:
            self.stdout.write('\n🗑️  Deleting all existing users...')
            deleted_count = User.objects.all().delete()[0]
            self.stdout.write(self.style.WARNING(f'   Deleted {deleted_count} users'))
        
        # Define the 3 users
        users_data = [
            {
                'username': 'superadmin',
                'password': 'superadmin123',
                'email': 'superadmin@university.edu',
                'first_name': 'Super',
                'last_name': 'Admin',
                'role': 'Super Admin',
                'department': 'Administration',
                'designation': 'System Administrator',
                'is_superuser': True,
                'is_staff': True,
            },
            {
                'username': 'hrmanager',
                'password': 'hrmanager123',
                'email': 'hrmanager@university.edu',
                'first_name': 'HR',
                'last_name': 'Manager',
                'role': 'HR Manager',
                'department': 'Human Resources',
                'designation': 'HR Manager',
                'is_superuser': False,
                'is_staff': True,
            },
            {
                'username': 'employee',
                'password': 'employee123',
                'email': 'employee@university.edu',
                'first_name': 'Test',
                'last_name': 'Employee',
                'role': 'Employee',
                'department': 'General',
                'designation': 'Staff Member',
                'is_superuser': False,
                'is_staff': False,
            },
        ]
        
        self.stdout.write('\n👥 Creating users...\n')
        
        for user_data in users_data:
            username = user_data['username']
            
            # Create user
            user = User.objects.create_user(
                username=username,
                email=user_data['email'],
                password=user_data['password'],
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                is_superuser=user_data['is_superuser'],
                is_staff=user_data['is_staff'],
            )
            
            self.stdout.write(self.style.SUCCESS(f'✓ Created user: {username}'))
            self.stdout.write(f'  Email: {user_data["email"]}')
            self.stdout.write(f'  Password: {user_data["password"]}')
            
            # Create Employee record
            employee = Employee.objects.create(
                firstName=user_data['first_name'],
                lastName=user_data['last_name'],
                employeeId=f'{username.upper()[:3]}{user.id:04d}',
                personalEmail=user_data['email'],
                mobileNumber=f'+1-555-{1000 + user.id}',
                joiningDate=date(2024, 1, 1),
                department=user_data['department'],
                designation=user_data['designation'],
            )
            
            self.stdout.write(f'  Employee ID: {employee.employeeId}')
            
            # Create UserProfile
            profile = UserProfile.objects.create(
                user=user,
                employee=employee,
                department=user_data['department'],
            )
            
            self.stdout.write(f'  Department: {user_data["department"]}')
            
            # Assign role
            role_name = user_data['role']
            try:
                role = Group.objects.get(name=role_name)
                user.groups.clear()
                user.groups.add(role)
                self.stdout.write(self.style.SUCCESS(f'  → Assigned role: {role_name}'))
            except Group.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'  ✗ Role "{role_name}" not found. Run init_roles first.')
                )
            
            self.stdout.write('')  # Empty line
        
        # Summary
        self.stdout.write(self.style.SUCCESS('='*70))
        self.stdout.write(self.style.SUCCESS('User setup complete!'))
        self.stdout.write(self.style.SUCCESS('='*70))
        
        # Print login credentials table
        self.stdout.write('\n' + self.style.WARNING('LOGIN CREDENTIALS:'))
        self.stdout.write(self.style.WARNING('-'*70))
        self.stdout.write(f'{"Username":<20} {"Password":<20} {"Role":<20}')
        self.stdout.write(self.style.WARNING('-'*70))
        for user_data in users_data:
            self.stdout.write(
                f'{user_data["username"]:<20} {user_data["password"]:<20} {user_data["role"]:<20}'
            )
        self.stdout.write(self.style.WARNING('-'*70))
        
        self.stdout.write('\n' + self.style.SUCCESS('✓ All users created successfully!'))
        self.stdout.write(self.style.WARNING('⚠️  Remember to update frontend role checks to use only these 3 roles\n'))
