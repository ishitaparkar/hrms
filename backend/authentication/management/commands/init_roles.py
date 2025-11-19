"""
Management command to initialize 3 predefined roles with comprehensive permissions.
ONLY 3 ROLES: Super Admin, HR Manager, Employee
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from employee_management.models import Employee
from leave_management.models import LeaveRequest


class Command(BaseCommand):
    help = 'Initialize 3 roles (Super Admin, HR Manager, Employee) with comprehensive permissions'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('='*70))
        self.stdout.write(self.style.SUCCESS('Initializing RBAC System - 3 Roles Only'))
        self.stdout.write(self.style.SUCCESS('='*70))
        
        # Delete Department Head role if it exists
        try:
            dept_head = Group.objects.get(name='Department Head')
            dept_head.delete()
            self.stdout.write(self.style.WARNING('✓ Removed "Department Head" role (not in new structure)'))
        except Group.DoesNotExist:
            pass
        
        # Define ONLY 3 roles with comprehensive permissions
        roles_permissions = {
            'Super Admin': {
                'description': 'Full System Owner - Complete Control',
                'permissions': [
                    # Employee Management - Full
                    'view_employee', 'add_employee', 'change_employee', 'delete_employee',
                    'view_all_employees', 'manage_employees',
                    
                    # Leave Management - Full
                    'view_leaverequest', 'add_leaverequest', 'change_leaverequest', 'delete_leaverequest',
                    'view_all_leaves', 'approve_leaves',
                    
                    # System Administration - Full
                    'view_userprofile', 'add_userprofile', 'change_userprofile',
                    'view_auditlog', 'manage_roles',
                ]
            },
            'HR Manager': {
                'description': 'University-wide HR Operations (No System Settings)',
                'permissions': [
                    # Employee Management - Full
                    'view_employee', 'add_employee', 'change_employee', 'delete_employee',
                    'view_all_employees', 'manage_employees',
                    
                    # Leave Management - Full (view/approve all)
                    'view_leaverequest', 'add_leaverequest', 'change_leaverequest',
                    'view_all_leaves', 'approve_leaves',
                    
                    # User Profile - View only
                    'view_userprofile',
                ]
            },
            'Employee': {
                'description': 'Self-Service Only - Basic Interaction',
                'permissions': [
                    # Own Profile - View/Edit Limited
                    'view_employee',
                    
                    # Leave Management - Own Only
                    'view_leaverequest', 'add_leaverequest', 'manage_own_leaves',
                ]
            },
        }
        
        created_count = 0
        updated_count = 0
        
        for role_name, role_data in roles_permissions.items():
            # Get or create the role (Group)
            role, created = Group.objects.get_or_create(name=role_name)
            
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'\n✓ Created role: {role_name}'))
            else:
                updated_count += 1
                self.stdout.write(self.style.WARNING(f'\n⟳ Role already exists: {role_name} - updating permissions'))
            
            self.stdout.write(f'  Description: {role_data["description"]}')
            
            # Clear existing permissions to ensure clean state
            role.permissions.clear()
            
            # Assign permissions to the role
            permissions_added = 0
            for perm_codename in role_data['permissions']:
                try:
                    # Try to find the permission
                    permission = Permission.objects.get(codename=perm_codename)
                    role.permissions.add(permission)
                    permissions_added += 1
                except Permission.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(f'  ⚠ Permission not found: {perm_codename}')
                    )
            
            self.stdout.write(
                self.style.SUCCESS(f'  → Assigned {permissions_added} permissions')
            )
        
        self.stdout.write(self.style.SUCCESS('\n' + '='*70))
        self.stdout.write(
            self.style.SUCCESS(
                f'Role initialization complete! Created: {created_count}, Updated: {updated_count}'
            )
        )
        self.stdout.write(self.style.SUCCESS('='*70 + '\n'))
