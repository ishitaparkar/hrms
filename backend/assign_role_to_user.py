#!/usr/bin/env python
"""
Script to assign a role to a specific user
Usage: python assign_role_to_user.py <username_or_email> <role_name>
Example: python assign_role_to_user.py ishitaparkar04@gmail.com "Employee"
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrms_core.settings')
django.setup()

from django.contrib.auth.models import User, Group

if len(sys.argv) != 3:
    print("Usage: python assign_role_to_user.py <username_or_email> <role_name>")
    print('Available roles: "Super Admin", "HR Manager", "Department Head", "Employee"')
    sys.exit(1)

username_or_email = sys.argv[1]
role_name = sys.argv[2]

try:
    # Try to find user by username or email
    try:
        user = User.objects.get(username=username_or_email)
    except User.DoesNotExist:
        user = User.objects.get(email=username_or_email)
    
    # Get the group
    group = Group.objects.get(name=role_name)
    
    # Assign the role
    user.groups.add(group)
    
    print(f"✓ Successfully assigned '{role_name}' to user '{user.username}'")
    print(f"  Current roles: {', '.join([g.name for g in user.groups.all()])}")
    
except User.DoesNotExist:
    print(f"✗ User '{username_or_email}' not found")
    sys.exit(1)
except Group.DoesNotExist:
    print(f"✗ Role '{role_name}' not found")
    print('Available roles: "Super Admin", "HR Manager", "Department Head", "Employee"')
    sys.exit(1)
