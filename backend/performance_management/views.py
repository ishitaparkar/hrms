from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from employee_management.models import Employee
from .models import Appraisal, Goal, Achievement, Training
from .serializers import MyPerformanceSerializer


class MyPerformanceView(APIView):
    """
    API endpoint to fetch the authenticated user's performance data.
    Returns appraisals, goals, achievements, and trainings.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        GET /api/performance/my-performance/
        
        Returns the performance data for the authenticated user's employee record.
        """
        user = request.user
        
        # Get the employee record linked to the user
        try:
            # Check if user has a profile with linked employee
            if hasattr(user, 'profile') and user.profile.employee:
                employee = user.profile.employee
            else:
                # Try to find employee by email
                employee = Employee.objects.filter(personalEmail=user.email).first()
                
                if not employee:
                    return Response(
                        {
                            'error': 'No employee record found for this user',
                            'appraisals': [],
                            'goals': [],
                            'achievements': [],
                            'trainings': []
                        },
                        status=status.HTTP_404_NOT_FOUND
                    )
        except Exception as e:
            return Response(
                {
                    'error': 'Error fetching employee record',
                    'appraisals': [],
                    'goals': [],
                    'achievements': [],
                    'trainings': []
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Fetch performance data
        appraisals = Appraisal.objects.filter(employee=employee).order_by('-date')[:5]
        goals = Goal.objects.filter(employee=employee).exclude(status='Cancelled').order_by('-created_at')
        achievements = Achievement.objects.filter(employee=employee).order_by('-date')[:10]
        trainings = Training.objects.filter(employee=employee).order_by('-completion_date')[:10]

        # Serialize the data
        serializer = MyPerformanceSerializer({
            'appraisals': appraisals,
            'goals': goals,
            'achievements': achievements,
            'trainings': trainings
        })

        return Response(serializer.data, status=status.HTTP_200_OK)
