# Backend Module Organization - Developer Guide

## Overview

This guide documents the backend module organization for the University HRMS system, focusing on the employee management and leave management modules.

## Table of Contents

- [Module Structure](#module-structure)
- [Employee Management Module](#employee-management-module)
- [Leave Management Module](#leave-management-module)
- [Migration Guide](#migration-guide)
- [Best Practices](#best-practices)
- [Testing](#testing)

---

## Module Structure

The backend follows Django's app-based architecture with dedicated modules for different functional areas.

### Directory Structure

```
backend/
├── authentication/          # User authentication and RBAC
├── employee_management/     # Employee, Department, Designation models
├── leave_management/        # Leave requests and leave types
├── attendance_leave/        # Attendance tracking
├── payroll/                # Payroll management
├── dashboard/              # Dashboard data
├── hrms_core/              # Project settings and configuration
└── manage.py
```

### Module Organization Principles

1. **Single Responsibility**: Each module handles one functional area
2. **Clear Boundaries**: Well-defined interfaces between modules
3. **Minimal Dependencies**: Modules should be as independent as possible
4. **Consistent Structure**: All modules follow the same internal structure

---

## Employee Management Module

### Purpose

The `employee_management` module handles all employee-related data and operations including employee records, departments, and designations.

### Module Structure

```
backend/employee_management/
├── __init__.py
├── admin.py                 # Django admin configuration
├── apps.py                  # App configuration
├── models.py                # Employee, Department, Designation models
├── serializers.py           # DRF serializers
├── views.py                 # API views
├── urls.py                  # URL routing
├── tests.py                 # Unit tests
└── migrations/              # Database migrations
    ├── __init__.py
    ├── 0001_initial.py
    └── 0002_alter_employee_options.py
```

### Models

#### Employee Model

```python
from django.db import models
from django.contrib.auth.models import User

class Employee(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    employee_id = models.CharField(max_length=20, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    department = models.ForeignKey('Department', on_delete=models.SET_NULL, null=True)
    designation = models.ForeignKey('Designation', on_delete=models.SET_NULL, null=True)
    joining_date = models.DateField()
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['employee_id']
        verbose_name = 'Employee'
        verbose_name_plural = 'Employees'
    
    def __str__(self):
        return f"{self.employee_id} - {self.first_name} {self.last_name}"
```

#### Department Model

```python
class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, unique=True)
    description = models.TextField(blank=True)
    head = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='headed_department')
    
    def __str__(self):
        return self.name
```

#### Designation Model

```python
class Designation(models.Model):
    title = models.CharField(max_length=100, unique=True)
    level = models.IntegerField()
    description = models.TextField(blank=True)
    
    class Meta:
        ordering = ['level']
    
    def __str__(self):
        return self.title
```

### API Endpoints

```
GET    /api/employees/              # List all employees
POST   /api/employees/              # Create new employee
GET    /api/employees/{id}/         # Get employee details
PUT    /api/employees/{id}/         # Update employee
DELETE /api/employees/{id}/         # Delete employee

GET    /api/departments/            # List all departments
POST   /api/departments/            # Create new department
GET    /api/departments/{id}/       # Get department details
PUT    /api/departments/{id}/       # Update department
DELETE /api/departments/{id}/       # Delete department

GET    /api/designations/           # List all designations
POST   /api/designations/           # Create new designation
GET    /api/designations/{id}/      # Get designation details
PUT    /api/designations/{id}/      # Update designation
DELETE /api/designations/{id}/      # Delete designation
```

### Serializers

```python
from rest_framework import serializers
from .models import Employee, Department, Designation

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

class DesignationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Designation
        fields = '__all__'

class EmployeeSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    designation_title = serializers.CharField(source='designation.title', read_only=True)
    
    class Meta:
        model = Employee
        fields = '__all__'
```

### Views

```python
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Employee, Department, Designation
from .serializers import EmployeeSerializer, DepartmentSerializer, DesignationSerializer

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]

class DesignationViewSet(viewsets.ModelViewSet):
    queryset = Designation.objects.all()
    serializer_class = DesignationSerializer
    permission_classes = [IsAuthenticated]
```

---

## Leave Management Module

### Purpose

The `leave_management` module handles leave requests, leave types, and leave balance tracking.

### Module Structure

```
backend/leave_management/
├── __init__.py
├── admin.py                 # Django admin configuration
├── apps.py                  # App configuration
├── models.py                # LeaveRequest, LeaveType models
├── serializers.py           # DRF serializers
├── views.py                 # API views
├── urls.py                  # URL routing
├── tests.py                 # Unit tests
└── migrations/              # Database migrations
    ├── __init__.py
    ├── 0001_initial.py
    └── 0002_alter_leaverequest_options.py
```

### Models

#### LeaveType Model

```python
from django.db import models

class LeaveType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, unique=True)
    description = models.TextField(blank=True)
    max_days_per_year = models.IntegerField()
    requires_approval = models.BooleanField(default=True)
    is_paid = models.BooleanField(default=True)
    
    def __str__(self):
        return self.name
```

#### LeaveRequest Model

```python
from django.db import models
from employee_management.models import Employee

class LeaveRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_requests')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='approved_leaves')
    approved_date = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Leave Request'
        verbose_name_plural = 'Leave Requests'
    
    def __str__(self):
        return f"{self.employee} - {self.leave_type} ({self.start_date} to {self.end_date})"
    
    @property
    def duration_days(self):
        return (self.end_date - self.start_date).days + 1
```

### API Endpoints

```
GET    /api/leave-requests/         # List leave requests
POST   /api/leave-requests/         # Create leave request
GET    /api/leave-requests/{id}/    # Get leave request details
PUT    /api/leave-requests/{id}/    # Update leave request
DELETE /api/leave-requests/{id}/    # Delete leave request
POST   /api/leave-requests/{id}/approve/   # Approve leave request
POST   /api/leave-requests/{id}/reject/    # Reject leave request

GET    /api/leave-types/            # List leave types
POST   /api/leave-types/            # Create leave type
GET    /api/leave-types/{id}/       # Get leave type details
PUT    /api/leave-types/{id}/       # Update leave type
DELETE /api/leave-types/{id}/       # Delete leave type
```

### Serializers

```python
from rest_framework import serializers
from .models import LeaveRequest, LeaveType
from employee_management.serializers import EmployeeSerializer

class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = '__all__'

class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    duration_days = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = LeaveRequest
        fields = '__all__'
```

---

## Migration Guide

### Importing Models

When importing models from these modules in other parts of the application:

```python
# Correct way to import
from employee_management.models import Employee, Department, Designation
from leave_management.models import LeaveRequest, LeaveType

# Example usage in another app
from django.db import models
from employee_management.models import Employee

class Payroll(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    # ... other fields
```

### Updating Existing Code

If you have existing code that imports from old locations, update the imports:

**Before:**
```python
from authentication.models import Employee
from authentication.models import LeaveRequest
```

**After:**
```python
from employee_management.models import Employee
from leave_management.models import LeaveRequest
```

### Database Migrations

After reorganizing models, you may need to create migrations:

```bash
# Create migrations for the new modules
python manage.py makemigrations employee_management
python manage.py makemigrations leave_management

# Apply migrations
python manage.py migrate
```

### URL Configuration

Update your main `urls.py` to include the new module URLs:

```python
# hrms_core/urls.py
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/', include('employee_management.urls')),
    path('api/', include('leave_management.urls')),
    # ... other URLs
]
```

---

## Best Practices

### 1. Module Independence

Keep modules as independent as possible:

```python
# Good: Use ForeignKey to reference other modules
from employee_management.models import Employee

class LeaveRequest(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)

# Avoid: Importing business logic from other modules
# Instead, use signals or service layers
```

### 2. Consistent Naming

Follow Django conventions:

- Model names: Singular, PascalCase (e.g., `Employee`, `LeaveRequest`)
- Module names: Plural, snake_case (e.g., `employee_management`, `leave_management`)
- URL patterns: Plural, kebab-case (e.g., `/api/leave-requests/`)

### 3. API Design

Use RESTful conventions:

```python
# Good: RESTful viewsets
class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer

# Good: Custom actions
@action(detail=True, methods=['post'])
def approve(self, request, pk=None):
    # Custom approval logic
    pass
```

### 4. Permissions

Always implement proper permissions:

```python
from rest_framework.permissions import IsAuthenticated
from authentication.permissions import HasPermission

class EmployeeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, HasPermission('employee_management.manage_employees')]
```

### 5. Serializer Optimization

Use `select_related` and `prefetch_related` to optimize queries:

```python
class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.select_related('department', 'designation')
    serializer_class = EmployeeSerializer
```

### 6. Error Handling

Implement proper error handling:

```python
from rest_framework.exceptions import ValidationError

class LeaveRequestViewSet(viewsets.ModelViewSet):
    def perform_create(self, serializer):
        if serializer.validated_data['end_date'] < serializer.validated_data['start_date']:
            raise ValidationError("End date must be after start date")
        serializer.save()
```

---

## Testing

### Unit Tests

Write tests for each module:

```python
# employee_management/tests.py
from django.test import TestCase
from .models import Employee, Department, Designation

class EmployeeModelTest(TestCase):
    def setUp(self):
        self.department = Department.objects.create(
            name='Engineering',
            code='ENG'
        )
        self.designation = Designation.objects.create(
            title='Developer',
            level=3
        )
    
    def test_employee_creation(self):
        employee = Employee.objects.create(
            employee_id='EMP001',
            first_name='John',
            last_name='Doe',
            email='john@example.com',
            department=self.department,
            designation=self.designation
        )
        self.assertEqual(str(employee), 'EMP001 - John Doe')
```

### API Tests

Test API endpoints:

```python
from rest_framework.test import APITestCase
from rest_framework import status

class EmployeeAPITest(APITestCase):
    def test_list_employees(self):
        response = self.client.get('/api/employees/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_create_employee(self):
        data = {
            'employee_id': 'EMP001',
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'john@example.com'
        }
        response = self.client.post('/api/employees/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
```

### Running Tests

```bash
# Run all tests
python manage.py test

# Run tests for specific module
python manage.py test employee_management
python manage.py test leave_management

# Run with coverage
coverage run --source='.' manage.py test
coverage report
```

---

## Troubleshooting

### Import Errors

**Problem:** `ImportError: cannot import name 'Employee' from 'authentication.models'`

**Solution:** Update imports to use the new module structure:
```python
from employee_management.models import Employee
```

### Migration Conflicts

**Problem:** Migration conflicts after reorganization

**Solution:**
```bash
# Reset migrations (development only!)
python manage.py migrate employee_management zero
python manage.py migrate leave_management zero

# Create fresh migrations
python manage.py makemigrations
python manage.py migrate
```

### Circular Import Issues

**Problem:** Circular imports between modules

**Solution:** Use string references in ForeignKey:
```python
class LeaveRequest(models.Model):
    employee = models.ForeignKey('employee_management.Employee', on_delete=models.CASCADE)
```

---

## Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Django Best Practices](https://django-best-practices.readthedocs.io/)
- [Two Scoops of Django](https://www.feldroy.com/books/two-scoops-of-django-3-x)

---

*Last Updated: November 2025*
