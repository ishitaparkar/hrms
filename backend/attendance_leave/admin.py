from django.contrib import admin
from .models import AttendanceRecord


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    """
    Admin interface for AttendanceRecord model.
    """
    list_display = ['employee', 'date', 'check_in', 'check_out', 'status', 'work_hours']
    list_filter = ['status', 'date', 'employee__department']
    search_fields = ['employee__firstName', 'employee__lastName', 'employee__employeeId']
    date_hierarchy = 'date'
    ordering = ['-date']
    
    fieldsets = (
        ('Employee Information', {
            'fields': ('employee',)
        }),
        ('Attendance Details', {
            'fields': ('date', 'check_in', 'check_out', 'status', 'work_hours')
        }),
        ('Additional Information', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
