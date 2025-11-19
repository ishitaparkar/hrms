from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from datetime import datetime, timedelta
from decimal import Decimal
from calendar import monthrange

from .models import AttendanceRecord
from .serializers import (
    AttendanceRecordSerializer,
    AttendanceSummarySerializer,
    MyAttendanceResponseSerializer
)
from employee_management.models import Employee
from authentication.models import UserProfile


class MyAttendanceView(APIView):
    """
    API endpoint for employees to view their own attendance records.
    GET /api/attendance/my-attendance/?month=2025-11
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Get attendance records and summary for the authenticated user.
        Accepts optional 'month' query parameter in format YYYY-MM.
        Defaults to current month if not provided.
        """
        # Get the employee associated with the current user
        try:
            user_profile = UserProfile.objects.get(user=request.user)
            employee = user_profile.employee
            
            if not employee:
                return Response(
                    {'error': 'No employee record found for this user'},
                    status=status.HTTP_404_NOT_FOUND
                )
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'User profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Parse month parameter or use current month
        month_param = request.query_params.get('month')
        
        if month_param:
            try:
                # Parse YYYY-MM format
                year, month = map(int, month_param.split('-'))
                target_date = datetime(year, month, 1)
            except (ValueError, AttributeError):
                return Response(
                    {'error': 'Invalid month format. Use YYYY-MM (e.g., 2025-11)'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # Use current month
            target_date = datetime.now()
        
        # Calculate date range for the month
        year = target_date.year
        month = target_date.month
        first_day = datetime(year, month, 1).date()
        last_day_num = monthrange(year, month)[1]
        last_day = datetime(year, month, last_day_num).date()
        
        # Fetch attendance records for the month
        records = AttendanceRecord.objects.filter(
            employee=employee,
            date__gte=first_day,
            date__lte=last_day
        ).order_by('-date')
        
        # Calculate attendance summary
        summary = self._calculate_attendance_summary(records, year, month)
        
        # Serialize the data
        records_serializer = AttendanceRecordSerializer(records, many=True)
        
        response_data = {
            'summary': summary,
            'records': records_serializer.data
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
    
    def _calculate_attendance_summary(self, records, year, month):
        """
        Calculate attendance summary statistics for the given records.
        
        Args:
            records: QuerySet of AttendanceRecord objects
            year: Year of the month
            month: Month number (1-12)
        
        Returns:
            Dictionary with summary statistics
        """
        # Get total working days in the month (excluding weekends)
        # For simplicity, we'll count all days in the month
        # In a real system, you'd exclude weekends and holidays
        total_days = monthrange(year, month)[1]
        
        # Count attendance by status
        present_days = records.filter(status='Present').count()
        absent_days = records.filter(status='Absent').count()
        late_days = records.filter(status='Late').count()
        half_days = records.filter(status='Half Day').count()
        
        # Calculate attendance percentage
        # Consider Present, Late, and Half Day as attended
        attended_days = present_days + late_days + half_days
        
        if total_days > 0:
            attendance_percentage = Decimal(attended_days) / Decimal(total_days) * Decimal('100.00')
            attendance_percentage = round(attendance_percentage, 2)
        else:
            attendance_percentage = Decimal('0.00')
        
        return {
            'month': f"{year}-{month:02d}",
            'total_days': total_days,
            'present_days': present_days,
            'absent_days': absent_days,
            'late_days': late_days,
            'attendance_percentage': attendance_percentage
        }
