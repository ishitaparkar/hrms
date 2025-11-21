from django.urls import path
from .views import (
    EmployeeListCreateAPIView, 
    EmployeeDetailAPIView,
    EmployeeDocumentListAPIView,
    EmployeeDocumentDownloadAPIView,
    MyTeamAPIView,
    parse_employee_document
)
# Import the Chatbot View (Ensure you created backend/employee_management/chatbot.py)
from .chatbot import ChatbotAPIView 

urlpatterns = [
    # 1. Automated Document Parsing (OCR)
    path('parse-document/', parse_employee_document, name='parse-document'),

    # 2. HR Assistant Chatbot
    path('chatbot/', ChatbotAPIView.as_view(), name='chatbot'),

    # 3. Employee List & Create
    path('employees/', EmployeeListCreateAPIView.as_view(), name='employee-list-create'),
    
    # 4. Single Employee Details
    path('employees/<int:pk>/', EmployeeDetailAPIView.as_view(), name='employee-detail'),
    
    # 5. Team management
    path('employees/my-team/', MyTeamAPIView.as_view(), name='my-team'),
    
    # 6. Document management
    path('employees/<int:employee_id>/documents/', EmployeeDocumentListAPIView.as_view(), name='employee-documents'),
    path('employees/<int:employee_id>/documents/<int:document_id>/download/', EmployeeDocumentDownloadAPIView.as_view(), name='employee-document-download'),
]