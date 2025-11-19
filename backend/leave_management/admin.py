from django.contrib import admin
from .models import LeaveRequest, LeaveBalance, Holiday

# Register your models here.
@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'employee', 'leave_type', 'start_date', 'end_date', 'status']
    list_filter = ['status', 'leave_type', 'start_date']
    search_fields = ['employee__firstName', 'employee__lastName', 'reason']
    date_hierarchy = 'start_date'


@admin.register(LeaveBalance)
class LeaveBalanceAdmin(admin.ModelAdmin):
    list_display = ['id', 'employee', 'leave_type', 'total', 'used', 'get_remaining']
    list_filter = ['leave_type']
    search_fields = ['employee__firstName', 'employee__lastName']
    
    def get_remaining(self, obj):
        return obj.remaining
    get_remaining.short_description = 'Remaining'


@admin.register(Holiday)
class HolidayAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'date', 'description']
    list_filter = ['date']
    search_fields = ['name', 'description']
    date_hierarchy = 'date'
