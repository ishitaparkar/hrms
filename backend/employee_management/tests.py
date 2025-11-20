from django.test import TestCase
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from .models import Employee
from .serializers import EmployeeSerializer
from authentication.models import UserProfile
from datetime import date
from rest_framework.exceptions import ValidationError as DRFValidationError


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



class EmployeeValidationTest(TestCase):
    """Test cases for Employee model validation."""
    
    def setUp(self):
        """Set up base employee data."""
        self.valid_employee_data = {
            'firstName': 'John',
            'lastName': 'Doe',
            'employeeId': 'EMP001',
            'personalEmail': 'john.doe@example.com',
            'mobileNumber': '+1 415-555-2671',
            'joiningDate': date(2024, 1, 1),
            'department': 'Engineering',
            'designation': 'Software Engineer',
        }
    
    # Email Validation Tests
    
    def test_valid_email_formats(self):
        """Test that valid email formats are accepted."""
        valid_emails = [
            'user@example.com',
            'john.doe@company.co.uk',
            'test+tag@domain.com',
            'user123@test-domain.org',
            'first.last@subdomain.example.com',
        ]
        
        for email in valid_emails:
            data = self.valid_employee_data.copy()
            data['personalEmail'] = email
            data['employeeId'] = f'EMP{valid_emails.index(email)}'
            
            employee = Employee(**data)
            try:
                employee.full_clean()  # This triggers model validation
                employee.save()
                self.assertEqual(employee.personalEmail, email)
            except ValidationError as e:
                self.fail(f"Valid email '{email}' was rejected: {e}")
    
    def test_invalid_email_formats(self):
        """Test that invalid email formats are rejected."""
        invalid_emails = [
            'notanemail',
            '@example.com',
            'user@',
            'user @example.com',
            'user@.com',
            'user..name@example.com',
            '',
        ]
        
        for email in invalid_emails:
            data = self.valid_employee_data.copy()
            data['personalEmail'] = email
            data['employeeId'] = f'INVALID{invalid_emails.index(email)}'
            
            employee = Employee(**data)
            with self.assertRaises(ValidationError, msg=f"Invalid email '{email}' was accepted"):
                employee.full_clean()
    
    def test_email_validation_error_message(self):
        """Test that email validation returns appropriate error message."""
        data = self.valid_employee_data.copy()
        data['personalEmail'] = 'invalid.email'
        
        employee = Employee(**data)
        with self.assertRaises(ValidationError) as context:
            employee.full_clean()
        
        # Check that the error is for personalEmail field
        self.assertIn('personalEmail', context.exception.message_dict)
    
    # Phone Number Validation Tests
    
    def test_valid_phone_formats(self):
        """Test that valid phone number formats with country codes are accepted."""
        valid_phones = [
            '+1 415-555-2671',
            '+91 9876543210',
            '+44 20 7946 0958',
            '+1-555-123-4567',
            '+91 (987) 654-3210',
            '+86 138 0013 8000',
        ]
        
        for phone in valid_phones:
            data = self.valid_employee_data.copy()
            data['mobileNumber'] = phone
            data['employeeId'] = f'PHONE{valid_phones.index(phone)}'
            data['personalEmail'] = f'user{valid_phones.index(phone)}@example.com'
            
            employee = Employee(**data)
            try:
                employee.full_clean()
                employee.save()
                self.assertEqual(employee.mobileNumber, phone)
            except ValidationError as e:
                self.fail(f"Valid phone '{phone}' was rejected: {e}")
    
    def test_phone_without_country_code(self):
        """Test that phone numbers without country code are rejected."""
        invalid_phones = [
            '4155552671',
            '9876543210',
            '555-1234',
        ]
        
        for phone in invalid_phones:
            data = self.valid_employee_data.copy()
            data['mobileNumber'] = phone
            data['employeeId'] = f'NOCC{invalid_phones.index(phone)}'
            data['personalEmail'] = f'nocc{invalid_phones.index(phone)}@example.com'
            
            employee = Employee(**data)
            with self.assertRaises(ValidationError, msg=f"Phone without country code '{phone}' was accepted"):
                employee.full_clean()
    
    def test_phone_length_validation(self):
        """Test that phone numbers with invalid lengths are rejected."""
        # Too short (less than 10 digits)
        short_phones = [
            '+1 123',
            '+91 12345',
        ]
        
        for phone in short_phones:
            data = self.valid_employee_data.copy()
            data['mobileNumber'] = phone
            data['employeeId'] = f'SHORT{short_phones.index(phone)}'
            data['personalEmail'] = f'short{short_phones.index(phone)}@example.com'
            
            employee = Employee(**data)
            with self.assertRaises(ValidationError, msg=f"Short phone '{phone}' was accepted"):
                employee.full_clean()
        
        # Too long (more than 15 digits)
        long_phones = [
            '+1 1234567890123456',
            '+91 12345678901234567',
        ]
        
        for phone in long_phones:
            data = self.valid_employee_data.copy()
            data['mobileNumber'] = phone
            data['employeeId'] = f'LONG{long_phones.index(phone)}'
            data['personalEmail'] = f'long{long_phones.index(phone)}@example.com'
            
            employee = Employee(**data)
            with self.assertRaises(ValidationError, msg=f"Long phone '{phone}' was accepted"):
                employee.full_clean()
    
    def test_phone_validation_error_message(self):
        """Test that phone validation returns appropriate error message."""
        data = self.valid_employee_data.copy()
        data['mobileNumber'] = '1234567890'  # No country code
        
        employee = Employee(**data)
        with self.assertRaises(ValidationError) as context:
            employee.full_clean()
        
        # Check that the error is for mobileNumber field
        self.assertIn('mobileNumber', context.exception.message_dict)
        error_message = str(context.exception.message_dict['mobileNumber'][0])
        self.assertIn('country code', error_message.lower())


class EmployeeSerializerValidationTest(TestCase):
    """Test cases for EmployeeSerializer validation."""
    
    def setUp(self):
        """Set up base employee data."""
        self.valid_data = {
            'firstName': 'Jane',
            'lastName': 'Smith',
            'employeeId': 'EMP100',
            'personalEmail': 'jane.smith@example.com',
            'mobileNumber': '+1 555-123-4567',
            'joiningDate': '2024-01-01',
            'department': 'Marketing',
            'designation': 'Marketing Manager',
        }
    
    def test_serializer_with_valid_data(self):
        """Test that serializer accepts valid data."""
        serializer = EmployeeSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid(), f"Serializer errors: {serializer.errors}")
    
    def test_serializer_rejects_invalid_email(self):
        """Test that serializer rejects invalid email."""
        data = self.valid_data.copy()
        data['personalEmail'] = 'invalid.email'
        
        serializer = EmployeeSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('personalEmail', serializer.errors)
    
    def test_serializer_rejects_phone_without_country_code(self):
        """Test that serializer rejects phone without country code."""
        data = self.valid_data.copy()
        data['mobileNumber'] = '5551234567'
        
        serializer = EmployeeSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('mobileNumber', serializer.errors)
    
    def test_serializer_rejects_short_phone(self):
        """Test that serializer rejects phone numbers that are too short."""
        data = self.valid_data.copy()
        data['mobileNumber'] = '+1 123'
        
        serializer = EmployeeSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('mobileNumber', serializer.errors)
    
    def test_serializer_rejects_long_phone(self):
        """Test that serializer rejects phone numbers that are too long."""
        data = self.valid_data.copy()
        data['mobileNumber'] = '+1 12345678901234567890'
        
        serializer = EmployeeSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('mobileNumber', serializer.errors)
    
    def test_serializer_error_messages_are_descriptive(self):
        """Test that validation error messages are clear and helpful."""
        # Test email error message
        data = self.valid_data.copy()
        data['personalEmail'] = 'notanemail'
        
        serializer = EmployeeSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        email_error = str(serializer.errors['personalEmail'][0])
        self.assertIn('email', email_error.lower())
        
        # Test phone error message
        data = self.valid_data.copy()
        data['mobileNumber'] = '1234567890'
        
        serializer = EmployeeSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        phone_error = str(serializer.errors['mobileNumber'][0])
        self.assertIn('country code', phone_error.lower())
