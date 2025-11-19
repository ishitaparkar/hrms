from django.contrib import admin
from .models import Employee, EmployeeDocument


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    """Admin interface for Employee model."""
    list_display = ('employeeId', 'firstName', 'lastName', 'department', 'designation', 'joiningDate')
    list_filter = ('department', 'designation', 'joiningDate')
    search_fields = ('employeeId', 'firstName', 'lastName', 'personalEmail', 'department', 'designation')
    ordering = ('employeeId',)
    
    fieldsets = (
        ('Personal Information', {
            'fields': ('firstName', 'lastName', 'employeeId', 'personalEmail', 'mobileNumber')
        }),
        ('Employment Details', {
            'fields': ('department', 'designation', 'joiningDate')
        }),
    )


@admin.register(EmployeeDocument)
class EmployeeDocumentAdmin(admin.ModelAdmin):
    """Admin interface for EmployeeDocument model."""
    list_display = ('name', 'employee', 'category', 'file_type', 'file_size_display', 'status', 'upload_date')
    list_filter = ('category', 'status', 'upload_date')
    search_fields = ('name', 'employee__firstName', 'employee__lastName', 'employee__employeeId')
    ordering = ('-upload_date',)
    readonly_fields = ('upload_date', 'file_size', 'file_type', 'uploaded_by')
    
    fieldsets = (
        ('Document Information', {
            'fields': ('employee', 'name', 'category', 'file', 'status')
        }),
        ('Metadata', {
            'fields': ('file_type', 'file_size', 'upload_date', 'uploaded_by'),
            'classes': ('collapse',)
        }),
    )
    
    def file_size_display(self, obj):
        """Display file size in human-readable format."""
        size = obj.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.2f} {unit}"
            size /= 1024.0
        return f"{size:.2f} TB"
    file_size_display.short_description = 'File Size'
