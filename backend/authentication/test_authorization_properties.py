"""
Property-based tests for Super Admin authorization enforcement.

**Feature: employee-onboarding-authentication, Property 26: Super Admin authorization enforcement**
**Validates: Requirements 8.1**
"""
from hypothesis import given, strategies as st, settings, assume
from hypothesis.extra.django import TestCase
from django.contrib.auth.models import User, Group
from rest_framework.test import APIClient
from rest_framework import status
from employee_management.models import Employee
from authentication.utils import ROLE_SUPER_ADMIN, ROLE_HR_MANAGER, ROLE_EMPLOYEE


# Strategy for generating employee data
@st.composite
def employee_data(draw):
    """Generate random employee data for testing."""
    # Use only ASCII letters for names to ensure valid email addresses
    first_name = draw(st.text(
        min_size=1, 
        max_size=20, 
        alphabet=st.characters(min_codepoint=65, max_codepoint=122, whitelist_categories=('Lu', 'Ll'))
    ).filter(lambda x: x.isalpha()))
    
    last_name = draw(st.text(
        min_size=1, 
        max_size=20, 
        alphabet=st.characters(min_codepoint=65, max_codepoint=122, whitelist_categories=('Lu', 'Ll'))
    ).filter(lambda x: x.isalpha()))
    
    # Generate unique email and employee ID to avoid conflicts
    unique_id = draw(st.integers(min_value=1000, max_value=999999))
    email = f"{first_name.lower()}.{last_name.lower()}.{unique_id}@example.com"
    employee_id = f"EMP{unique_id}"
    
    # Generate phone with separator after country code
    country_code = draw(st.sampled_from(['+1', '+44', '+91', '+61', '+81']))
    phone_number = draw(st.from_regex(r'[1-9][0-9]{9,13}', fullmatch=True))
    phone = f"{country_code} {phone_number}"
    
    return {
        'firstName': first_name,
        'lastName': last_name,
        'employeeId': employee_id,
        'personalEmail': email,
        'mobileNumber': phone,
        'department': draw(st.sampled_from(['Engineering', 'HR', 'Finance', 'Marketing'])),
        'designation': draw(st.sampled_from(['Engineer', 'Manager', 'Analyst', 'Specialist'])),
        'joiningDate': '2025-01-01',
    }


class TestSuperAdminAuthorizationProperty(TestCase):
    """
    Property-based tests for Super Admin authorization enforcement.
    
    Property 26: Super Admin authorization enforcement
    For any user attempting to create an employee record, the request should 
    succeed if and only if the user has the Super Admin role.
    """
    
    def setUp(self):
        """Set up test client and roles."""
        super().setUp()
        self.api_client = APIClient()
        
        # Create role groups
        self.super_admin_group, _ = Group.objects.get_or_create(name=ROLE_SUPER_ADMIN)
        self.hr_manager_group, _ = Group.objects.get_or_create(name=ROLE_HR_MANAGER)
        self.employee_group, _ = Group.objects.get_or_create(name=ROLE_EMPLOYEE)
    
    def _create_user_with_role(self, username, role_name):
        """Helper to create a user with a specific role."""
        # Ensure unique username
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}_{counter}"
            counter += 1
        
        user = User.objects.create_user(
            username=username,
            password='testpass123',
            email=f'{username}@example.com'
        )
        
        if role_name == ROLE_SUPER_ADMIN:
            user.groups.add(self.super_admin_group)
        elif role_name == ROLE_HR_MANAGER:
            user.groups.add(self.hr_manager_group)
        elif role_name == ROLE_EMPLOYEE:
            user.groups.add(self.employee_group)
        
        return user
    
    @settings(max_examples=100, deadline=None)
    @given(emp_data=employee_data())
    def test_super_admin_can_create_employee(self, emp_data):
        """
        Property: Super Admin users can create employees.
        
        For any valid employee data, when a Super Admin attempts to create 
        an employee, the request should succeed.
        """
        # Create Super Admin user
        super_admin = self._create_user_with_role('superadmin_test', ROLE_SUPER_ADMIN)
        self.api_client.force_authenticate(user=super_admin)
        
        # Attempt to create employee
        response = self.api_client.post('/api/employees/', emp_data, format='json')
        
        # Should succeed (201 Created)
        self.assertEqual(
            response.status_code, 
            status.HTTP_201_CREATED,
            f"Super Admin should be able to create employees. Got {response.status_code}: {response.data}"
        )
        
        # Verify employee was created
        self.assertTrue(
            Employee.objects.filter(personalEmail=emp_data['personalEmail']).exists(),
            "Employee should exist in database after Super Admin creation"
        )
    
    @settings(max_examples=100, deadline=None)
    @given(emp_data=employee_data())
    def test_hr_manager_cannot_create_employee(self, emp_data):
        """
        Property: HR Manager users cannot create employees.
        
        For any valid employee data, when an HR Manager attempts to create 
        an employee, the request should be rejected with 403 Forbidden.
        """
        # Create HR Manager user
        hr_manager = self._create_user_with_role('hrmanager_test', ROLE_HR_MANAGER)
        self.api_client.force_authenticate(user=hr_manager)
        
        # Attempt to create employee
        response = self.api_client.post('/api/employees/', emp_data, format='json')
        
        # Should be forbidden (403)
        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
            f"HR Manager should not be able to create employees. Got {response.status_code}"
        )
        
        # Verify employee was NOT created
        self.assertFalse(
            Employee.objects.filter(personalEmail=emp_data['personalEmail']).exists(),
            "Employee should not exist in database after HR Manager rejection"
        )
    
    @settings(max_examples=100, deadline=None)
    @given(emp_data=employee_data())
    def test_regular_employee_cannot_create_employee(self, emp_data):
        """
        Property: Regular Employee users cannot create employees.
        
        For any valid employee data, when a regular Employee attempts to create 
        an employee, the request should be rejected with 403 Forbidden.
        """
        # Create regular Employee user
        employee = self._create_user_with_role('employee_test', ROLE_EMPLOYEE)
        self.api_client.force_authenticate(user=employee)
        
        # Attempt to create employee
        response = self.api_client.post('/api/employees/', emp_data, format='json')
        
        # Should be forbidden (403)
        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
            f"Regular Employee should not be able to create employees. Got {response.status_code}"
        )
        
        # Verify employee was NOT created
        self.assertFalse(
            Employee.objects.filter(personalEmail=emp_data['personalEmail']).exists(),
            "Employee should not exist in database after Employee rejection"
        )
    
    @settings(max_examples=100, deadline=None)
    @given(emp_data=employee_data())
    def test_unauthenticated_user_cannot_create_employee(self, emp_data):
        """
        Property: Unauthenticated users cannot create employees.
        
        For any valid employee data, when an unauthenticated user attempts to 
        create an employee, the request should be rejected with 401 Unauthorized.
        """
        # No authentication
        self.api_client.force_authenticate(user=None)
        
        # Attempt to create employee
        response = self.api_client.post('/api/employees/', emp_data, format='json')
        
        # Should be unauthorized (401)
        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
            f"Unauthenticated user should not be able to create employees. Got {response.status_code}"
        )
        
        # Verify employee was NOT created
        self.assertFalse(
            Employee.objects.filter(personalEmail=emp_data['personalEmail']).exists(),
            "Employee should not exist in database after unauthenticated rejection"
        )
