from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from datetime import datetime, timedelta
from decimal import Decimal
from calendar import monthrange

import requests
from .models import AttendanceRecord, AttendanceBreak
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

class AttendanceActionView(APIView):
    """
    API endpoint to handle Check-in and Check-out actions with Geolocation.
    POST /api/attendance/action/
    Body: { "action": "check_in" | "check_out", "latitude": float, "longitude": float, "notes": "string" }
    """
    permission_classes = [IsAuthenticated]


    def _get_address_from_coords(self, lat, lon):
        if not lat or not lon:
            return None
        
        try:
            # OpenStreetMap Nominatim API
            url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
            headers = {
                'User-Agent': 'HRMS_App/1.0 (contact@hrms.com)' # Required by Nominatim policy
            }
            response = requests.get(url, headers=headers, timeout=5)
            if response.status_code == 200:
                data = response.json()
                return data.get('display_name')
        except Exception as e:
            print(f"Geocoding error: {e}")
        
        return "Location captured (Address unavailable)"

    def post(self, request):
        try:
            user_profile = UserProfile.objects.get(user=request.user)
            employee = user_profile.employee
        except UserProfile.DoesNotExist:
            return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')
        notes = request.data.get('notes', '')
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        
        today = datetime.now().date()
        now_time = datetime.now().time()

        if action == 'check_in':
            # Check if already checked in today
            if AttendanceRecord.objects.filter(employee=employee, date=today).exists():
                return Response({'error': 'Already checked in for today'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Get Address
            address = self._get_address_from_coords(latitude, longitude)

            # Create new record
            AttendanceRecord.objects.create(
                employee=employee,
                date=today,
                check_in=now_time,
                status='Present',
                notes=notes,
                check_in_latitude=latitude if latitude else None,
                check_in_longitude=longitude if longitude else None,
                check_in_address=address
            )
            return Response({'message': 'Checked in successfully'}, status=status.HTTP_201_CREATED)


        elif action == 'start_break':
            try:
                record = AttendanceRecord.objects.get(employee=employee, date=today)
                if record.check_out:
                    return Response({'error': 'Cannot start break after clocking out'}, status=status.HTTP_400_BAD_REQUEST)
                
                # Check for open breaks
                if record.breaks.filter(break_end__isnull=True).exists():
                     return Response({'error': 'Already on a break'}, status=status.HTTP_400_BAD_REQUEST)

                AttendanceBreak.objects.create(
                    attendance_record=record,
                    break_start=now_time
                )
                return Response({'message': 'Break started'}, status=status.HTTP_201_CREATED)
            except AttendanceRecord.DoesNotExist:
                return Response({'error': 'Must clock in before starting break'}, status=status.HTTP_400_BAD_REQUEST)

        elif action == 'end_break':
            try:
                record = AttendanceRecord.objects.get(employee=employee, date=today)
                # Find open break
                current_break = record.breaks.filter(break_end__isnull=True).first()
                if not current_break:
                    return Response({'error': 'Not currently on a break'}, status=status.HTTP_400_BAD_REQUEST)
                
                current_break.break_end = now_time
                
                # Calculate duration
                dummy_date = datetime.now().date()
                start_dt = datetime.combine(dummy_date, current_break.break_start)
                end_dt = datetime.combine(dummy_date, now_time)
                duration = end_dt - start_dt
                hours = Decimal(duration.total_seconds()) / Decimal(3600)
                current_break.duration = round(hours, 2)
                current_break.save()
                
                return Response({'message': 'Break ended'}, status=status.HTTP_200_OK)
            except AttendanceRecord.DoesNotExist:
                return Response({'error': 'Record not found'}, status=status.HTTP_404_NOT_FOUND)

        elif action == 'check_out':
            try:
                record = AttendanceRecord.objects.get(employee=employee, date=today)
                if record.check_out:
                    return Response({'error': 'Already checked out today'}, status=status.HTTP_400_BAD_REQUEST)
                
                # Ensure not on break
                if record.breaks.filter(break_end__isnull=True).exists():
                    return Response({'error': 'Please end your break before clocking out'}, status=status.HTTP_400_BAD_REQUEST)
                
                record.check_out = now_time
                record.check_out_latitude = latitude if latitude else None
                record.check_out_longitude = longitude if longitude else None
                
                # Get Address
                address = self._get_address_from_coords(latitude, longitude)
                if address:
                    record.check_out_address = address
                
                # Calculate gross work hours
                if record.check_in:
                    dummy_date = datetime.now().date()
                    check_in_dt = datetime.combine(dummy_date, record.check_in)
                    check_out_dt = datetime.combine(dummy_date, now_time)
                    gross_duration = check_out_dt - check_in_dt
                    gross_hours = Decimal(gross_duration.total_seconds()) / Decimal(3600)
                    
                    # Subtract total break duration
                    total_break_hours = sum(b.duration for b in record.breaks.all())
                    net_hours = gross_hours - Decimal(total_break_hours)
                    
                    record.work_hours = round(net_hours, 2)

                if notes:
                    record.notes = notes

                record.save()
                return Response({'message': 'Checked out successfully'}, status=status.HTTP_200_OK)

            except AttendanceRecord.DoesNotExist:
                return Response({'error': 'No check-in record found for today'}, status=status.HTTP_400_BAD_REQUEST)

        else:
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
