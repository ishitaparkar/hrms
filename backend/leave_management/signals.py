"""
Signals for leave management.
Automatically creates default leave balances for new employees.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from employee_management.models import Employee
from .models import LeaveBalance


@receiver(post_save, sender=Employee)
def create_default_leave_balances(sender, instance, created, **kwargs):
    """
    Automatically create default leave balances when a new employee is created.
    
    Creates three leave types with 0 total and 0 used:
    - Casual Leave
    - Sick Leave
    - Vacation Leave
    
    This ensures all employees have leave balance records from the start,
    even if they haven't been allocated any leave yet.
    """
    if created:  # Only for newly created employees
        leave_types = ['Casual', 'Sick', 'Vacation']
        
        for leave_type in leave_types:
            # Only create if it doesn't already exist
            LeaveBalance.objects.get_or_create(
                employee=instance,
                leave_type=leave_type,
                defaults={
                    'total': 0,
                    'used': 0,
                }
            )
