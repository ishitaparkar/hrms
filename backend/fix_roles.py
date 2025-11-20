#!/usr/bin/env python
"""
Script to create groups and assign roles to users
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrms_core.settings')
django.setup()

from django.contrib.auth.models import User, Group, Permission
from django.contrib.contenttypes.models import ContentType

print("=" * 60)
print("FIXING USER ROLES")
print("=" * 60)

# Step 1: Create all required groups
print("\n1. Creating Groups...")
groups_to_create = ['Super Admin', 'HR Manager', 'Department Head', 'Employee']

for group_name in groups_to_create:
    group, created = Group.objects.get_or_create(name=group_name)
    if created:
        print(f"   ✓ Created group: {group_name}")
    else:
        print(f"   - Group already exists: {group_name}")

# Step 2: Assign permissions to groups
print("\n2. Assigning Permissions to Groups...")

# Get Super Admin group and give it all permissions
super_admin_group = Group.objects.get(name='Super Admin')
all_permissions = Permission.objects.all()
super_admin_group.permissions.set(all_permissions)
print(f"   ✓ Assigned all permissions to Super Admin")

# Get HR Manager group and give it employee management permissions
hr_manager_group = Group.objects.get(name='HR Manager')
# Add specific permissions for HR Manager
hr_permissions = Permission.objects.filter(
    codename__in=[
        'add_user', 'change_user', 'view_user',
        'add_employee', 'change_employee', 'view_employee', 'delete_employee',
        'manage_employees'
    ]
)
hr_manager_group.permissions.set(hr_permissions)
print(f"   ✓ Assigned employee management permissions to HR Manager")

# Step 3: Assign users to groups based on their username
print("\n3. Assigning Users to Groups...")

user_role_mapping = {
    'superadmin': 'Super Admin',
    'hrmanager': 'HR Manager',
    'employee': 'Employee',
}

for username, role_name in user_role_mapping.items():
    try:
        user = User.objects.get(username=username)
        group = Group.objects.get(name=role_name)
        user.groups.clear()  # Clear existing groups
        user.groups.add(group)
        print(f"   ✓ Assigned {username} to {role_name}")
    except User.DoesNotExist:
        print(f"   ✗ User {username} not found")
    except Group.DoesNotExist:
        print(f"   ✗ Group {role_name} not found")

# Step 4: Verify assignments
print("\n4. Verification:")
for user in User.objects.all():
    roles = [g.name for g in user.groups.all()]
    if roles:
        print(f"   {user.username}: {', '.join(roles)}")
    else:
        print(f"   {user.username}: NO ROLES (needs manual assignment)")

print("\n" + "=" * 60)
print("DONE! Users can now log in with proper roles.")
print("=" * 60)
