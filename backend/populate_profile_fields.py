#!/usr/bin/env python
"""
Script to populate the new profile fields for existing employees.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrms_core.settings')
django.setup()

from employee_management.models import Employee

def populate_profile_fields():
    """Populate new profile fields with sample data for existing employees."""
    
    employees = Employee.objects.all()
    
    for emp in employees:
        # Admin-only fields
        if not emp.workEmail:
            emp.workEmail = f"{emp.firstName.lower()}.{emp.lastName.lower()}@company.com"
        
        if not emp.schoolFaculty:
            emp.schoolFaculty = "School of Engineering"
        
        if not emp.employmentStatus:
            emp.employmentStatus = "Active"
        
        # Shared fields
        if not emp.officeLocation:
            emp.officeLocation = "Building A, Floor 3"
        
        if not emp.workPhone:
            emp.workPhone = "+1-555-0100"
        
        # Employee-only fields
        if not emp.preferredName:
            emp.preferredName = emp.firstName
        
        if not emp.emergencyContactName:
            emp.emergencyContactName = f"Emergency Contact for {emp.firstName}"
        
        if not emp.emergencyContactRelationship:
            emp.emergencyContactRelationship = "Spouse"
        
        if not emp.emergencyContactPhone:
            emp.emergencyContactPhone = "+1-555-9999"
        
        if not emp.emergencyContactEmail:
            emp.emergencyContactEmail = f"emergency.{emp.firstName.lower()}@email.com"
        
        emp.save()
        print(f"✓ Updated profile fields for {emp.firstName} {emp.lastName}")
    
    print(f"\n✅ Successfully populated profile fields for {employees.count()} employees!")

if __name__ == '__main__':
    populate_profile_fields()
