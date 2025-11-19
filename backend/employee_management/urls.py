from django.urls import path
# 1. Import the new EmployeeDetailAPIView
from .views import (
    EmployeeListCreateAPIView, 
    EmployeeDetailAPIView,
    EmployeeDocumentListAPIView,
    EmployeeDocumentDownloadAPIView,
    MyTeamAPIView
)

urlpatterns = [
    # This path is for getting the list of all employees and creating a new one.
    # It handles GET and POST requests to /api/employees/
    path('employees/', EmployeeListCreateAPIView.as_view(), name='employee-list-create'),
    
    # 2. Add this new path for handling a single employee
    # It handles GET, PUT, and DELETE requests for URLs like /api/employees/1/, /api/employees/2/, etc.
    # <int:pk> is a special syntax that captures the number from the URL 
    # and passes it as a "primary key" (pk) to the view.
    path('employees/<int:pk>/', EmployeeDetailAPIView.as_view(), name='employee-detail'),
    
    # Team management endpoint
    path('employees/my-team/', MyTeamAPIView.as_view(), name='my-team'),
    
    # Document management endpoints
    path('employees/<int:employee_id>/documents/', EmployeeDocumentListAPIView.as_view(), name='employee-documents'),
    path('employees/<int:employee_id>/documents/<int:document_id>/download/', EmployeeDocumentDownloadAPIView.as_view(), name='employee-document-download'),
]