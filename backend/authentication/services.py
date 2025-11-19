"""
Service layer for account creation and management.
"""
import secrets
import string
from django.contrib.auth.models import User
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from django.db import transaction
from django.template.loader import render_to_string
from .models import UserProfile
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
        
        # Construct the portal URL
        portal_url = getattr(settings, 'PORTAL_URL', 'http://localhost:3000')
        
        # Prepare context for email templates
        context = {
            'organization_name': organization_name,
            'employee_first_name': employee.firstName,
            'employee_last_name': employee.lastName,
            'employee_id': employee.employeeId,
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
