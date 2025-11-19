#!/usr/bin/env python
"""
Generate a preview of the welcome email template.
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrms_core.settings')
django.setup()

from django.template.loader import render_to_string

# Sample context data
context = {
    'organization_name': 'Acme Corporation',
    'employee_first_name': 'John',
    'employee_last_name': 'Doe',
    'employee_id': 'EMP001',
    'username': 'john.doe@acme.com',
    'temporary_password': 'TempPass123!@#',
    'portal_url': 'http://localhost:3000',
}

# Render HTML template
html = render_to_string('authentication/emails/welcome_email.html', context)

# Save to file
output_file = 'email_preview.html'
with open(output_file, 'w') as f:
    f.write(html)

print(f'✓ Email preview saved to backend/{output_file}')
print(f'✓ Open the file in a web browser to view the email')
print(f'✓ Template length: {len(html)} characters')
