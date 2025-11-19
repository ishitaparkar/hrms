from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group
from authentication.models import UserProfile
from employee_management.models import Employee
from datetime import date


class Command(BaseCommand):
    help = 'Create demo users with different roles for testing RBAC'

    def handle(self, *args, **kwargs):
        self.stdout.write('Creating demo users...\n')

        # Demo users data
        demo_users = [
            {
                'username': 'hr_manager',
                'email': 'hr.manager@university.edu',
                'password': 'hrpass123',
                'first_name': 'Sarah',
                'last_name': 'Johnson',
                'role': 'HR Manager',
                'department': 'Human Resources',
                'designation': 'HR Manager',
            },
            {
                'username': 'dept_head_cs',
                'email': 'head.cs@university.edu',
                'password': 'deptpass123',
                'first_name': 'Michael',
                'last_name': 'Chen',
                'role': 'Department Head',
                'department': 'Computer Science',
                'designation': 'Department Head',
            },
            {
                'username': 'dept_head_math',
                'email': 'head.math@university.edu',
                'password': 'deptpass123',
                'first_name': 'Emily',
                'last_name': 'Rodriguez',
                'role': 'Department Head',
                'department': 'Mathematics',
                'designation': 'Department Head',
            },
            {
                'username': 'employee_cs',
                'email': 'john.doe@university.edu',
                'password': 'emppass123',
                'first_name': 'John',
                'last_name': 'Doe',
                'role': 'Employee',
                'department': 'Computer Science',
                'designation': 'Assistant Professor',
            },
            {
                'username': 'employee_math',
                'email': 'jane.smith@university.edu',
                'password': 'emppass123',
                'first_name': 'Jane',
                'last_name': 'Smith',
                'role': 'Employee',
                'department': 'Mathematics',
                'designation': 'Lecturer',
            },
        ]

        created_count = 0
        updated_count = 0

        for user_data in demo_users:
            username = user_data['username']
            
            # Check if user already exists
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': user_data['email'],
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                }
            )

            if created:
                user.set_password(user_data['password'])
                user.save()
                self.stdout.write(self.style.SUCCESS(f'✓ Created user: {username}'))
                created_count += 1
            else:
                # Update existing user
                user.email = user_data['email']
                user.first_name = user_data['first_name']
                user.last_name = user_data['last_name']
                user.set_password(user_data['password'])
                user.save()
                self.stdout.write(self.style.WARNING(f'⟳ Updated existing user: {username}'))
                updated_count += 1

            # Create or update Employee record
            employee, emp_created = Employee.objects.get_or_create(
                personalEmail=user_data['email'],
                defaults={
                    'firstName': user_data['first_name'],
                    'lastName': user_data['last_name'],
                    'employeeId': f'EMP{user.id:04d}',
                    'mobileNumber': f'+1-555-{1000 + user.id}',
                    'joiningDate': date(2023, 1, 1),
                    'department': user_data['department'],
                    'designation': user_data['designation'],
                }
            )

            if not emp_created:
                # Update existing employee
                employee.firstName = user_data['first_name']
                employee.lastName = user_data['last_name']
                employee.department = user_data['department']
                employee.designation = user_data['designation']
                employee.save()

            # Create or update UserProfile
            profile, prof_created = UserProfile.objects.get_or_create(
                user=user,
                defaults={
                    'employee': employee,
                    'department': user_data['department'],
                }
            )

            if not prof_created:
                profile.employee = employee
                profile.department = user_data['department']
                profile.save()

            # Assign role
            role_name = user_data['role']
            try:
                role = Group.objects.get(name=role_name)
                user.groups.clear()  # Remove all existing roles
                user.groups.add(role)
                self.stdout.write(f'  → Assigned role: {role_name}')
            except Group.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'  ✗ Role "{role_name}" not found. Run init_roles first.'))

            self.stdout.write('')  # Empty line for readability

        # Summary
        self.stdout.write(self.style.SUCCESS('\n' + '='*60))
        self.stdout.write(self.style.SUCCESS(f'Demo users setup complete!'))
        self.stdout.write(self.style.SUCCESS(f'Created: {created_count} | Updated: {updated_count}'))
        self.stdout.write(self.style.SUCCESS('='*60))
        
        # Print login credentials
        self.stdout.write('\n' + self.style.WARNING('LOGIN CREDENTIALS:'))
        self.stdout.write(self.style.WARNING('-'*60))
        for user_data in demo_users:
            self.stdout.write(f"Username: {user_data['username']:20} | Password: {user_data['password']:15} | Role: {user_data['role']}")
        self.stdout.write(self.style.WARNING('-'*60 + '\n'))
