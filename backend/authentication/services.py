"""
Service layer for account creation and management.
"""
import secrets
import string
import jwt
from datetime import datetime, timedelta
from django.contrib.auth.models import User
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from django.db import transaction
from django.template.loader import render_to_string
from django.utils import timezone
from .models import UserProfile, PhoneAuthAttempt, AccountSetupToken
from employee_management.models import Employee
from .utils import ensure_role_exists, ROLE_EMPLOYEE, audit_log


class AccountCreationService:
    """
    Service for creating user accounts automatically when employees are created.
    """
    
    @staticmethod
    def generate_temporary_password(length=12):
        """
        Generate a secure temporary password using Python's secrets module.
        
        Args:
            length (int): Length of the password (default: 12)
            
        Returns:
            str: A cryptographically secure random password
            
        Example:
            >>> password = AccountCreationService.generate_temporary_password()
            >>> len(password) >= 12
            True
        """
        if length < 12:
            length = 12
        
        # Define character sets
        uppercase = string.ascii_uppercase
        lowercase = string.ascii_lowercase
        digits = string.digits
        special_chars = '!@#$%^&*'
        
        # Ensure at least one character from each set
        password = [
            secrets.choice(uppercase),
            secrets.choice(lowercase),
            secrets.choice(digits),
            secrets.choice(special_chars),
        ]
        
        # Fill the rest with random characters from all sets
        all_chars = uppercase + lowercase + digits + special_chars
        password.extend(secrets.choice(all_chars) for _ in range(length - 4))
        
        # Shuffle to avoid predictable patterns
        secrets.SystemRandom().shuffle(password)
        
        return ''.join(password)
    
    @staticmethod
    def send_welcome_email(user, employee, temporary_password):
        """
        Send welcome email with login credentials to the new employee.
        
        Uses HTML email template with plain text fallback for better presentation
        and compatibility across email clients.
        
        Args:
            user (User): The created user account
            employee (Employee): The employee record
            temporary_password (str): The temporary password
            
        Returns:
            bool: True if email sent successfully, False otherwise
            
        Raises:
            Exception: If email sending fails
        """
        organization_name = getattr(settings, 'ORGANIZATION_NAME', 'HRMS')
        subject = f'Welcome to {organization_name} Portal'
        
        # Construct the onboarding URL (phone authentication page with pre-filled email)
        base_url = getattr(settings, 'PORTAL_URL', 'http://localhost:3000')
        # Remove trailing slash if present
        base_url = base_url.rstrip('/')
        # Create onboarding URL with email parameter
        from urllib.parse import urlencode
        params = urlencode({'email': employee.personalEmail})
        portal_url = f"{base_url}/phone-auth?{params}"
        
        # Prepare context for email templates
        context = {
            'organization_name': organization_name,
            'employee_first_name': employee.firstName,
            'employee_last_name': employee.lastName,
            'employee_id': employee.employeeId,
            'employee_email': employee.personalEmail,
            'employee_phone': employee.mobileNumber,
            'username': user.email,
            'temporary_password': temporary_password,
            'portal_url': portal_url,
        }
        
        try:
            # Render both HTML and plain text versions
            html_content = render_to_string('authentication/emails/welcome_email.html', context)
            text_content = render_to_string('authentication/emails/welcome_email.txt', context)
            
            # Create email with both HTML and plain text versions
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@hrms.com'),
                to=[employee.personalEmail],
            )
            email.attach_alternative(html_content, "text/html")
            email.send(fail_silently=False)
            
            return True
        except Exception as e:
            # Log the error but don't fail the account creation
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Failed to send welcome email to {employee.personalEmail}: {str(e)}')
            raise
    
    @staticmethod
    @transaction.atomic
    def create_user_account(employee, request=None):
        """
        Create a user account for a new employee.
        
        This method:
        1. Creates a User with email as username
        2. Generates a secure temporary password
        3. Links the User to the Employee via UserProfile
        4. Assigns the default Employee role
        5. Sends welcome email with credentials
        6. Creates audit log entry
        
        Args:
            employee (Employee): The employee record to create an account for
            request (Request, optional): Django/DRF request object for audit logging
            
        Returns:
            tuple: (user, temporary_password, created)
                - user: The User object
                - temporary_password: The generated temporary password
                - created: Boolean indicating if a new user was created
                
        Raises:
            ValueError: If employee already has a user account
            Exception: If role assignment or email sending fails
            
        Example:
            >>> from employee_management.models import Employee
            >>> employee = Employee.objects.get(employeeId='EMP001')
            >>> user, temp_pass, created = AccountCreationService.create_user_account(employee)
            >>> print(f"Created account: {user.username}")
        """
        # Check if employee already has a user account
        if hasattr(employee, 'user_profile') and employee.user_profile and employee.user_profile.user:
            raise ValueError(f"Employee {employee.employeeId} already has a user account")
        
        # Check if a user with this email already exists
        if User.objects.filter(username=employee.personalEmail).exists():
            raise ValueError(f"A user account with email {employee.personalEmail} already exists")
        
        # Generate temporary password
        temporary_password = AccountCreationService.generate_temporary_password()
        
        # Create User
        user = User.objects.create_user(
            username=employee.personalEmail,
            email=employee.personalEmail,
            first_name=employee.firstName,
            last_name=employee.lastName,
            password=temporary_password
        )
        
        # Create or update UserProfile to link User and Employee
        user_profile, profile_created = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'employee': employee,
                'department': employee.department,
            }
        )
        
        if not profile_created:
            # Update existing profile
            user_profile.employee = employee
            user_profile.department = employee.department
            user_profile.save()
        
        # Assign default Employee role
        employee_role, role_created = ensure_role_exists(ROLE_EMPLOYEE)
        user.groups.add(employee_role)
        
        # Send welcome email
        email_sent = False
        email_error = None
        try:
            AccountCreationService.send_welcome_email(user, employee, temporary_password)
            email_sent = True
        except Exception as e:
            email_error = str(e)
            # Don't fail the account creation if email fails
            pass
        
        # Create audit log entry for account creation
        audit_log(
            action='ROLE_ASSIGNED',
            actor=request.user if request and hasattr(request, 'user') else None,
            request=request,
            target_user=user,
            resource_type='UserAccount',
            resource_id=user.id,
            details={
                'action_type': 'account_creation',
                'employee_id': employee.employeeId,
                'employee_name': f"{employee.firstName} {employee.lastName}",
                'username': user.username,
                'email': employee.personalEmail,
                'role_assigned': ROLE_EMPLOYEE,
                'email_sent': email_sent,
                'email_error': email_error if email_error else None,
            }
        )
        
        return user, temporary_password, True
    
    @staticmethod
    def send_welcome_email_only(employee, request=None):
        """
        Send welcome email to new employee without creating user account.
        
        This is used for the phone-based authentication flow where the user
        account is created only after the employee completes the setup process.
        
        Args:
            employee (Employee): The employee record
            request (Request, optional): Django/DRF request object for audit logging
            
        Returns:
            bool: True if email sent successfully
            
        Raises:
            Exception: If email sending fails
        """
        organization_name = getattr(settings, 'ORGANIZATION_NAME', 'HRMS')
        subject = f'Welcome to {organization_name} Portal'
        
        # Construct the onboarding URL (phone authentication page with pre-filled email)
        base_url = getattr(settings, 'PORTAL_URL', 'http://localhost:3000')
        # Remove trailing slash if present
        base_url = base_url.rstrip('/')
        # Create onboarding URL with email parameter
        from urllib.parse import urlencode
        params = urlencode({'email': employee.personalEmail})
        portal_url = f"{base_url}/phone-auth?{params}"
        
        # Prepare context for email templates
        context = {
            'organization_name': organization_name,
            'employee_first_name': employee.firstName,
            'employee_last_name': employee.lastName,
            'employee_id': employee.employeeId,
            'employee_email': employee.personalEmail,
            'employee_phone': employee.mobileNumber,
            'portal_url': portal_url,
        }
        
        try:
            # Render both HTML and plain text versions
            html_content = render_to_string('authentication/emails/welcome_email.html', context)
            text_content = render_to_string('authentication/emails/welcome_email.txt', context)
            
            # Create email with both HTML and plain text versions
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@hrms.com'),
                to=[employee.personalEmail],
            )
            email.attach_alternative(html_content, "text/html")
            email.send(fail_silently=False)
            
            # Create audit log entry for email sending
            audit_log(
                action='ROLE_ASSIGNED',
                actor=request.user if request and hasattr(request, 'user') else None,
                request=request,
                target_user=None,
                resource_type='WelcomeEmail',
                resource_id=employee.id,
                details={
                    'action_type': 'welcome_email_sent',
                    'employee_id': employee.employeeId,
                    'employee_name': f"{employee.firstName} {employee.lastName}",
                    'email': employee.personalEmail,
                    'email_sent': True,
                }
            )
            
            return True
        except Exception as e:
            # Create audit log entry for email failure
            audit_log(
                action='ROLE_ASSIGNED',
                actor=request.user if request and hasattr(request, 'user') else None,
                request=request,
                target_user=None,
                resource_type='WelcomeEmail',
                resource_id=employee.id,
                details={
                    'action_type': 'welcome_email_failed',
                    'employee_id': employee.employeeId,
                    'employee_name': f"{employee.firstName} {employee.lastName}",
                    'email': employee.personalEmail,
                    'email_sent': False,
                    'email_error': str(e),
                }
            )
            raise



class UsernameGenerationService:
    """
    Service for generating unique usernames from employee names.
    """
    
    @staticmethod
    def sanitize_name(name):
        """
        Remove special characters and normalize name for username.
        
        Args:
            name (str): Name to sanitize
        
        Returns:
            str: Sanitized name with only ASCII alphanumeric characters
        """
        if not name:
            return ""
        
        # Convert to lowercase
        name = name.lower()
        
        # Keep only ASCII alphanumeric characters (a-z, 0-9)
        sanitized = ''.join(char for char in name if char.isascii() and char.isalnum())
        
        return sanitized
    
    @staticmethod
    def generate_username(first_name, last_name):
        """
        Generate unique username from employee name.
        
        Format: firstname.lastname (lowercase)
        If exists, append numeric suffix: firstname.lastname2
        
        Args:
            first_name (str): Employee's first name
            last_name (str): Employee's last name
        
        Returns:
            str: Unique username
        """
        # Sanitize names
        first = UsernameGenerationService.sanitize_name(first_name)
        last = UsernameGenerationService.sanitize_name(last_name)
        
        # Generate base username
        base_username = f"{first}.{last}"
        
        # Check if username exists
        if not User.objects.filter(username=base_username).exists():
            return base_username
        
        # If exists, append numeric suffix
        suffix = 2
        while True:
            username = f"{base_username}{suffix}"
            if not User.objects.filter(username=username).exists():
                return username
            suffix += 1


class PasswordValidationService:
    """
    Service for validating password strength and complexity.
    """
    
    MIN_LENGTH = 8
    SPECIAL_CHARACTERS = '!@#$%^&*'
    
    @staticmethod
    def validate_password_strength(password):
        """
        Validate password meets strength requirements.
        
        Requirements:
        - Minimum 8 characters
        - At least one uppercase letter
        - At least one lowercase letter
        - At least one number
        - At least one special character (!@#$%^&*)
        
        Args:
            password (str): Password to validate
        
        Returns:
            tuple: (is_valid, list of error messages)
                - is_valid (bool): True if password meets all requirements
                - errors (list): List of error messages for failed requirements
        """
        errors = []
        
        # Check minimum length
        if len(password) < PasswordValidationService.MIN_LENGTH:
            errors.append(f"Password must be at least {PasswordValidationService.MIN_LENGTH} characters long")
        
        # Check for uppercase letter
        if not any(char.isupper() for char in password):
            errors.append("Password must contain at least one uppercase letter")
        
        # Check for lowercase letter
        if not any(char.islower() for char in password):
            errors.append("Password must contain at least one lowercase letter")
        
        # Check for digit
        if not any(char.isdigit() for char in password):
            errors.append("Password must contain at least one number")
        
        # Check for special character
        if not any(char in PasswordValidationService.SPECIAL_CHARACTERS for char in password):
            errors.append(f"Password must contain at least one special character ({PasswordValidationService.SPECIAL_CHARACTERS})")
        
        is_valid = len(errors) == 0
        return is_valid, errors


class PhoneAuthenticationService:
    """
    Service for phone-based authentication during employee onboarding.
    """
    
    MAX_FAILED_ATTEMPTS = 3
    TOKEN_EXPIRY_HOURS = 1
    
    @staticmethod
    def verify_phone_number(email, phone_number, request=None):
        """
        Verify phone number matches employee record.
        
        Args:
            email (str): Employee's email address
            phone_number (str): Phone number to verify (with country code)
            request (Request, optional): Django/DRF request object for audit logging
        
        Returns:
            tuple: (success, employee, error_message)
                - success (bool): True if verification succeeded
                - employee (Employee or None): Employee object if found
                - error_message (str): Error message if verification failed
        """
        # Extract IP address and user agent from request
        ip_address = None
        user_agent = ''
        if request:
            from .permissions import get_client_ip
            ip_address = get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # Check if account is locked due to too many failed attempts
        recent_attempts = PhoneAuthAttempt.objects.filter(
            email=email,
            success=False,
            attempt_time__gte=timezone.now() - timedelta(hours=1)
        ).count()
        
        if recent_attempts >= PhoneAuthenticationService.MAX_FAILED_ATTEMPTS:
            # Log the locked attempt
            PhoneAuthAttempt.objects.create(
                email=email,
                phone_number=phone_number,
                success=False,
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            # Create audit log for locked account
            audit_log(
                action='ACCESS_DENIED',
                actor=None,
                request=request,
                target_user=None,
                resource_type='PhoneAuthentication',
                resource_id=None,
                details={
                    'email': email,
                    'reason': 'Account locked due to multiple failed attempts',
                    'failed_attempts': recent_attempts,
                }
            )
            
            return False, None, "Account temporarily locked due to multiple failed attempts. Please contact HR."
        
        # Look up employee by email
        try:
            employee = Employee.objects.get(personalEmail=email)
        except Employee.DoesNotExist:
            # Log failed attempt
            PhoneAuthAttempt.objects.create(
                email=email,
                phone_number=phone_number,
                success=False,
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            # Create audit log for failed authentication
            audit_log(
                action='ACCESS_DENIED',
                actor=None,
                request=request,
                target_user=None,
                resource_type='PhoneAuthentication',
                resource_id=None,
                details={
                    'email': email,
                    'reason': 'Email not found',
                }
            )
            
            return False, None, "No employee found with this email address"
        
        # Verify phone number matches
        if employee.mobileNumber != phone_number:
            # Log failed attempt
            PhoneAuthAttempt.objects.create(
                email=email,
                phone_number=phone_number,
                success=False,
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            # Create audit log for failed authentication
            audit_log(
                action='ACCESS_DENIED',
                actor=None,
                request=request,
                target_user=None,
                resource_type='PhoneAuthentication',
                resource_id=None,
                details={
                    'email': email,
                    'employee_id': employee.employeeId,
                    'reason': 'Phone number mismatch',
                }
            )
            
            attempts_remaining = PhoneAuthenticationService.MAX_FAILED_ATTEMPTS - (recent_attempts + 1)
            return False, None, f"Phone number does not match our records. {attempts_remaining} attempts remaining."
        
        # Success - log successful attempt
        PhoneAuthAttempt.objects.create(
            email=email,
            phone_number=phone_number,
            success=True,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # Create audit log for successful authentication
        audit_log(
            action='ROLE_ASSIGNED',  # Using existing action type
            actor=None,
            request=request,
            target_user=None,
            resource_type='PhoneAuthentication',
            resource_id=employee.id,
            details={
                'action_type': 'phone_authentication_success',
                'email': email,
                'employee_id': employee.employeeId,
                'employee_name': f"{employee.firstName} {employee.lastName}",
            }
        )
        
        return True, employee, ""
    
    @staticmethod
    def generate_auth_token(employee):
        """
        Generate temporary authentication token for account setup.
        
        Args:
            employee (Employee): Employee instance
        
        Returns:
            str: Temporary JWT token valid for 1 hour
        """
        # Generate a unique token string
        token_string = secrets.token_urlsafe(32)
        
        # Create AccountSetupToken record
        expires_at = timezone.now() + timedelta(hours=PhoneAuthenticationService.TOKEN_EXPIRY_HOURS)
        setup_token = AccountSetupToken.objects.create(
            employee=employee,
            token=token_string,
            expires_at=expires_at
        )
        
        # Generate JWT token with employee information
        secret_key = getattr(settings, 'SECRET_KEY')
        payload = {
            'employee_id': employee.id,
            'employee_email': employee.personalEmail,
            'token_id': setup_token.id,
            'exp': expires_at,
            'iat': timezone.now()
        }
        
        jwt_token = jwt.encode(payload, secret_key, algorithm='HS256')
        
        return jwt_token
    
    @staticmethod
    def increment_failed_attempts(email):
        """
        Increment failed authentication attempts counter.
        
        Args:
            email (str): Employee's email address
        
        Returns:
            int: Current failed attempts count in the last hour
        """
        # Count failed attempts in the last hour
        failed_count = PhoneAuthAttempt.objects.filter(
            email=email,
            success=False,
            attempt_time__gte=timezone.now() - timedelta(hours=1)
        ).count()
        
        return failed_count
