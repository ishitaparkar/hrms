from django.test import TestCase
from django.contrib.auth.models import User
from .models import Employee
from authentication.models import UserProfile
from datetime import date


class EmployeeModelTest(TestCase):
    """Test cases for Employee model to verify module organization."""
    
    def setUp(self):
        """Set up test data."""
        self.employee_data = {
            'firstName': 'John',
            'lastName': 'Doe',
            'employeeId': 'EMP001',
            'personalEmail': 'john.doe@test.com',
            'mobileNumber': '+1-555-1234',
            'joiningDate': date(2024, 1, 1),
            'department': 'Computer Science',
            'designation': 'Professor',
        }
    
    def test_employee_creation(self):
        """Test that Employee model can be created successfully."""
        employee = Employee.objects.create(**self.employee_data)
        self.assertEqual(employee.firstName, 'John')
        self.assertEqual(employee.lastName, 'Doe')
        self.assertEqual(employee.employeeId, 'EMP001')
        self.assertEqual(employee.department, 'Computer Science')
        self.assertEqual(employee.designation, 'Professor')
    
    def test_employee_str_representation(self):
        """Test the string representation of Employee."""
        employee = Employee.objects.create(**self.employee_data)
        expected_str = "John Doe (EMP001)"
        self.assertEqual(str(employee), expected_str)
    
    def test_employee_unique_constraints(self):
        """Test that employeeId and personalEmail are unique."""
        Employee.objects.create(**self.employee_data)
        
        # Try to create another employee with same employeeId
        duplicate_data = self.employee_data.copy()
        duplicate_data['personalEmail'] = 'different@test.com'
        
        with self.assertRaises(Exception):
            Employee.objects.create(**duplicate_data)
    
    def test_employee_userprofile_relationship(self):
        """Test that Employee can be linked to UserProfile."""
        # Create user
        user = User.objects.create_user(
            username='testuser',
            email='testuser@test.com',
            password='testpass123'
        )
        
        # Create employee
        employee = Employee.objects.create(**self.employee_data)
        
        # Create user profile linking user and employee
        profile = UserProfile.objects.create(
            user=user,
            employee=employee,
            department='Computer Science'
        )
        
        # Verify the relationship
        self.assertEqual(profile.employee, employee)
        self.assertEqual(employee.user_profile, profile)
        self.assertEqual(user.profile, profile)



class MyTeamAPITest(TestCase):
    """Test cases for My Team API endpoint."""
    
    def setUp(self):
        """Set up test data with employees and users."""
        # Create a manager
        self.manager = Employee.objects.create(
            firstName='Jane',
            lastName='Manager',
            employeeId='MGR001',
            personalEmail='jane.manager@test.com',
            mobileNumber='+1-555-0001',
            joiningDate=date(2020, 1, 1),
            department='Engineering',
            designation='Engineering Manager'
        )
        
        # Create team members
        self.employee1 = Employee.objects.create(
            firstName='John',
            lastName='Doe',
            employeeId='EMP001',
            personalEmail='john.doe@test.com',
            mobileNumber='+1-555-0002',
            joiningDate=date(2023, 1, 1),
            department='Engineering',
            designation='Software Engineer'
        )
        
        self.employee2 = Employee.objects.create(
            firstName='Alice',
            lastName='Smith',
            employeeId='EMP002',
            personalEmail='alice.smith@test.com',
            mobileNumber='+1-555-0003',
            joiningDate=date(2023, 6, 1),
            department='Engineering',
            designation='Senior Software Engineer'
        )
        
        # Create employee in different department
        self.other_dept_employee = Employee.objects.create(
            firstName='Bob',
            lastName='Jones',
            employeeId='EMP003',
            personalEmail='bob.jones@test.com',
            mobileNumber='+1-555-0004',
            joiningDate=date(2023, 1, 1),
            department='Marketing',
            designation='Marketing Specialist'
        )
        
        # Create user and profile for employee1
        self.user = User.objects.create_user(
            username='john.doe',
            email='john.doe@test.com',
            password='testpass123'
        )
        
        self.profile = UserProfile.objects.create(
            user=self.user,
            employee=self.employee1,
            department='Engineering'
        )
    
    def test_my_team_endpoint_returns_manager_and_team(self):
        """Test that my-team endpoint returns manager and team members."""
        from rest_framework.test import APIClient
        
        client = APIClient()
        client.force_authenticate(user=self.user)
        
        response = client.get('/api/employees/my-team/')
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('manager', response.data)
        self.assertIn('department', response.data)
        self.assertIn('team_members', response.data)
        self.assertIn('team_member_count', response.data)
        
        # Verify manager is returned
        self.assertIsNotNone(response.data['manager'])
        self.assertEqual(response.data['manager']['firstName'], 'Jane')
        self.assertEqual(response.data['manager']['designation'], 'Engineering Manager')
        
        # Verify department
        self.assertEqual(response.data['department'], 'Engineering')
        
        # Verify team members (should include manager and employee2, but not employee1 or other dept)
        self.assertEqual(response.data['team_member_count'], 2)
        
        # Verify employee from other department is not included
        team_member_ids = [member['id'] for member in response.data['team_members']]
        self.assertNotIn(self.other_dept_employee.id, team_member_ids)
        self.assertNotIn(self.employee1.id, team_member_ids)  # Current user excluded
    
    def test_my_team_endpoint_without_employee_profile(self):
        """Test that endpoint returns error when user has no employee record."""
        from rest_framework.test import APIClient
        
        # Create user without employee profile
        user_no_profile = User.objects.create_user(
            username='noemployee',
            email='noemployee@test.com',
            password='testpass123'
        )
        
        client = APIClient()
        client.force_authenticate(user=user_no_profile)
        
        response = client.get('/api/employees/my-team/')
        
        self.assertEqual(response.status_code, 404)
        self.assertIn('error', response.data)
