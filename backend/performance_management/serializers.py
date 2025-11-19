from rest_framework import serializers
from .models import Appraisal, Goal, Achievement, Training


class AppraisalSerializer(serializers.ModelSerializer):
    """
    Serializer for Appraisal model.
    """
    reviewer_name = serializers.SerializerMethodField()
    employee_name = serializers.SerializerMethodField()

    class Meta:
        model = Appraisal
        fields = [
            'id',
            'employee',
            'employee_name',
            'rating',
            'date',
            'reviewer',
            'reviewer_name',
            'comments',
            'period_start',
            'period_end',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_reviewer_name(self, obj):
        """Return the full name of the reviewer."""
        if obj.reviewer:
            return f"{obj.reviewer.first_name} {obj.reviewer.last_name}".strip() or obj.reviewer.username
        return None

    def get_employee_name(self, obj):
        """Return the full name of the employee."""
        return f"{obj.employee.firstName} {obj.employee.lastName}"


class GoalSerializer(serializers.ModelSerializer):
    """
    Serializer for Goal model.
    """
    employee_name = serializers.SerializerMethodField()

    class Meta:
        model = Goal
        fields = [
            'id',
            'employee',
            'employee_name',
            'title',
            'description',
            'target_date',
            'completion_percentage',
            'status',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_employee_name(self, obj):
        """Return the full name of the employee."""
        return f"{obj.employee.firstName} {obj.employee.lastName}"


class AchievementSerializer(serializers.ModelSerializer):
    """
    Serializer for Achievement model.
    """
    awarded_by_name = serializers.SerializerMethodField()
    employee_name = serializers.SerializerMethodField()

    class Meta:
        model = Achievement
        fields = [
            'id',
            'employee',
            'employee_name',
            'title',
            'description',
            'date',
            'awarded_by',
            'awarded_by_name',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_awarded_by_name(self, obj):
        """Return the full name of the person who awarded."""
        if obj.awarded_by:
            return f"{obj.awarded_by.first_name} {obj.awarded_by.last_name}".strip() or obj.awarded_by.username
        return None

    def get_employee_name(self, obj):
        """Return the full name of the employee."""
        return f"{obj.employee.firstName} {obj.employee.lastName}"


class TrainingSerializer(serializers.ModelSerializer):
    """
    Serializer for Training model.
    """
    employee_name = serializers.SerializerMethodField()

    class Meta:
        model = Training
        fields = [
            'id',
            'employee',
            'employee_name',
            'course_name',
            'description',
            'completion_date',
            'certificate_issued',
            'certificate_url',
            'provider',
            'duration_hours',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_employee_name(self, obj):
        """Return the full name of the employee."""
        return f"{obj.employee.firstName} {obj.employee.lastName}"


class MyPerformanceSerializer(serializers.Serializer):
    """
    Serializer for aggregated performance data.
    """
    appraisals = AppraisalSerializer(many=True, read_only=True)
    goals = GoalSerializer(many=True, read_only=True)
    achievements = AchievementSerializer(many=True, read_only=True)
    trainings = TrainingSerializer(many=True, read_only=True)
