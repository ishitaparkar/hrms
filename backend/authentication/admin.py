from django.contrib import admin
from .models import UserProfile, UserPreferences, RoleAssignment, AuditLog, PhoneAuthAttempt, AccountSetupToken


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'employee', 'department', 'phone_number', 'created_at')
    search_fields = ('user__username', 'user__email', 'department')
    list_filter = ('department', 'created_at')
    raw_id_fields = ('user', 'employee')


@admin.register(UserPreferences)
class UserPreferencesAdmin(admin.ModelAdmin):
    list_display = ('user', 'theme', 'email_notifications', 'sms_notifications', 'push_notifications', 'updated_at')
    search_fields = ('user__username', 'user__email')
    list_filter = ('theme', 'email_notifications', 'sms_notifications', 'push_notifications')
    raw_id_fields = ('user',)


@admin.register(RoleAssignment)
class RoleAssignmentAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'assigned_by', 'assigned_at', 'expires_at', 'is_active')
    search_fields = ('user__username', 'role__name')
    list_filter = ('is_active', 'assigned_at', 'expires_at')
    raw_id_fields = ('user', 'assigned_by')
    date_hierarchy = 'assigned_at'


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'actor', 'target_user', 'resource_type', 'timestamp', 'ip_address')
    search_fields = ('actor__username', 'target_user__username', 'resource_type')
    list_filter = ('action', 'timestamp')
    readonly_fields = ('action', 'actor', 'target_user', 'resource_type', 'resource_id', 'details', 'ip_address', 'timestamp')
    date_hierarchy = 'timestamp'
    
    def has_add_permission(self, request):
        # Prevent manual creation of audit logs
        return False
    
    def has_delete_permission(self, request, obj=None):
        # Prevent deletion of audit logs
        return False


@admin.register(PhoneAuthAttempt)
class PhoneAuthAttemptAdmin(admin.ModelAdmin):
    list_display = ('email', 'phone_number', 'success', 'attempt_time', 'ip_address')
    search_fields = ('email', 'phone_number', 'ip_address')
    list_filter = ('success', 'attempt_time')
    readonly_fields = ('email', 'phone_number', 'attempt_time', 'success', 'ip_address', 'user_agent')
    date_hierarchy = 'attempt_time'
    
    def has_add_permission(self, request):
        # Prevent manual creation of auth attempts
        return False
    
    def has_delete_permission(self, request, obj=None):
        # Allow deletion for cleanup purposes
        return True


@admin.register(AccountSetupToken)
class AccountSetupTokenAdmin(admin.ModelAdmin):
    list_display = ('employee', 'created_at', 'expires_at', 'used', 'used_at')
    search_fields = ('employee__firstName', 'employee__lastName', 'employee__personalEmail', 'token')
    list_filter = ('used', 'created_at', 'expires_at')
    readonly_fields = ('token', 'created_at', 'expires_at', 'used', 'used_at')
    raw_id_fields = ('employee',)
    date_hierarchy = 'created_at'
    
    def has_add_permission(self, request):
        # Prevent manual creation of tokens
        return False
