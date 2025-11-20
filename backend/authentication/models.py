from django.db import models
from django.contrib.auth.models import User, Group
from django.utils import timezone
from datetime import timedelta
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
        ('EMPLOYEE_CREATED', 'Employee Created'),
        ('ACCOUNT_CREATED', 'Account Created'),
        ('EMAIL_SENT', 'Email Sent'),
        ('EMAIL_FAILED', 'Email Failed'),
        ('AUTH_ATTEMPT', 'Authentication Attempt'),
        ('AUTH_SUCCESS', 'Authentication Success'),
        ('AUTH_FAILED', 'Authentication Failed'),
        ('ACCOUNT_ACTIVATED', 'Account Activated'),
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


class PhoneAuthAttempt(models.Model):
    """
    Track phone authentication attempts for security.
    """
    email = models.EmailField(max_length=100)
    phone_number = models.CharField(max_length=20)
    attempt_time = models.DateTimeField(auto_now_add=True)
    success = models.BooleanField(default=False)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    def __str__(self):
        status = "Success" if self.success else "Failed"
        return f"{self.email} - {status} - {self.attempt_time}"
    
    class Meta:
        verbose_name = "Phone Auth Attempt"
        verbose_name_plural = "Phone Auth Attempts"
        ordering = ['-attempt_time']
        indexes = [
            models.Index(fields=['email', '-attempt_time']),
        ]


class AccountSetupToken(models.Model):
    """
    Temporary tokens for account setup flow with step tracking for resumption.
    """
    # Flow steps
    STEP_PHONE_AUTH = 'phone_auth'
    STEP_USERNAME_GENERATION = 'username_generation'
    STEP_PASSWORD_SETUP = 'password_setup'
    STEP_COMPLETED = 'completed'
    
    STEP_CHOICES = [
        (STEP_PHONE_AUTH, 'Phone Authentication'),
        (STEP_USERNAME_GENERATION, 'Username Generation'),
        (STEP_PASSWORD_SETUP, 'Password Setup'),
        (STEP_COMPLETED, 'Completed'),
    ]
    
    employee = models.ForeignKey(
        'employee_management.Employee',
        on_delete=models.CASCADE,
        related_name='setup_tokens'
    )
    token = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    
    # State tracking fields
    current_step = models.CharField(
        max_length=50,
        choices=STEP_CHOICES,
        default=STEP_PHONE_AUTH,
        help_text="Current step in the activation flow"
    )
    phone_auth_completed = models.BooleanField(
        default=False,
        help_text="Whether phone authentication step is completed"
    )
    phone_auth_completed_at = models.DateTimeField(null=True, blank=True)
    
    username_generation_completed = models.BooleanField(
        default=False,
        help_text="Whether username generation step is completed"
    )
    username_generation_completed_at = models.DateTimeField(null=True, blank=True)
    generated_username = models.CharField(
        max_length=150,
        blank=True,
        help_text="Username generated during the flow"
    )
    
    password_setup_completed = models.BooleanField(
        default=False,
        help_text="Whether password setup step is completed"
    )
    password_setup_completed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        status = "Used" if self.used else "Active" if self.expires_at > timezone.now() else "Expired"
        return f"{self.employee.firstName} {self.employee.lastName} - {status} - Step: {self.current_step}"
    
    def save(self, *args, **kwargs):
        # Set expiration to 1 hour from creation if not set
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=1)
        super().save(*args, **kwargs)
    
    def is_valid(self):
        """Check if token is valid (not used and not expired)"""
        return not self.used and self.expires_at > timezone.now()
    
    def complete_phone_auth(self):
        """Mark phone authentication step as completed"""
        self.phone_auth_completed = True
        self.phone_auth_completed_at = timezone.now()
        self.current_step = self.STEP_USERNAME_GENERATION
        self.save()
    
    def complete_username_generation(self, username):
        """Mark username generation step as completed"""
        self.username_generation_completed = True
        self.username_generation_completed_at = timezone.now()
        self.generated_username = username
        self.current_step = self.STEP_PASSWORD_SETUP
        self.save()
    
    def complete_password_setup(self):
        """Mark password setup step as completed"""
        self.password_setup_completed = True
        self.password_setup_completed_at = timezone.now()
        self.current_step = self.STEP_COMPLETED
        self.used = True
        self.used_at = timezone.now()
        self.save()
    
    def get_next_step(self):
        """
        Determine the next step in the flow based on completion status.
        Allows resumption from the last completed step.
        """
        if not self.phone_auth_completed:
            return self.STEP_PHONE_AUTH
        elif not self.username_generation_completed:
            return self.STEP_USERNAME_GENERATION
        elif not self.password_setup_completed:
            return self.STEP_PASSWORD_SETUP
        else:
            return self.STEP_COMPLETED
    
    def can_resume(self):
        """Check if the flow can be resumed (token is valid and not completed)"""
        return self.is_valid() and not self.used
    
    class Meta:
        verbose_name = "Account Setup Token"
        verbose_name_plural = "Account Setup Tokens"
        ordering = ['-created_at']
