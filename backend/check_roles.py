#!/usr/bin/env python
"""
Script to check user roles and groups in the database
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrms_core.settings')
django.setup()

from django.contrib.auth.models import User, Group

print("=" * 60)
print("CHECKING USER ROLES AND GROUPS")
print("=" * 60)

# Check all groups
print("\n1. Available Groups:")
groups = Group.objects.all()
if groups.exists():
    for group in groups:
        print(f"   - {group.name}")
else:
    print("   No groups found!")

# Check all users and their groups
print("\n2. Users and Their Roles:")
users = User.objects.all()
if users.exists():
    for user in users:
        user_groups = user.groups.all()
        roles = [g.name for g in user_groups]
        print(f"\n   User: {user.username} (ID: {user.id})")
        print(f"   Email: {user.email}")
        if roles:
            print(f"   Roles: {', '.join(roles)}")
        else:
            print(f"   Roles: NO ROLES ASSIGNED!")
        
        # Check if user has profile
        if hasattr(user, 'profile'):
            print(f"   Has Profile: Yes")
            if user.profile.employee:
                print(f"   Linked Employee: {user.profile.employee.firstName} {user.profile.employee.lastName}")
        else:
            print(f"   Has Profile: No")
else:
    print("   No users found!")

print("\n" + "=" * 60)
