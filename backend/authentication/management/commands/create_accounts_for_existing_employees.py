"""
Management command to create user accounts for existing employees who don't have them.
"""
from django.core.management.base import BaseCommand
from django.db.models import Q
from employee_management.models import Employee
from authentication.models import UserProfile
from authentication.services import AccountCreationService


class Command(BaseCommand):
    help = 'Create user accounts for existing employees who do not have linked user accounts'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show which employees would get accounts without actually creating them',
        )
        parser.add_argument(
            '--skip-email',
            action='store_true',
            help='Skip sending welcome emails (useful for bulk operations)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        skip_email = options['skip_email']
        
        self.stdout.write(self.style.SUCCESS('='*70))
        self.stdout.write(self.style.SUCCESS('Create User Accounts for Existing Employees'))
        self.stdout.write(self.style.SUCCESS('='*70))
        
        if dry_run:
            self.stdout.write(self.style.WARNING('\n🔍 DRY RUN MODE - No accounts will be created\n'))
        
        # Find employees without user accounts
        # An employee has no user account if:
        # 1. There's no UserProfile linking to this employee, OR
        # 2. The UserProfile exists but has no user
        employees_with_accounts = UserProfile.objects.filter(
            employee__isnull=False,
            user__isnull=False
        ).values_list('employee_id', flat=True)
        
        employees_without_accounts = Employee.objects.exclude(
            id__in=employees_with_accounts
        ).order_by('employeeId')
        
        total_employees = Employee.objects.count()
        employees_needing_accounts = employees_without_accounts.count()
        
        self.stdout.write(f'\n📊 Summary:')
        self.stdout.write(f'   Total employees: {total_employees}')
        self.stdout.write(f'   Employees with accounts: {total_employees - employees_needing_accounts}')
        self.stdout.write(f'   Employees needing accounts: {employees_needing_accounts}\n')
        
        if employees_needing_accounts == 0:
            self.stdout.write(self.style.SUCCESS('✓ All employees already have user accounts!'))
            return
        
        if dry_run:
            self.stdout.write(self.style.WARNING('Employees who would get accounts:\n'))
            for employee in employees_without_accounts:
                self.stdout.write(
                    f'  • {employee.employeeId}: {employee.firstName} {employee.lastName} '
                    f'({employee.personalEmail})'
                )
            self.stdout.write(self.style.WARNING(f'\nRun without --dry-run to create {employees_needing_accounts} accounts'))
            return
        
        # Create accounts
        self.stdout.write(self.style.SUCCESS('👥 Creating user accounts...\n'))
        
        created_count = 0
        failed_count = 0
        email_failed_count = 0
        failed_employees = []
        
        for employee in employees_without_accounts:
            try:
                # Temporarily patch send_welcome_email if skip_email is True
                original_send_email = AccountCreationService.send_welcome_email
                if skip_email:
                    AccountCreationService.send_welcome_email = lambda *args, **kwargs: True
                
                user, temp_password, created = AccountCreationService.create_user_account(employee)
                
                # Restore original method
                if skip_email:
                    AccountCreationService.send_welcome_email = original_send_email
                
                if created:
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'✓ Created account for {employee.employeeId}: '
                            f'{employee.firstName} {employee.lastName}'
                        )
                    )
                    self.stdout.write(f'  Username: {user.username}')
                    if skip_email:
                        self.stdout.write(f'  Temporary Password: {temp_password}')
                        self.stdout.write(self.style.WARNING('  ⚠️  Email skipped - provide credentials manually'))
                    else:
                        self.stdout.write('  Email: Sent')
                    self.stdout.write('')
                    
            except ValueError as e:
                # Account already exists or duplicate email
                failed_count += 1
                failed_employees.append({
                    'employee': employee,
                    'error': str(e)
                })
                self.stdout.write(
                    self.style.ERROR(
                        f'✗ Failed to create account for {employee.employeeId}: '
                        f'{employee.firstName} {employee.lastName}'
                    )
                )
                self.stdout.write(self.style.ERROR(f'  Error: {str(e)}'))
                self.stdout.write('')
                
            except Exception as e:
                # Email sending or other errors
                if 'email' in str(e).lower():
                    email_failed_count += 1
                    self.stdout.write(
                        self.style.WARNING(
                            f'⚠️  Account created for {employee.employeeId} but email failed'
                        )
                    )
                    self.stdout.write(self.style.WARNING(f'  Error: {str(e)}'))
                    self.stdout.write('')
                else:
                    failed_count += 1
                    failed_employees.append({
                        'employee': employee,
                        'error': str(e)
                    })
                    self.stdout.write(
                        self.style.ERROR(
                            f'✗ Failed to create account for {employee.employeeId}: '
                            f'{employee.firstName} {employee.lastName}'
                        )
                    )
                    self.stdout.write(self.style.ERROR(f'  Error: {str(e)}'))
                    self.stdout.write('')
        
        # Final summary
        self.stdout.write(self.style.SUCCESS('='*70))
        self.stdout.write(self.style.SUCCESS('Account Creation Complete!'))
        self.stdout.write(self.style.SUCCESS('='*70))
        self.stdout.write(f'\n📈 Results:')
        self.stdout.write(self.style.SUCCESS(f'   ✓ Successfully created: {created_count}'))
        if email_failed_count > 0:
            self.stdout.write(self.style.WARNING(f'   ⚠️  Email delivery failed: {email_failed_count}'))
        if failed_count > 0:
            self.stdout.write(self.style.ERROR(f'   ✗ Failed: {failed_count}'))
        
        if failed_employees:
            self.stdout.write(self.style.ERROR('\n❌ Failed Employees:'))
            for item in failed_employees:
                emp = item['employee']
                self.stdout.write(
                    self.style.ERROR(
                        f'   • {emp.employeeId}: {emp.firstName} {emp.lastName} - {item["error"]}'
                    )
                )
        
        if skip_email and created_count > 0:
            self.stdout.write(
                self.style.WARNING(
                    f'\n⚠️  Remember to manually provide credentials to {created_count} employees'
                )
            )
        
        self.stdout.write('')
