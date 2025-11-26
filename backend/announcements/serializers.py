from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Announcement


class AnnouncementSerializer(serializers.ModelSerializer):
    """
    Serializer for Announcement model.
    Handles both input validation and output formatting.
    """
    author_name = serializers.SerializerMethodField()
    author_username = serializers.CharField(source='author.username', read_only=True)
    
    class Meta:
        model = Announcement
        fields = [
            'id',
            'title',
            'content',
            'author',
            'author_name',
            'author_username',
            'created_at',
            'updated_at',
            'is_active'
        ]
        read_only_fields = ['id', 'author', 'author_name', 'author_username', 'created_at', 'updated_at']
    
    def get_author_name(self, obj):
        """Get the author's full name or username"""
        return obj.get_author_name()
    
    def validate_title(self, value):
        """Validate that title is not empty or just whitespace"""
        if not value or not value.strip():
            raise serializers.ValidationError("Title cannot be empty or just whitespace.")
        return value.strip()
    
    def validate_content(self, value):
        """Validate that content is not empty or just whitespace"""
        if not value or not value.strip():
            raise serializers.ValidationError("Content cannot be empty or just whitespace.")
        return value.strip()


class AnnouncementCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating announcements.
    Author is set automatically from the request user.
    """
    class Meta:
        model = Announcement
        fields = ['title', 'content', 'is_active']
    
    def validate_title(self, value):
        """Validate that title is not empty or just whitespace"""
        if not value or not value.strip():
            raise serializers.ValidationError("Title cannot be empty or just whitespace.")
        return value.strip()
    
    def validate_content(self, value):
        """Validate that content is not empty or just whitespace"""
        if not value or not value.strip():
            raise serializers.ValidationError("Content cannot be empty or just whitespace.")
        return value.strip()


class AnnouncementUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating announcements.
    Only allows updating specific fields.
    """
    class Meta:
        model = Announcement
        fields = ['title', 'content', 'is_active']
    
    def validate_title(self, value):
        """Validate that title is not empty or just whitespace"""
        if not value or not value.strip():
            raise serializers.ValidationError("Title cannot be empty or just whitespace.")
        return value.strip()
    
    def validate_content(self, value):
        """Validate that content is not empty or just whitespace"""
        if not value or not value.strip():
            raise serializers.ValidationError("Content cannot be empty or just whitespace.")
        return value.strip()
