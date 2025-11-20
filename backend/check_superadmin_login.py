#!/usr/bin/env python
"""
Script to check and fix Super Admin login issues.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrms_core.settings')
django.setup()

from django.contrib.auth.models import User, Group
from authentication.utils import ROLE_SUPER_ADMIN

def check_superadmin():
    """Check Super Admin user and provide login information."""
    
    print("=" * 60)
    print("SUPER ADMIN LOGIN CHECKER")
    print("=" * 60)
    
    # Get Super Admin role
    try:
        super_admin_group = Group.objects.get(name=ROLE_SUPER_ADMIN)
        print(f"\n✓ Super Admin role exists")
    except Group.DoesNotExist:
        print(f"\n✗ Super Admin role does not exist!")
        print("Run: python manage.py shell -c \"from authentication.utils import ensure_role_exists, ROLE_SUPER_ADMIN; ensure_role_exists(ROLE_SUPER_ADMIN)\"")
        return
    
    # Get Super Admin users
    super_admins = User.objects.filter(groups=super_admin_group)
    
    if not super_admins.exists():
        print("\n✗ No Super Admin users found!")
        print("\nTo create a Super Admin:")
        print("  python manage.py createsuperuser")
        print("  Then run: python backend/fix_roles.py")
        return
    
    print(f"\n✓ Found {super_admins.count()} Super Admin user(s):\n")
    
    for user in super_admins:
        print(f"Username: {user.username}")
        print(f"Email: {user.email}")
        print(f"Active: {'✓' if user.is_active else '✗'}")
        print(f"Staff: {'✓' if user.is_staff else '✗'}")
        print(f"Superuser: {'✓' if user.is_superuser else '✗'}")
        print(f"Has usable password: {'✓' if user.has_usable_password() else '✗'}")
        
        # Check if user has a profile
        if hasattr(user, 'profile'):
            print(f"Has profile: ✓")
            print(f"Password changed: {'✓' if user.profile.password_changed else '✗'}")
        else:
            print(f"Has profile: ✗")
        
        print("\n" + "-" * 60)
    
    print("\n" + "=" * 60)
    print("LOGIN INSTRUCTIONS")
    print("=" * 60)
    
    user = super_admins.first()
    print(f"\nTo login via API:")
    print(f"  curl -X POST http://127.0.0.1:8000/api/auth/login/ \\")
    print(f"    -H 'Content-Type: application/json' \\")
    print(f"    -d '{{\"username\": \"{user.username}\", \"password\": \"YOUR_PASSWORD\"}}'")
    
    print(f"\nTo login via Django Admin:")
    print(f"  URL: http://127.0.0.1:8000/admin/")
    print(f"  Username: {user.username}")
    print(f"  Password: YOUR_PASSWORD")
    
    print("\n" + "=" * 60)
    print("TROUBLESHOOTING")
    print("=" * 60)
    
    print("\nIf you forgot the password:")
    print("  1. Reset via Django shell:")
    print(f"     python manage.py shell -c \"from django.contrib.auth.models import User; u = User.objects.get(username='{user.username}'); u.set_password('newpassword123'); u.save(); print('Password reset successfully')\"")
    print("\n  2. Or use Django's changepassword command:")
    print(f"     python manage.py changepassword {user.username}")
    
    print("\nIf login still fails:")
    print("  1. Check if backend server is running: http://127.0.0.1:8000/")
    print("  2. Check browser console for errors")
    print("  3. Check backend logs for authentication errors")
    print("  4. Verify CORS settings allow frontend domain")
    
    print("\n" + "=" * 60)

if __name__ == '__main__':
    check_superadmin()
