from rest_framework import serializers
from .models import LeaveRequest, LeaveBalance, Holiday
# Import the Employee model itself to perform the database lookup
from employee_management.models import Employee
# Import the EmployeeSerializer to handle the nested display of employee details
from employee_management.serializers import EmployeeSerializer 

class LeaveRequestSerializer(serializers.ModelSerializer):
    # This field is for READING data (when you GET the list of leave requests).
    # It will display a nested object with the employee's full details.
    employee = EmployeeSerializer(read_only=True)
    
    # This field is for WRITING data (when you POST a new leave request).
    # Your React form sends this field. It is not saved directly to the database.
    employee_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = LeaveRequest
        # List all the fields that the API will interact with.
        fields = ['id', 'employee', 'employee_id', 'start_date', 'end_date', 'leave_type', 'status', 'reason']

    # This custom `create` method is the key to fixing the error.
    # It overrides Django's default behavior.
    def create(self, validated_data):
        # 1. Take the 'employee_id' out of the incoming data dictionary.
        employee_id = validated_data.pop('employee_id')
        
        # 2. Use that ID to find the actual Employee object in the database.
        try:
            employee_instance = Employee.objects.get(id=employee_id)
        except Employee.DoesNotExist:
            # If no employee with that ID is found, raise a clean validation error.
            raise serializers.ValidationError({"employee_id": "An employee with this ID does not exist."})

        # 3. Create the new LeaveRequest object.
        #    Crucially, we pass the full `employee_instance` object to the `employee` field,
        #    and the rest of the validated data (`**validated_data`) to the other fields.
        leave_request = LeaveRequest.objects.create(employee=employee_instance, **validated_data)
        return leave_request


class LeaveBalanceSerializer(serializers.ModelSerializer):
    """
    Serializer for LeaveBalance model.
    Includes calculated remaining field.
    """
    remaining = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = LeaveBalance
        fields = ['id', 'leave_type', 'total', 'used', 'remaining']


class HolidaySerializer(serializers.ModelSerializer):
    """
    Serializer for Holiday model.
    """
    class Meta:
        model = Holiday
        fields = ['id', 'name', 'date', 'description']


class MyLeaveRequestSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for leave requests in my-leave endpoint.
    Shows only essential fields without nested employee data.
    """
    days = serializers.SerializerMethodField()
    
    class Meta:
        model = LeaveRequest
        fields = ['id', 'leave_type', 'start_date', 'end_date', 'days', 'reason', 'status']
    
    def get_days(self, obj):
        """Calculate number of days in the leave request"""
        if obj.start_date and obj.end_date:
            delta = obj.end_date - obj.start_date
            return delta.days + 1  # Include both start and end dates
        return 0


class LeaveRequestCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating leave requests via the my-leave endpoint.
    Automatically associates with the authenticated user's employee profile.
    """
    class Meta:
        model = LeaveRequest
        fields = ['leave_type', 'start_date', 'end_date', 'reason']
    
    def validate(self, data):
        """
        Validate leave request dates and availability.
        """
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        leave_type = data.get('leave_type')
        
        # Validate that end_date is not before start_date
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({
                "end_date": "End date cannot be before start date."
            })
        
        # Calculate number of days
        if start_date and end_date:
            days = (end_date - start_date).days + 1
            
            # Get employee from context (set in view)
            employee = self.context.get('employee')
            if employee and leave_type:
                # Check if employee has sufficient leave balance
                try:
                    leave_balance = LeaveBalance.objects.get(
                        employee=employee,
                        leave_type=leave_type
                    )
                    if leave_balance.remaining < days:
                        raise serializers.ValidationError({
                            "leave_type": f"Insufficient leave balance. You have {leave_balance.remaining} days remaining."
                        })
                except LeaveBalance.DoesNotExist:
                    raise serializers.ValidationError({
                        "leave_type": f"No leave balance found for {leave_type}."
                    })
        
        return data
