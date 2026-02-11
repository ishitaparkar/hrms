from rest_framework import viewsets, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Announcement, Event
from .serializers import AnnouncementSerializer, EventSerializer
from django.utils import timezone
from django.db.models import Sum
from attendance_leave.models import AttendanceRecord
from leave_management.models import LeaveBalance, LeaveRequest
from performance_management.models import Appraisal
from employee_management.models import Employee

class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

class GetEmployeeStatsView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Get the employee associated with the user
            # Assuming the User model has a OneToOne or ForeignKey to Employee, 
            # or Employee has a OneToOne to User. 
            # Based on previous file views, it seems Employee links to User.
            # Let's try to get Employee by user.
            employee = Employee.objects.get(user=request.user)
            
            now = timezone.now()
            current_month = now.month
            current_year = now.year

            # 1. Attendance Logic
            # Count days present in current month
            present_days = AttendanceRecord.objects.filter(
                employee=employee,
                date__month=current_month,
                date__year=current_year,
                status='Present'
            ).count()
            
            # For "Total working days", we can approximate or use checks. 
            # For now, let's return just the present count.
            attendance_text = f"{present_days} days"
            
            # Calculate percentage (assuming 22 working days for avg month or simple calculation)
            # This is a placeholder logic, usually would depend on holidays/weekends.
            attendance_percentage = "100%" # Default logic or calculation needed

            # 2. Leave Logic
            # Total remaining leave balance
            balances = LeaveBalance.objects.filter(employee=employee)
            total_remaining = sum(b.remaining for b in balances)
            
            # Pending requests
            pending_requests = LeaveRequest.objects.filter(employee=employee, status='Pending').count()

            # 3. Hours Logic
            # Sum work_hours for the current week
            # Find start of the week
            today = now.date()
            start_of_week = today - timezone.timedelta(days=today.weekday())
            hours_worked = AttendanceRecord.objects.filter(
                employee=employee,
                date__gte=start_of_week
            ).aggregate(total=Sum('work_hours'))['total'] or 0
            
            # 4. Performance Logic
            # Latest appraisal rating
            latest_appraisal = Appraisal.objects.filter(employee=employee).order_by('-date').first()
            rating = latest_appraisal.rating if latest_appraisal else "N/A"

            data = {
                "attendance": {
                    "value": attendance_text,
                    "subtitle": f"{present_days} days present"
                },
                "leave": {
                    "value": f"{total_remaining} days",
                    "subtitle": f"{pending_requests} pending requests"
                },
                "hours": {
                    "value": f"{hours_worked} hrs",
                    "subtitle": "This week"
                },
                "performance": {
                    "value": f"{rating}/5.0" if latest_appraisal else "N/A",
                    "subtitle": "Latest Rating"
                }
            }
            return Response(data)

        except Employee.DoesNotExist:
            return Response({"error": "Employee profile not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

