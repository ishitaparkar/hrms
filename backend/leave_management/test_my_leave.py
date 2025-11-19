"""
Tests for the my-leave endpoint.
"""
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from employee_management.models import Employee
from authentication.models import UserProfile
from leave_management.models import LeaveBalance, LeaveRequest, Holiday
from datetime import date, timedelta


class MyLeaveAPITestCase(TestCase):
    """Test cases for the my-leave API endpoint"""
    
    def setUp(self):
        """Set up test data"""
        # Create a test user
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        
        # Create an employee
        self.employee = Employee.objects.create(
            firstName='Test',
            lastName='User',
            employeeId='EMP001',
            personalEmail='test@example.com',
            mobileNumber='1234567890',
            joiningDate=date.today(),
            department='IT',
            designation='Developer'
        )
        
        # Create user profile linking user to employee
        self.profile = UserProfile.objects.create(
            user=self.user,
            employee=self.employee
        )
        
        # Create leave balances
        LeaveBalance.objects.create(
            employee=self.employee,
            leave_type='Casual',
            total=10,
            used=2
        )
        LeaveBalance.objects.create(
            employee=self.employee,
            leave_type='Sick',
            total=10,
            used=0
        )
        LeaveBalance.objects.create(
            employee=self.employee,
            leave_type='Vacation',
            total=15,
            used=5
        )
        
        # Create a leave request
        LeaveRequest.objects.create(
            employee=self.employee,
            leave_type='Casual',
            start_date=date.today() + timedelta(days=10),
            end_date=date.today() + timedelta(days=12),
            reason='Personal work',
            status='Pending'
        )
        
        # Create a holiday
        Holiday.objects.create(
            name='Test Holiday',
            date=date.today() + timedelta(days=30),
            description='Test holiday description'
        )
        
        # Set up API client
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_get_my_leave_success(self):
        """Test successful retrieval of leave data"""
        response = self.client.get('/api/my-leave/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('balances', response.data)
        self.assertIn('requests', response.data)
        self.assertIn('holidays', response.data)
        
        # Check balances
        self.assertEqual(len(response.data['balances']), 3)
        casual_balance = next(b for b in response.data['balances'] if b['leave_type'] == 'Casual')
        self.assertEqual(casual_balance['total'], 10)
        self.assertEqual(casual_balance['used'], 2)
        self.assertEqual(casual_balance['remaining'], 8)
        
        # Check requests
        self.assertEqual(len(response.data['requests']), 1)
        self.assertEqual(response.data['requests'][0]['status'], 'Pending')
        
        # Check holidays
        self.assertGreaterEqual(len(response.data['holidays']), 1)
    
    def test_post_leave_request_success(self):
        """Test successful creation of leave request"""
        data = {
            'leave_type': 'Sick',
            'start_date': date.today() + timedelta(days=5),
            'end_date': date.today() + timedelta(days=7),
            'reason': 'Medical appointment'
        }
        
        response = self.client.post('/api/my-leave/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['leave_type'], 'Sick')
        self.assertEqual(response.data['status'], 'Pending')
        
        # Verify the leave request was created
        self.assertTrue(
            LeaveRequest.objects.filter(
                employee=self.employee,
                leave_type='Sick',
                reason='Medical appointment'
            ).exists()
        )
    
    def test_post_leave_request_insufficient_balance(self):
        """Test leave request with insufficient balance"""
        data = {
            'leave_type': 'Casual',
            'start_date': date.today() + timedelta(days=5),
            'end_date': date.today() + timedelta(days=15),  # 11 days, but only 8 remaining
            'reason': 'Long vacation'
        }
        
        response = self.client.post('/api/my-leave/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('leave_type', response.data)
    
    def test_post_leave_request_invalid_dates(self):
        """Test leave request with end date before start date"""
        data = {
            'leave_type': 'Sick',
            'start_date': date.today() + timedelta(days=10),
            'end_date': date.today() + timedelta(days=5),
            'reason': 'Invalid dates'
        }
        
        response = self.client.post('/api/my-leave/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('end_date', response.data)
    
    def test_unauthenticated_access(self):
        """Test that unauthenticated users cannot access the endpoint"""
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/my-leave/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
