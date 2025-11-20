#!/usr/bin/env python
"""
Test phone authentication directly
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_phone_auth(email, phone):
    """Test phone authentication."""
    print("=" * 60)
    print("TESTING PHONE AUTHENTICATION")
    print("=" * 60)
    
    print(f"\nEmail: {email}")
    print(f"Phone: {phone}")
    print(f"Phone length: {len(phone)}")
    print(f"Phone repr: {repr(phone)}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-phone/",
            headers={"Content-Type": "application/json"},
            json={"email": email, "phone_number": phone},
            timeout=5
        )
        
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("\n✓ AUTHENTICATION SUCCESSFUL!")
            return True
        else:
            print("\n✗ AUTHENTICATION FAILED!")
            return False
            
    except Exception as e:
        print(f"\n✗ ERROR: {str(e)}")
        return False

if __name__ == '__main__':
    # Test with the employee
    email = "krishnandugurey64@gmail.com"
    phone = "+91 8369925249"  # With space
    
    print("\nTest 1: With space (correct format)")
    test_phone_auth(email, phone)
    
    print("\n" + "=" * 60)
    print("\nTest 2: Without space (incorrect format)")
    phone_no_space = "+918369925249"  # Without space
    test_phone_auth(email, phone_no_space)
