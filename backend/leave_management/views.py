from rest_framework import generics
from rest_framework.exceptions import PermissionDenied, ValidationError
from .models import LeaveRequest
from .serializers import LeaveRequestSerializer
from authentication.permissions import (
    IsAuthenticated,
    IsEmployee,
    IsDepartmentHead,
    IsHRManager,
    log_access_denied
)
from authentication.utils import (
    user_has_any_role,
    get_user_department,
    has_permission,
    ROLE_SUPER_ADMIN,
    ROLE_HR_MANAGER,
    ROLE_EMPLOYEE
)


# This view will handle GET (list all) and POST (create new)
class LeaveRequestListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter leave requests based on user role:
        - Super Admin & HR Manager: All leave requests
        - Employee: Only their own leave requests
        """
        user = self.request.user
        
        # Super Admin and HR Manager can see all leave requests
        if user_has_any_role(user, [ROLE_SUPER_ADMIN, ROLE_HR_MANAGER]):
            return LeaveRequest.objects.all()
        
        # Employee can only see their own leave requests
        if hasattr(user, 'profile') and user.profile.employee:
            return LeaveRequest.objects.filter(employee=user.profile.employee)
        
        return LeaveRequest.objects.none()
    
    def perform_create(self, serializer):
        """
        Allow employees to create leave requests for themselves only.
        HR Manager and Super Admin can create for any employee.
        """
        user = self.request.user
        
        # Get employee_id from the request data (before serializer processes it)
        employee_id = self.request.data.get('employee_id')
        
        if not employee_id:
            raise ValidationError({"employee_id": "This field is required."})
        
        try:
            employee_id = int(employee_id)
        except (ValueError, TypeError):
            raise ValidationError({"employee_id": "Invalid employee ID."})
        
        # Super Admin and HR Manager can create leave requests for any employee
        if user_has_any_role(user, [ROLE_SUPER_ADMIN, ROLE_HR_MANAGER]):
            serializer.save()
            return
        
        # Department Head and Employee can only create for themselves
        if hasattr(user, 'profile') and user.profile.employee:
            user_employee_id = user.profile.employee.id
            
            if employee_id != user_employee_id:
                log_access_denied(
                    self.request,
                    resource_type='LeaveRequest',
                    required_permission='create_leave_for_others',
                    details={
                        'reason': 'Can only create leave requests for self',
                        'attempted_employee_id': employee_id,
                        'user_employee_id': user_employee_id
                    }
                )
                raise PermissionDenied("You can only create leave requests for yourself.")
        else:
            raise PermissionDenied("You must have an employee profile to create leave requests.")
        
        serializer.save()


# This view will handle GET (detail), PUT/PATCH (update), and DELETE
class LeaveRequestDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter leave requests based on user role (same as list view).
        """
        user = self.request.user
        
        # Super Admin and HR Manager can access all leave requests
        if user_has_any_role(user, [ROLE_SUPER_ADMIN, ROLE_HR_MANAGER]):
            return LeaveRequest.objects.all()
        
        # Employee can only access their own leave requests
        if hasattr(user, 'profile') and user.profile.employee:
            return LeaveRequest.objects.filter(employee=user.profile.employee)
        
        return LeaveRequest.objects.none()
    
    def perform_update(self, serializer):
        """
        Check approval permission for status changes.
        Only users with approve_leaves permission can change status.
        Employees can update their own pending requests (except status).
        """
        user = self.request.user
        leave_request = self.get_object()
        
        # Check if status is being changed
        new_status = serializer.validated_data.get('status')
        if new_status and new_status != leave_request.status:
            # Only users with approve_leaves permission can change status
            if not has_permission(user, 'approve_leaves'):
                log_access_denied(
                    self.request,
                    resource_type='LeaveRequest',
                    resource_id=leave_request.id,
                    required_permission='approve_leaves',
                    details={
                        'reason': 'Cannot change leave request status',
                        'attempted_status': new_status,
                        'current_status': leave_request.status
                    }
                )
                raise PermissionDenied("You do not have permission to approve or change leave request status.")
        
        # Employees can only update their own pending requests
        if user_has_any_role(user, [ROLE_EMPLOYEE]) and not user_has_any_role(user, [ROLE_HR_MANAGER, ROLE_SUPER_ADMIN]):
            if hasattr(user, 'profile') and user.profile.employee:
                if leave_request.employee.id != user.profile.employee.id:
                    raise PermissionDenied("You can only update your own leave requests.")
                
                # Employees cannot update non-pending requests
                if leave_request.status != 'Pending':
                    raise PermissionDenied("You cannot update a leave request that has already been processed.")
        
        serializer.save()
    
    def perform_destroy(self, instance):
        """
        Restrict leave request deletion to own requests or users with manage permission.
        Only pending requests can be deleted by employees.
        """
        user = self.request.user
        
        # Super Admin and HR Manager can delete any leave request
        if user_has_any_role(user, [ROLE_SUPER_ADMIN, ROLE_HR_MANAGER]):
            instance.delete()
            return
        
        # Employee can only delete their own pending leave requests
        if hasattr(user, 'profile') and user.profile.employee:
            if instance.employee.id == user.profile.employee.id:
                if instance.status == 'Pending':
                    instance.delete()
                    return
                else:
                    raise PermissionDenied("You can only delete pending leave requests.")
        
        log_access_denied(
            self.request,
            resource_type='LeaveRequest',
            resource_id=instance.id,
            required_permission='delete_leaverequest',
            details={'reason': 'Cannot delete this leave request'}
        )
        raise PermissionDenied("You do not have permission to delete this leave request.")



from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime, timedelta
from django.utils import timezone
from .models import LeaveBalance, Holiday
from .serializers import (
    LeaveBalanceSerializer, 
    HolidaySerializer, 
    MyLeaveRequestSerializer,
    LeaveRequestCreateSerializer
)


class MyLeaveAPIView(APIView):
    """
    GET /api/leave/my-leave/
    Returns leave balances, leave requests, and upcoming holidays for the authenticated user.
    
    POST /api/leave/my-leave/
    Creates a new leave request for the authenticated user.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Get leave information for the authenticated user.
        """
        user = request.user
        
        # Check if user has an employee profile
        if not hasattr(user, 'profile') or not user.profile.employee:
            return Response(
                {"error": "User does not have an employee profile."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        employee = user.profile.employee
        
        # Get leave balances
        leave_balances = LeaveBalance.objects.filter(employee=employee)
        balances_data = LeaveBalanceSerializer(leave_balances, many=True).data
        
        # Get leave requests
        leave_requests = LeaveRequest.objects.filter(employee=employee).order_by('-start_date')
        requests_data = MyLeaveRequestSerializer(leave_requests, many=True).data
        
        # Get upcoming holidays (current month and next month)
        today = timezone.now().date()
        end_of_next_month = (today.replace(day=1) + timedelta(days=62)).replace(day=1) - timedelta(days=1)
        holidays = Holiday.objects.filter(
            date__gte=today,
            date__lte=end_of_next_month
        )
        holidays_data = HolidaySerializer(holidays, many=True).data
        
        return Response({
            'balances': balances_data,
            'requests': requests_data,
            'holidays': holidays_data
        })
    
    def post(self, request):
        """
        Create a new leave request for the authenticated user.
        """
        user = request.user
        
        # Check if user has an employee profile
        if not hasattr(user, 'profile') or not user.profile.employee:
            return Response(
                {"error": "User does not have an employee profile."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        employee = user.profile.employee
        
        # Create serializer with employee context for validation
        serializer = LeaveRequestCreateSerializer(
            data=request.data,
            context={'employee': employee}
        )
        
        if serializer.is_valid():
            # Save the leave request with the employee
            leave_request = serializer.save(employee=employee)
            
            # Return the created leave request
            response_serializer = MyLeaveRequestSerializer(leave_request)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
