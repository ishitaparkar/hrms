"""
Serializers for authentication and role management.
"""
from rest_framework import serializers
from django.contrib.auth.models import User, Group, Permission
from .models import UserProfile, UserPreferences, RoleAssignment, AuditLog


class PermissionSerializer(serializers.ModelSerializer):
    """
    Serializer for Permission model.
    """
    class Meta:
        model = Permission
        fields = ['id', 'name', 'codename', 'content_type']


class RoleSerializer(serializers.ModelSerializer):
    """
    Serializer for Role (Group) model with permission details.
    """
    permissions = PermissionSerializer(many=True, read_only=True)
    permission_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Group
        fields = ['id', 'name', 'permissions', 'permission_count']
    
    def get_permission_count(self, obj):
        """Get the count of permissions assigned to this role."""
        return obj.permissions.count()


class RoleCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating custom roles.
    """
    permission_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="List of permission IDs to assign to this role"
    )
    
    class Meta:
        model = Group
        fields = ['id', 'name', 'permission_ids']
    
    def validate_name(self, value):
        """Validate that the role name is unique."""
        if Group.objects.filter(name=value).exists():
            raise serializers.ValidationError("A role with this name already exists.")
        return value
    
    def create(self, validated_data):
        """Create a new role with the specified permissions."""
        permission_ids = validated_data.pop('permission_ids', [])
        role = Group.objects.create(name=validated_data['name'])
        
        if permission_ids:
            permissions = Permission.objects.filter(id__in=permission_ids)
            role.permissions.set(permissions)
        
        return role


class RoleAssignmentSerializer(serializers.ModelSerializer):
    """
    Serializer for RoleAssignment model.
    """
    role_name = serializers.CharField(source='role.name', read_only=True)
    assigned_by_username = serializers.CharField(source='assigned_by.username', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    is_temporary = serializers.SerializerMethodField()
    
    class Meta:
        model = RoleAssignment
        fields = [
            'id', 'user', 'user_username', 'role', 'role_name',
            'assigned_by', 'assigned_by_username', 'assigned_at',
            'expires_at', 'is_active', 'notes', 'is_temporary'
        ]
        read_only_fields = ['id', 'assigned_at']
    
    def get_is_temporary(self, obj):
        """Check if this is a temporary role assignment."""
        return obj.expires_at is not None


class RoleAssignmentCreateSerializer(serializers.Serializer):
    """
    Serializer for creating role assignments.
    """
    role_id = serializers.IntegerField(required=True)
    expires_at = serializers.DateTimeField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, max_length=500)
    
    def validate_role_id(self, value):
        """Validate that the role exists."""
        try:
            Group.objects.get(id=value)
        except Group.DoesNotExist:
            raise serializers.ValidationError("Role with this ID does not exist.")
        return value


class RoleRevocationSerializer(serializers.Serializer):
    """
    Serializer for revoking role assignments.
    """
    role_id = serializers.IntegerField(required=True)
    
    def validate_role_id(self, value):
        """Validate that the role exists."""
        try:
            Group.objects.get(id=value)
        except Group.DoesNotExist:
            raise serializers.ValidationError("Role with this ID does not exist.")
        return value


class UserRoleSerializer(serializers.ModelSerializer):
    """
    Serializer for User with role information.
    """
    roles = serializers.SerializerMethodField()
    active_role_assignments = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'roles', 'active_role_assignments']
    
    def get_roles(self, obj):
        """Get list of role names for the user."""
        return [group.name for group in obj.groups.all()]
    
    def get_active_role_assignments(self, obj):
        """Get active role assignments with details."""
        assignments = obj.role_assignments.filter(is_active=True)
        return RoleAssignmentSerializer(assignments, many=True).data


class UserPreferencesSerializer(serializers.ModelSerializer):
    """
    Serializer for UserPreferences model.
    """
    class Meta:
        model = UserPreferences
        fields = [
            'id', 'email_notifications', 'sms_notifications',
            'push_notifications', 'theme', 'language', 'timezone', 'updated_at'
        ]
        read_only_fields = ['id', 'updated_at']
    
    def validate_theme(self, value):
        """Validate that theme is one of the allowed choices."""
        valid_themes = ['light', 'dark', 'system']
        if value not in valid_themes:
            raise serializers.ValidationError(
                f"Invalid theme. Must be one of: {', '.join(valid_themes)}"
            )
        return value
    
    def validate_language(self, value):
        """Validate language code format."""
        if not value or len(value) > 10:
            raise serializers.ValidationError("Invalid language code.")
        return value
    
    def validate_timezone(self, value):
        """Validate timezone string."""
        if not value or len(value) > 50:
            raise serializers.ValidationError("Invalid timezone.")
        return value


class AuditLogSerializer(serializers.ModelSerializer):
    """
    Serializer for AuditLog model.
    """
    actor_username = serializers.CharField(source='actor.username', read_only=True)
    target_user_username = serializers.CharField(source='target_user.username', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'action', 'actor', 'actor_username',
            'target_user', 'target_user_username',
            'resource_type', 'resource_id', 'details',
            'ip_address', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']
