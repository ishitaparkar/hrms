"""
Management command to set up initial leave balances and holidays for testing.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from employee_management.models import Employee
from leave_management.models import LeaveBalance, Holiday


class Command(BaseCommand):
    help = 'Set up initial leave balances and holidays for all employees'

    def handle(self, *args, **options):
        self.stdout.write('Setting up leave balances and holidays...')
        
        # Create leave balances for all employees
        employees = Employee.objects.all()
        leave_types = ['Casual', 'Sick', 'Vacation']
        
        created_balances = 0
        for employee in employees:
            for leave_type in leave_types:
                balance, created = LeaveBalance.objects.get_or_create(
                    employee=employee,
                    leave_type=leave_type,
                    defaults={
                        'total': 15 if leave_type == 'Vacation' else 10,
                        'used': 0
                    }
                )
                if created:
                    created_balances += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Created {leave_type} balance for {employee.firstName} {employee.lastName}'
                        )
                    )
        
        self.stdout.write(
            self.style.SUCCESS(f'Created {created_balances} leave balances')
        )
        
        # Create sample holidays
        today = timezone.now().date()
        holidays_data = [
            {
                'name': 'New Year\'s Day',
                'date': today.replace(month=1, day=1) if today.month > 1 else today + timedelta(days=30),
                'description': 'New Year celebration'
            },
            {
                'name': 'Independence Day',
                'date': today.replace(month=7, day=4) if today.month < 7 else today.replace(year=today.year + 1, month=7, day=4),
                'description': 'National holiday'
            },
            {
                'name': 'Christmas',
                'date': today.replace(month=12, day=25) if today.month < 12 else today.replace(year=today.year + 1, month=12, day=25),
                'description': 'Christmas celebration'
            },
            {
                'name': 'Thanksgiving',
                'date': today + timedelta(days=60),
                'description': 'Thanksgiving holiday'
            }
        ]
        
        created_holidays = 0
        for holiday_data in holidays_data:
            holiday, created = Holiday.objects.get_or_create(
                name=holiday_data['name'],
                date=holiday_data['date'],
                defaults={'description': holiday_data['description']}
            )
            if created:
                created_holidays += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Created holiday: {holiday.name} on {holiday.date}'
                    )
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'Created {created_holidays} holidays')
        )
        
        self.stdout.write(
            self.style.SUCCESS('Leave data setup complete!')
        )
