from rest_framework import serializers
from .models import AttendanceRecord, AttendanceBreak
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
            'check_out', 'status', 'work_hours', 'notes',
            'check_in_latitude', 'check_in_longitude', 'check_out_latitude', 'check_out_longitude'
        ]
        read_only_fields = ['id']
    
    def get_employee_name(self, obj):
        """
        Get the full name of the employee.
        """
        return f"{obj.employee.firstName} {obj.employee.lastName}"

class AttendanceBreakSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceBreak
        fields = ['id', 'break_start', 'break_end', 'duration']

class AttendanceRecordSerializer(serializers.ModelSerializer):
    """
    Serializer for AttendanceRecord model with formatted date and time fields.
    """
    employee_name = serializers.SerializerMethodField()
    breaks = AttendanceBreakSerializer(many=True, read_only=True)
    is_on_break = serializers.SerializerMethodField()
    
    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'employee', 'employee_name', 'date', 'check_in', 
            'check_out', 'status', 'work_hours', 'notes',
            'check_in_latitude', 'check_in_longitude', 'check_in_address',
            'check_out_latitude', 'check_out_longitude', 'check_out_address',
            'breaks', 'is_on_break'
        ]
        read_only_fields = ['id']
    
    def get_employee_name(self, obj):
        return f"{obj.employee.firstName} {obj.employee.lastName}"

    def get_is_on_break(self, obj):
        # Check if there is a break with no end time
        return obj.breaks.filter(break_end__isnull=True).exists()



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
