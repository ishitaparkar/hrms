from django.db import models
from django.contrib.auth.models import User
from employee_management.models import Employee
from decimal import Decimal


class AttendanceRecord(models.Model):
    """
    Stores attendance records for employees including check-in/out times and status.
    """
    STATUS_CHOICES = [
        ('Present', 'Present'),
        ('Absent', 'Absent'),
        ('Late', 'Late'),
        ('Half Day', 'Half Day'),
    ]
    
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    date = models.DateField(db_index=True)
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    
    # Geolocation Data
    check_in_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    check_in_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    check_in_address = models.TextField(null=True, blank=True, help_text="Human readable address")
    
    check_out_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    check_out_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    check_out_address = models.TextField(null=True, blank=True, help_text="Human readable address")
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='Absent'
    )
    work_hours = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=Decimal('0.00')
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Attendance Record"
        verbose_name_plural = "Attendance Records"
        ordering = ['-date']
        unique_together = ['employee', 'date']
        indexes = [
            models.Index(fields=['employee', 'date']),
            models.Index(fields=['date']),
        ]
    
    def __str__(self):
        return f"{self.employee.firstName} {self.employee.lastName} - {self.date} ({self.status})"


class AttendanceBreak(models.Model):
    """
    Stores break records linked to a specific attendance record.
    """
    attendance_record = models.ForeignKey(
        AttendanceRecord,
        on_delete=models.CASCADE,
        related_name='breaks'
    )
    break_start = models.TimeField()
    break_end = models.TimeField(null=True, blank=True)
    duration = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Duration in hours"
    )
    
    class Meta:
        verbose_name = "Attendance Break"
        verbose_name_plural = "Attendance Breaks"
        ordering = ['break_start']

    def __str__(self):
        return f"Break for {self.attendance_record} at {self.break_start}"
