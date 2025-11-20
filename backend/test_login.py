#!/usr/bin/env python
"""
Quick script to test Super Admin login.
"""
import requests
import json

# Configuration
BASE_URL = "http://127.0.0.1:8000"
USERNAME = "superadmin"
PASSWORD = "admin123"  # Change this to your actual password

def test_login():
    """Test login endpoint."""
    print("=" * 60)
    print("TESTING SUPER ADMIN LOGIN")
    print("=" * 60)
    
    print(f"\nAttempting to login as: {USERNAME}")
    print(f"URL: {BASE_URL}/api/auth/login/")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login/",
            headers={"Content-Type": "application/json"},
            json={"username": USERNAME, "password": PASSWORD},
            timeout=5
        )
        
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("\n✓ LOGIN SUCCESSFUL!")
            print(f"\nToken: {data.get('token', 'N/A')}")
            print(f"User ID: {data.get('user_id', 'N/A')}")
            print(f"Email: {data.get('email', 'N/A')}")
            print(f"Roles: {', '.join(data.get('roles', []))}")
            print(f"Permissions: {len(data.get('permissions', []))} permissions")
            
            # Check if Super Admin role is present
            if 'Super Admin' in data.get('roles', []):
                print("\n✓ User has Super Admin role")
            else:
                print("\n✗ WARNING: User does NOT have Super Admin role!")
                print("   Run: python backend/fix_roles.py")
            
            return True
        else:
            print("\n✗ LOGIN FAILED!")
            print(f"\nResponse: {response.text}")
            
            if response.status_code == 400:
                print("\nPossible issues:")
                print("  - Incorrect username or password")
                print("  - User account is inactive")
            elif response.status_code == 500:
                print("\nPossible issues:")
                print("  - Server error")
                print("  - Database connection issue")
            
            return False
            
    except requests.exceptions.ConnectionError:
        print("\n✗ CONNECTION ERROR!")
        print("\nThe backend server is not running.")
        print("Start it with: python manage.py runserver")
        return False
    except Exception as e:
        print(f"\n✗ ERROR: {str(e)}")
        return False

if __name__ == '__main__':
    success = test_login()
    
    if not success:
        print("\n" + "=" * 60)
        print("TROUBLESHOOTING STEPS")
        print("=" * 60)
        print("\n1. Make sure backend server is running:")
        print("   cd backend && python manage.py runserver")
        print("\n2. Reset password if needed:")
        print("   python manage.py changepassword superadmin")
        print("\n3. Check user roles:")
        print("   python backend/fix_roles.py")
        print("\n4. Create user profile:")
        print("   python backend/check_superadmin_login.py")
