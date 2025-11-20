#!/usr/bin/env python
"""
Script to create default leave balances for all existing employees.
Run this once to initialize leave balances for employees created before the signal was added.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrms_core.settings')
django.setup()

from employee_management.models import Employee
from leave_management.models import LeaveBalance


def create_leave_balances_for_all_employees():
    """Create default leave balances for all employees who don't have them."""
    
    print("=" * 60)
    print("CREATING DEFAULT LEAVE BALANCES FOR ALL EMPLOYEES")
    print("=" * 60)
    
    employees = Employee.objects.all()
    print(f"\nFound {employees.count()} employees")
    
    leave_types = ['Casual', 'Sick', 'Vacation']
    created_count = 0
    skipped_count = 0
    
    for employee in employees:
        print(f"\nProcessing: {employee.firstName} {employee.lastName} ({employee.employeeId})")
        
        for leave_type in leave_types:
            balance, created = LeaveBalance.objects.get_or_create(
                employee=employee,
                leave_type=leave_type,
                defaults={
                    'total': 0,
                    'used': 0,
                }
            )
            
            if created:
                print(f"  ✓ Created {balance.get_leave_type_display()}: 0 total, 0 used")
                created_count += 1
            else:
                print(f"  - Already exists: {balance.get_leave_type_display()} ({balance.total} total, {balance.used} used)")
                skipped_count += 1
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total employees processed: {employees.count()}")
    print(f"Leave balances created: {created_count}")
    print(f"Leave balances already existed: {skipped_count}")
    print("\n✓ Done! All employees now have default leave balances.")


if __name__ == '__main__':
    create_leave_balances_for_all_employees()
