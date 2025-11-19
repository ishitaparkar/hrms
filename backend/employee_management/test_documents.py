from django.test import TestCase
from django.contrib.auth.models import User, Group
from rest_framework.test import APIClient
from rest_framework import status
from .models import Employee, EmployeeDocument
from authentication.models import UserProfile
from datetime import date
from io import BytesIO
from django.core.files.uploadedfile import SimpleUploadedFile


class EmployeeDocumentAPITest(TestCase):
    """Test cases for Employee Document Management API."""
    
    def setUp(self):
        """Set up test data."""
        # Create roles
        self.hr_role = Group.objects.create(name='HR Manager')
        self.employee_role = Group.objects.create(name='Employee')
        
        # Create HR Manager user
        self.hr_user = User.objects.create_user(
            username='hrmanager',
            email='hr@test.com',
            password='testpass123'
        )
        self.hr_user.groups.add(self.hr_role)
        
        # Create Employee user
        self.employee_user = User.objects.create_user(
            username='employee',
            email='employee@test.com',
            password='testpass123'
        )
        self.employee_user.groups.add(self.employee_role)
        
        # Create employee record
        self.employee = Employee.objects.create(
            firstName='John',
            lastName='Doe',
            employeeId='EMP001',
            personalEmail='john.doe@test.com',
            mobileNumber='+1-555-1234',
            joiningDate=date(2024, 1, 1),
            department='IT',
            designation='Developer'
        )
        
        # Link employee to user
        self.employee_profile = UserProfile.objects.create(
            user=self.employee_user,
            employee=self.employee,
            department='IT'
        )
        
        # Create API client
        self.client = APIClient()
    
    def test_document_model_creation(self):
        """Test that EmployeeDocument model can be created."""
        document = EmployeeDocument.objects.create(
            employee=self.employee,
            name='Test Document',
            category='Personal',
            file='test.pdf',
            file_type='pdf',
            file_size=1024,
            status='Pending',
            uploaded_by=self.hr_user
        )
        self.assertEqual(document.name, 'Test Document')
        self.assertEqual(document.category, 'Personal')
        self.assertEqual(document.employee, self.employee)
    
    def test_get_documents_as_hr_manager(self):
        """Test that HR Manager can retrieve employee documents."""
        # Create a document
        EmployeeDocument.objects.create(
            employee=self.employee,
            name='Test Document',
            category='Personal',
            file='test.pdf',
            file_type='pdf',
            file_size=1024,
            status='Verified',
            uploaded_by=self.hr_user
        )
        
        # Authenticate as HR Manager
        self.client.force_authenticate(user=self.hr_user)
        
        # Get documents
        response = self.client.get(f'/api/employees/{self.employee.id}/documents/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('documents', response.data)
        self.assertEqual(len(response.data['documents']), 1)
    
    def test_get_documents_as_employee(self):
        """Test that employee can retrieve their own documents."""
        # Create a document
        EmployeeDocument.objects.create(
            employee=self.employee,
            name='My Document',
            category='Personal',
            file='test.pdf',
            file_type='pdf',
            file_size=1024,
            status='Verified',
            uploaded_by=self.hr_user
        )
        
        # Authenticate as employee
        self.client.force_authenticate(user=self.employee_user)
        
        # Get documents
        response = self.client.get(f'/api/employees/{self.employee.id}/documents/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('documents', response.data)
    
    def test_documents_grouped_by_category(self):
        """Test that documents are grouped by category in response."""
        # Create documents in different categories
        EmployeeDocument.objects.create(
            employee=self.employee,
            name='Personal Doc',
            category='Personal',
            file='personal.pdf',
            file_type='pdf',
            file_size=1024,
            uploaded_by=self.hr_user
        )
        EmployeeDocument.objects.create(
            employee=self.employee,
            name='Employment Doc',
            category='Employment',
            file='employment.pdf',
            file_type='pdf',
            file_size=2048,
            uploaded_by=self.hr_user
        )
        
        # Authenticate as HR Manager
        self.client.force_authenticate(user=self.hr_user)
        
        # Get documents
        response = self.client.get(f'/api/employees/{self.employee.id}/documents/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('documents_by_category', response.data)
        self.assertIn('Personal', response.data['documents_by_category'])
        self.assertIn('Employment', response.data['documents_by_category'])
        self.assertEqual(len(response.data['documents_by_category']['Personal']), 1)
        self.assertEqual(len(response.data['documents_by_category']['Employment']), 1)
    
    def test_download_document_as_hr_manager(self):
        """Test that HR Manager can download employee documents."""
        # Create a test file
        test_file = SimpleUploadedFile(
            name='test_document.pdf',
            content=b'Test PDF content',
            content_type='application/pdf'
        )
        
        # Create a document
        document = EmployeeDocument.objects.create(
            employee=self.employee,
            name='Test Document.pdf',
            category='Personal',
            file=test_file,
            file_type='pdf',
            file_size=len(b'Test PDF content'),
            status='Verified',
            uploaded_by=self.hr_user
        )
        
        # Authenticate as HR Manager
        self.client.force_authenticate(user=self.hr_user)
        
        # Download document
        response = self.client.get(
            f'/api/employees/{self.employee.id}/documents/{document.id}/download/'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertIn('attachment', response['Content-Disposition'])
    
    def test_download_document_as_employee(self):
        """Test that employee can download their own documents."""
        # Create a test file
        test_file = SimpleUploadedFile(
            name='my_document.pdf',
            content=b'My PDF content',
            content_type='application/pdf'
        )
        
        # Create a document
        document = EmployeeDocument.objects.create(
            employee=self.employee,
            name='My Document.pdf',
            category='Personal',
            file=test_file,
            file_type='pdf',
            file_size=len(b'My PDF content'),
            status='Verified',
            uploaded_by=self.hr_user
        )
        
        # Authenticate as employee
        self.client.force_authenticate(user=self.employee_user)
        
        # Download document
        response = self.client.get(
            f'/api/employees/{self.employee.id}/documents/{document.id}/download/'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/pdf')
    
    def test_cannot_download_other_employee_document(self):
        """Test that employee cannot download another employee's documents."""
        # Create another employee
        other_employee = Employee.objects.create(
            firstName='Jane',
            lastName='Smith',
            employeeId='EMP002',
            personalEmail='jane.smith@test.com',
            mobileNumber='+1-555-5678',
            joiningDate=date(2024, 1, 1),
            department='HR',
            designation='HR Manager'
        )
        
        # Create a test file for other employee
        test_file = SimpleUploadedFile(
            name='other_document.pdf',
            content=b'Other PDF content',
            content_type='application/pdf'
        )
        
        # Create a document for other employee
        document = EmployeeDocument.objects.create(
            employee=other_employee,
            name='Other Document.pdf',
            category='Personal',
            file=test_file,
            file_type='pdf',
            file_size=len(b'Other PDF content'),
            status='Verified',
            uploaded_by=self.hr_user
        )
        
        # Authenticate as first employee
        self.client.force_authenticate(user=self.employee_user)
        
        # Try to download other employee's document
        response = self.client.get(
            f'/api/employees/{other_employee.id}/documents/{document.id}/download/'
        )
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
