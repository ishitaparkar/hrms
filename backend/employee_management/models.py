from django.db import models
from django.contrib.auth.models import User
from django.core.validators import FileExtensionValidator

class Employee(models.Model):
    # Admin-only fields (locked)
    firstName = models.CharField(max_length=100)
    lastName = models.CharField(max_length=100)
    employeeId = models.CharField(max_length=20, unique=True)
    workEmail = models.EmailField(max_length=100, unique=True, null=True, blank=True)
    personalEmail = models.EmailField(max_length=100, unique=True)
    joiningDate = models.DateField()
    department = models.CharField(max_length=100)
    designation = models.CharField(max_length=100)
    employmentStatus = models.CharField(max_length=50, blank=True, default='Active')
    schoolFaculty = models.CharField(max_length=200, blank=True)
    reportingManager = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='subordinates')
    
    # Shared fields (admin sets, employee can edit)
    officeLocation = models.CharField(max_length=200, blank=True)
    workPhone = models.CharField(max_length=20, blank=True)
    
    # Employee-only fields
    preferredName = models.CharField(max_length=100, blank=True)
    profilePhoto = models.ImageField(upload_to='profile_photos/%Y/%m/', null=True, blank=True)
    mobileNumber = models.CharField(max_length=15)
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