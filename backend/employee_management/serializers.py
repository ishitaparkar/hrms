from rest_framework import serializers
from .models import Employee, EmployeeDocument
from authentication.services import AccountCreationService
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth.models import User
from authentication.validators import validate_email_format, validate_phone_number


class EmployeeSerializer(serializers.ModelSerializer):
    """
    Serializer for Employee model with permission metadata and account creation.
    """
    # Add read-only fields for permission metadata
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    
    # Add fields for user account information
    has_user_account = serializers.SerializerMethodField()
    username = serializers.SerializerMethodField()
    
    class Meta:
        model = Employee
        # '__all__' includes profile_picture automatically
        fields = '__all__'
    
    def validate_personalEmail(self, value):
        """
        Validate personal email format.
        """
        try:
            validate_email_format(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e.message))
        return value
    
    def validate_mobileNumber(self, value):
        """
        Validate mobile number format with country code.
        """
        try:
            validate_phone_number(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e.message))
        return value
    
    def get_can_edit(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return self.context.get('can_manage', False)
    
    def get_can_delete(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return self.context.get('can_manage', False)
    
    def get_has_user_account(self, obj):
        return hasattr(obj, 'user_profile') and obj.user_profile is not None and obj.user_profile.user is not None
    
    def get_username(self, obj):
        if hasattr(obj, 'user_profile') and obj.user_profile and obj.user_profile.user:
            return obj.user_profile.user.username
        return None
    
    def create(self, validated_data):
        """
        Override create to automatically create a user account for the employee.
        """
        # Create the employee record first
        employee = super().create(validated_data)
        
        # Attempt to create user account
        request = self.context.get('request')
        user_account_created = False
        username = None
        temporary_password = None
        error_message = None
        
        try:
            # For the new phone-based authentication flow, we only send welcome email
            AccountCreationService.send_welcome_email_only(employee, request)
            user_account_created = True
            username = employee.personalEmail
        except Exception as e:
            error_message = f"Welcome email failed: {str(e)}"
        
        employee._account_creation_result = {
            'user_account_created': user_account_created,
            'username': username,
            'temporary_password': temporary_password,
            'error_message': error_message
        }
        
        return employee
    
    def to_representation(self, instance):
        """
        Add permission metadata to the serialized representation.
        """
        representation = super().to_representation(instance)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            representation['_permissions'] = {
                'can_edit': self.get_can_edit(instance),
                'can_delete': self.get_can_delete(instance),
                'user_roles': self.context.get('user_roles', [])
            }
        return representation


class EmployeeDocumentSerializer(serializers.ModelSerializer):
    """
    Serializer for EmployeeDocument model with file validation and metadata.
    """
    uploaded_by_name = serializers.SerializerMethodField()
    download_url = serializers.SerializerMethodField()
    
    class Meta:
        model = EmployeeDocument
        fields = [
            'id', 'employee', 'name', 'category', 'file', 'file_type', 
            'file_size', 'upload_date', 'status', 'uploaded_by', 
            'uploaded_by_name', 'download_url'
        ]
        read_only_fields = ['id', 'upload_date', 'uploaded_by', 'file_size', 'file_type']
    
    def get_uploaded_by_name(self, obj):
        if obj.uploaded_by:
            return f"{obj.uploaded_by.first_name} {obj.uploaded_by.last_name}".strip() or obj.uploaded_by.username
        return None
    
    def get_download_url(self, obj):
        request = self.context.get('request')
        if request and obj.file:
            return request.build_absolute_uri(
                f'/api/employees/{obj.employee.id}/documents/{obj.id}/download/'
            )
        return None
    
    def validate_file(self, value):
        if value.size > EmployeeDocument.MAX_FILE_SIZE:
            raise serializers.ValidationError(
                f"File size exceeds maximum allowed size of {EmployeeDocument.MAX_FILE_SIZE / (1024 * 1024)}MB"
            )
        
        file_extension = value.name.split('.')[-1].lower()
        if file_extension not in EmployeeDocument.ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(
                f"File type '.{file_extension}' is not allowed. Allowed types: {', '.join(EmployeeDocument.ALLOWED_EXTENSIONS)}"
            )
        return value
    
    def create(self, validated_data):
        file = validated_data.get('file')
        if file:
            validated_data['file_size'] = file.size
            validated_data['file_type'] = file.name.split('.')[-1].lower()
        
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['uploaded_by'] = request.user
        
        return super().create(validated_data)


class TeamMemberSerializer(serializers.ModelSerializer):
    """
    Serializer for team member information with contact details.
    Used for My Team page to display manager and team members.
    """
    profile_image = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Employee
        fields = [
            'id', 'firstName', 'lastName', 'full_name', 'designation', 
            'personalEmail', 'mobileNumber', 'department', 'profile_image'
        ]
    
    def get_profile_image(self, obj):
        """
        Get profile image URL.
        """
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None
    
    def get_full_name(self, obj):
        return f"{obj.firstName} {obj.lastName}"