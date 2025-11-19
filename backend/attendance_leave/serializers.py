from rest_framework import serializers
from .models import AttendanceRecord
from employee_management.models import Employee


class AttendanceRecordSerializer(serializers.ModelSerializer):
    """
    Serializer for AttendanceRecord model with formatted date and time fields.
    """
    employee_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'employee', 'employee_name', 'date', 'check_in', 
            'check_out', 'status', 'work_hours', 'notes'
        ]
        read_only_fields = ['id']
    
    def get_employee_name(self, obj):
        """
        Get the full name of the employee.
        """
        return f"{obj.employee.firstName} {obj.employee.lastName}"


class AttendanceSummarySerializer(serializers.Serializer):
    """
    Serializer for attendance summary statistics.
    """
    month = serializers.CharField()
    total_days = serializers.IntegerField()
    present_days = serializers.IntegerField()
    absent_days = serializers.IntegerField()
    late_days = serializers.IntegerField()
    attendance_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)


class MyAttendanceResponseSerializer(serializers.Serializer):
    """
    Serializer for the complete my-attendance API response.
    """
    summary = AttendanceSummarySerializer()
    records = AttendanceRecordSerializer(many=True)
