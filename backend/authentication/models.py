from django.db import models
from django.contrib.auth.models import User, Group
from employee_management.models import Employee


class UserProfile(models.Model):
    """
    Extends Django's User model with HRMS-specific fields and links to Employee model.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    employee = models.OneToOneField(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='user_profile')
    department = models.CharField(max_length=100, blank=True)
    phone_number = models.CharField(max_length=15, blank=True)
    password_changed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.department}"

    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"


class RoleAssignment(models.Model):
    """
    Tracks role assignments with metadata for auditing and temporary assignments.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='role_assignments')
    role = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='role_assignments')
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='assigned_roles')
    assigned_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.role.name} ({'Active' if self.is_active else 'Inactive'})"

    class Meta:
        verbose_name = "Role Assignment"
        verbose_name_plural = "Role Assignments"
        ordering = ['-assigned_at']


class UserPreferences(models.Model):
    """
    Stores user preferences for notifications and UI settings.
    """
    THEME_CHOICES = [
        ('light', 'Light'),
        ('dark', 'Dark'),
        ('system', 'System Default'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='preferences')
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    push_notifications = models.BooleanField(default=True)
    theme = models.CharField(max_length=20, choices=THEME_CHOICES, default='system')
    language = models.CharField(max_length=10, default='en')
    timezone = models.CharField(max_length=50, default='UTC')
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - Preferences"

    class Meta:
        verbose_name = "User Preferences"
        verbose_name_plural = "User Preferences"


class AuditLog(models.Model):
    """
    Records all permission and role changes for security compliance.
    """
    ACTION_CHOICES = [
        ('ROLE_ASSIGNED', 'Role Assigned'),
        ('ROLE_REVOKED', 'Role Revoked'),
        ('PERMISSION_CHANGED', 'Permission Changed'),
        ('ACCESS_DENIED', 'Access Denied'),
    ]
    
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='audit_actions')
    target_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='audit_targets')
    resource_type = models.CharField(max_length=100)
    resource_id = models.IntegerField(null=True, blank=True)
    details = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} - {self.actor} - {self.timestamp}"

    class Meta:
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"
        ordering = ['-timestamp']
