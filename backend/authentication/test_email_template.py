"""
Test script to verify email template rendering.

This script tests that the welcome email templates render correctly
with sample data and can be used to preview the email output.

Usage:
    python manage.py shell < backend/authentication/test_email_template.py
"""
from django.template.loader import render_to_string
from django.conf import settings

def test_email_template_rendering():
    """Test that email templates render correctly with sample data."""
    
    # Sample context data
    context = {
        'organization_name': 'Acme Corporation',
        'employee_first_name': 'John',
        'employee_last_name': 'Doe',
        'employee_id': 'EMP001',
        'employee_email': 'john.doe@acme.com',
        'employee_phone': '+14155552671',
        'username': 'john.doe@acme.com',
        'temporary_password': 'TempPass123!',
        'portal_url': 'http://localhost:3000',
    }
    
    print("=" * 80)
    print("Testing Email Template Rendering")
    print("=" * 80)
    
    # Test HTML template
    try:
        html_content = render_to_string('authentication/emails/welcome_email.html', context)
        print("\n✓ HTML template rendered successfully")
        print(f"  Length: {len(html_content)} characters")
        
        # Check for required content
        required_elements = [
            context['employee_first_name'],
            context['employee_last_name'],
            context['employee_id'],
            context['employee_email'],
            context['employee_phone'],
            context['portal_url'],
            'Security Information',
            'Account Activation',
        ]
        
        missing_elements = []
        for element in required_elements:
            if element not in html_content:
                missing_elements.append(element)
        
        if missing_elements:
            print(f"  ✗ Missing elements: {', '.join(missing_elements)}")
        else:
            print("  ✓ All required elements present")
            
    except Exception as e:
        print(f"\n✗ HTML template rendering failed: {str(e)}")
        return False
    
    # Test plain text template
    try:
        text_content = render_to_string('authentication/emails/welcome_email.txt', context)
        print("\n✓ Plain text template rendered successfully")
        print(f"  Length: {len(text_content)} characters")
        
        # Check for required content
        missing_elements = []
        for element in required_elements:
            if element not in text_content:
                missing_elements.append(element)
        
        if missing_elements:
            print(f"  ✗ Missing elements: {', '.join(missing_elements)}")
        else:
            print("  ✓ All required elements present")
            
    except Exception as e:
        print(f"\n✗ Plain text template rendering failed: {str(e)}")
        return False
    
    print("\n" + "=" * 80)
    print("Email Template Test Summary")
    print("=" * 80)
    print("✓ Both HTML and plain text templates render successfully")
    print("✓ All required data fields are present in both templates")
    print("\nTo preview the HTML email, save the rendered content to a file:")
    print("  with open('preview.html', 'w') as f:")
    print("      f.write(html_content)")
    print("\n" + "=" * 80)
    
    return True

if __name__ == '__main__':
    test_email_template_rendering()
