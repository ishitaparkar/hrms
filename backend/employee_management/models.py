from django.db import models
from django.contrib.auth.models import User
from django.core.validators import FileExtensionValidator
from authentication.validators import validate_email_format, validate_phone_number

class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    parent_department = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='sub_departments')
    head_of_department = models.ForeignKey('Employee', null=True, blank=True, on_delete=models.SET_NULL, related_name='managed_department')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Designation(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='designations')
    rank = models.IntegerField(default=0, help_text="Hierarchy rank (1 is highest)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.department.name})"

    class Meta:
        unique_together = ['title', 'department']

class Employee(models.Model):
    # ==========================================
    # 1. Basic Information
    # ==========================================
    firstName = models.CharField(max_length=100)
    lastName = models.CharField(max_length=100)
    employeeId = models.CharField(max_length=20, unique=True)
    gender = models.CharField(max_length=20, choices=[('Male', 'Male'), ('Female', 'Female'), ('Other', 'Other')], default='Male')
    dateOfBirth = models.DateField(null=True, blank=True)
    maritalStatus = models.CharField(max_length=20, default='Single')

    # ==========================================
    # 2. Contact Information
    # ==========================================
    personalEmail = models.EmailField(
        max_length=100, 
        unique=True,
        validators=[validate_email_format],
        help_text="Valid email address for account creation"
    )
    mobileNumber = models.CharField(
        max_length=20,
        validators=[validate_phone_number],
        help_text="Phone number with country code (e.g., +919876543210)"
    )
    presentAddress = models.TextField(blank=True)
    permanentAddress = models.TextField(blank=True)

    # ==========================================
    # 3. Work Information
    # ==========================================
    workEmail = models.EmailField(max_length=100, unique=True, null=True, blank=True)
    joiningDate = models.DateField()
    
    # Legacy string fields (kept for OCR/Frontend compatibility)
    department = models.CharField(max_length=100)
    designation = models.CharField(max_length=100)
    
    # New Foreign Keys (Optional for now, can migrate data later)
    department_new = models.ForeignKey(Department, null=True, blank=True, on_delete=models.SET_NULL, related_name='employees')
    designation_new = models.ForeignKey(Designation, null=True, blank=True, on_delete=models.SET_NULL, related_name='employees')
    
    employmentStatus = models.CharField(max_length=50, blank=True, default='Active')
    employeeType = models.CharField(max_length=50, default='Full Time Employees')
    schoolFaculty = models.CharField(max_length=200, blank=True)
    reportingManager = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='subordinates')
    officeLocation = models.CharField(max_length=200, blank=True)
    workPhone = models.CharField(max_length=20, blank=True)
    probationPeriod = models.IntegerField(default=0, help_text="In months", null=True, blank=True)

    # ==========================================
    # 4. Qualification & Experience
    # ==========================================
    highestQualification = models.CharField(max_length=200, blank=True)
    experienceYears = models.IntegerField(default=0, null=True, blank=True)
    previousInstitution = models.CharField(max_length=200, blank=True)

    # ==========================================
    # 5. Payroll & Banking
    # ==========================================
    bankAccountNumber = models.CharField(max_length=50, blank=True)
    ifscCode = models.CharField(max_length=20, blank=True)
    panNumber = models.CharField(max_length=20, blank=True)
    
    # ==========================================
    # 6. Personal & System
    # ==========================================
    preferredName = models.CharField(max_length=100, blank=True)
    # Renamed to match Frontend logic
    profile_picture = models.ImageField(upload_to='profile_pics/%Y/%m/', null=True, blank=True)

    # ==========================================
    # 7. Emergency Contact
    # ==========================================
    emergencyContactName = models.CharField(max_length=200, blank=True)
    emergencyContactRelationship = models.CharField(max_length=100, blank=True)
    emergencyContactPhone = models.CharField(max_length=20, blank=True)
    emergencyContactEmail = models.EmailField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.firstName} {self.lastName} ({self.employeeId})"

    class Meta:
        permissions = [
            ("view_all_employees", "Can view all employees"),
            ("view_department_employees", "Can view department employees"),
            ("manage_employees", "Can manage employees"),
        ]


class EmployeeDocument(models.Model):
    """
    Stores documents related to employees (personal, employment, certificates).
    """
    CATEGORY_CHOICES = [
        ('Personal', 'Personal'),
        ('Employment', 'Employment'),
        ('Certificates', 'Certificates'),
    ]
    
    STATUS_CHOICES = [
        ('Verified', 'Verified'),
        ('Pending', 'Pending'),
        ('Expired', 'Expired'),
    ]
    
    # Allowed file extensions for document uploads
    ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png']
    
    # Maximum file size in bytes (10MB)
    MAX_FILE_SIZE = 10 * 1024 * 1024
    
    employee = models.ForeignKey(
        Employee, 
        on_delete=models.CASCADE, 
        related_name='documents'
    )
    name = models.CharField(max_length=255)
    category = models.CharField(
        max_length=50, 
        choices=CATEGORY_CHOICES,
        default='Personal'
    )
    file = models.FileField(
        upload_to='employee_documents/%Y/%m/',
        validators=[FileExtensionValidator(allowed_extensions=ALLOWED_EXTENSIONS)]
    )
    file_type = models.CharField(max_length=50)
    file_size = models.IntegerField(help_text="File size in bytes")
    upload_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES,
        default='Pending'
    )
    uploaded_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='uploaded_documents'
    )
    
    def __str__(self):
        return f"{self.name} - {self.employee.firstName} {self.employee.lastName}"
    
    class Meta:
        verbose_name = "Employee Document"
        verbose_name_plural = "Employee Documents"
        ordering = ['-upload_date']