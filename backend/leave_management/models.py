from django.db import models
from django.core.exceptions import ValidationError
# Import the Employee model from your other app
from employee_management.models import Employee 


class LeaveBalance(models.Model):
    """
    Stores leave balance information for each employee by leave type.
    """
    LEAVE_TYPE_CHOICES = [
        ('Casual', 'Casual Leave'),
        ('Sick', 'Sick Leave'),
        ('Vacation', 'Vacation Leave'),
    ]
    
    employee = models.ForeignKey(
        Employee, 
        on_delete=models.CASCADE, 
        related_name='leave_balances'
    )
    leave_type = models.CharField(
        max_length=50, 
        choices=LEAVE_TYPE_CHOICES
    )
    total = models.IntegerField(default=0, help_text="Total leave days allocated")
    used = models.IntegerField(default=0, help_text="Leave days used")
    
    class Meta:
        unique_together = ['employee', 'leave_type']
        verbose_name = "Leave Balance"
        verbose_name_plural = "Leave Balances"
    
    @property
    def remaining(self):
        """Calculate remaining leave days"""
        return max(0, self.total - self.used)
    
    def __str__(self):
        return f"{self.employee.firstName} {self.employee.lastName} - {self.leave_type}: {self.remaining} remaining"


class Holiday(models.Model):
    """
    Stores company holidays.
    """
    name = models.CharField(max_length=255)
    date = models.DateField()
    description = models.TextField(blank=True)
    
    class Meta:
        ordering = ['date']
        verbose_name = "Holiday"
        verbose_name_plural = "Holidays"
    
    def __str__(self):
        return f"{self.name} - {self.date}"


class LeaveRequest(models.Model):
    # A ForeignKey creates a relationship. Each leave request belongs to one employee.
    # on_delete=models.CASCADE means if an employee is deleted, their leave requests are also deleted.
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)

    start_date = models.DateField()
    end_date = models.DateField()
    leave_type = models.CharField(max_length=50) # e.g., 'Sick Leave', 'Casual Leave'
    
    # We'll use choices to limit the status to specific options.
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Denied', 'Denied'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    
    reason = models.TextField(blank=True) # The reason can be optional

    def __str__(self):
        return f"{self.employee.firstName}'s {self.leave_type} request"

    class Meta:
        permissions = [
            ("view_all_leaves", "Can view all leave requests"),
            ("view_department_leaves", "Can view department leave requests"),
            ("approve_leaves", "Can approve leave requests"),
            ("manage_own_leaves", "Can manage own leave requests"),
        ]