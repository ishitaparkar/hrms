import re
import pytesseract
from PIL import Image
from pypdf import PdfReader
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, NotFound
from rest_framework.views import APIView
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import Employee, EmployeeDocument
from .serializers import EmployeeSerializer, EmployeeDocumentSerializer, TeamMemberSerializer
from authentication.permissions import IsHRManager, IsEmployee
from authentication.utils import (
    user_has_any_role,
    get_user_department,
    audit_log,
    ROLE_SUPER_ADMIN,
    ROLE_HR_MANAGER,
    ROLE_EMPLOYEE
)

# =============================================================================
# OCR CONFIGURATION
# =============================================================================
# If on Windows, uncomment and point to your tesseract.exe if needed
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'


# =============================================================================
# API VIEWS
# =============================================================================

class EmployeeListCreateAPIView(generics.ListCreateAPIView):
    """
    List and create employees.
    """
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user_has_any_role(user, [ROLE_SUPER_ADMIN, ROLE_HR_MANAGER]):
            return Employee.objects.all()
        if hasattr(user, 'profile') and user.profile and user.profile.employee:
            return Employee.objects.filter(id=user.profile.employee.id)
        return Employee.objects.none()
    
    def perform_create(self, serializer):
        user = self.request.user
        # Requirement: Only Super Admin can create employees
        if not user_has_any_role(user, [ROLE_SUPER_ADMIN]):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to create employees.")
        serializer.save()
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        employee = serializer.instance
        
        # Audit Log
        audit_log(
            action='EMPLOYEE_CREATED',
            actor=request.user,
            request=request,
            resource_type='Employee',
            resource_id=employee.id,
            details={
                'employee_id': employee.employeeId,
                'name': f"{employee.firstName} {employee.lastName}",
                'email': employee.personalEmail
            }
        )
        
        response_data = serializer.data
        if hasattr(employee, '_account_creation_result'):
            result = employee._account_creation_result
            response_data['account_creation'] = {
                'user_account_created': result['user_account_created'],
                'username': result['username'],
            }
            if result['error_message']:
                response_data['account_creation']['error'] = result['error_message']
                response_data['account_creation']['warning'] = "Account creation failed."
            else:
                response_data['account_creation']['message'] = "Account created successfully."
        
        headers = self.get_success_headers(serializer.data)
        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['user_roles'] = list(self.request.user.groups.values_list('name', flat=True))
        context['can_manage'] = user_has_any_role(self.request.user, [ROLE_SUPER_ADMIN, ROLE_HR_MANAGER])
        return context


class EmployeeDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a single employee.
    Handles File Uploads for Profile Pictures.
    """
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]
    # CRITICAL: Enable MultiPartParser to accept Images
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        user = self.request.user
        if user_has_any_role(user, [ROLE_SUPER_ADMIN, ROLE_HR_MANAGER]):
            return Employee.objects.all()
        if hasattr(user, 'profile') and user.profile and user.profile.employee:
            return Employee.objects.filter(id=user.profile.employee.id)
        return Employee.objects.none()
    
    def perform_update(self, serializer):
        user = self.request.user
        
        # --- DEBUG LOGS (Check Terminal) ---
        print(f"DEBUG: Update requested by: {user.username}")
        print(f"DEBUG: FILES in request: {self.request.FILES}")
        print(f"DEBUG: DATA in request: {self.request.data}")
        # -----------------------------------

        # CASE 1: Super Admin or HR Manager -> Full Access
        if user_has_any_role(user, [ROLE_SUPER_ADMIN, ROLE_HR_MANAGER]):
            serializer.save()
            return

        # CASE 2: Regular Employee Updating Own Record
        if hasattr(user, 'profile') and user.profile.employee:
            if user.profile.employee.id == serializer.instance.id:
                
                # Check for FILE UPLOAD (Profile Picture)
                # We look in request.FILES specifically
                if 'profile_picture' in self.request.FILES:
                    print("DEBUG: Image file detected. Allowing update.")
                    serializer.save()
                    return
                
                # Check for REMOVAL attempt (sending 'null' or None)
                raw_val = self.request.data.get('profile_picture')
                if raw_val == 'null' or raw_val is None:
                     print("DEBUG: Removal attempt blocked.")
                     raise PermissionDenied("Permission denied. Only Super Admins can remove profile pictures.")

                print("DEBUG: No valid file found and user is not Admin.")

        # DEFAULT: Block
        raise PermissionDenied("You do not have permission to update this employee.")
    
    def perform_destroy(self, instance):
        if not user_has_any_role(self.request.user, [ROLE_SUPER_ADMIN, ROLE_HR_MANAGER]):
            raise PermissionDenied("You do not have permission to delete employees.")
        instance.delete()
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['user_roles'] = list(self.request.user.groups.values_list('name', flat=True))
        context['can_manage'] = user_has_any_role(self.request.user, [ROLE_SUPER_ADMIN, ROLE_HR_MANAGER])
        return context


class EmployeeDocumentListAPIView(generics.ListCreateAPIView):
    serializer_class = EmployeeDocumentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        employee_id = self.kwargs.get('employee_id')
        user = self.request.user
        try:
            employee = Employee.objects.get(id=employee_id)
        except Employee.DoesNotExist:
            return EmployeeDocument.objects.none()
        
        if not self._can_access_employee_documents(user, employee):
            raise PermissionDenied("You do not have permission to view these documents.")
        return EmployeeDocument.objects.filter(employee_id=employee_id)
    
    def _can_access_employee_documents(self, user, employee):
        if user_has_any_role(user, [ROLE_SUPER_ADMIN, ROLE_HR_MANAGER]):
            return True
        if hasattr(user, 'profile') and user.profile and user.profile.employee:
            return user.profile.employee.id == employee.id
        return False
    
    def perform_create(self, serializer):
        employee_id = self.kwargs.get('employee_id')
        user = self.request.user
        try:
            employee = Employee.objects.get(id=employee_id)
        except Employee.DoesNotExist:
            raise NotFound("Employee not found.")
        
        if not user_has_any_role(user, [ROLE_SUPER_ADMIN, ROLE_HR_MANAGER]):
            raise PermissionDenied("You do not have permission to upload documents.")
        serializer.save(employee=employee)
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        documents_by_category = {'Personal': [], 'Employment': [], 'Certificates': []}
        for doc in serializer.data:
            category = doc.get('category', 'Personal')
            if category in documents_by_category:
                documents_by_category[category].append(doc)
        return Response({
            'documents': serializer.data,
            'documents_by_category': documents_by_category
        })


class EmployeeDocumentDownloadAPIView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, employee_id, document_id):
        user = request.user
        employee = get_object_or_404(Employee, id=employee_id)
        document = get_object_or_404(EmployeeDocument, id=document_id, employee=employee)
        
        if not self._can_access_employee_documents(user, employee):
            raise PermissionDenied("You do not have permission to download this document.")
        
        try:
            response = FileResponse(document.file.open('rb'), as_attachment=True)
            response['Content-Disposition'] = f'attachment; filename="{document.name}"'
            return response
        except FileNotFoundError:
            raise Http404("Document file not found.")
    
    def _can_access_employee_documents(self, user, employee):
        if user_has_any_role(user, [ROLE_SUPER_ADMIN, ROLE_HR_MANAGER]):
            return True
        if hasattr(user, 'profile') and user.profile and user.profile.employee:
            return user.profile.employee.id == employee.id
        return False


class MyTeamAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        if not hasattr(user, 'profile') or not user.profile or not user.profile.employee:
            return Response({'error': 'No employee record found.'}, status=status.HTTP_404_NOT_FOUND)
        
        employee = user.profile.employee
        department = employee.department
        
        manager = self._get_reporting_manager(employee, department)
        team_members = self._get_team_members(employee, department)
        
        manager_data = None
        if manager:
            manager_serializer = TeamMemberSerializer(manager, context={'request': request})
            manager_data = manager_serializer.data
        
        team_members_serializer = TeamMemberSerializer(team_members, many=True, context={'request': request})
        
        return Response({
            'manager': manager_data,
            'department': department,
            'team_members': team_members_serializer.data,
            'team_member_count': len(team_members)
        })
    
    def _get_reporting_manager(self, employee, department):
        manager = Employee.objects.filter(
            department=department,
            designation__icontains='Manager'
        ).exclude(id=employee.id).first()
        return manager
    
    def _get_team_members(self, employee, department):
        team_members = Employee.objects.filter(
            department=department
        ).exclude(id=employee.id).order_by('firstName', 'lastName')
        return team_members


# =============================================================================
# AUTOMATED OCR / DOCUMENT PARSING VIEW
# =============================================================================

def extract_info_from_text(text):
    data = {"email": "", "phone": "", "dob": "", "name_guess": ""}
    # Email
    email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
    if email_match: data['email'] = email_match.group()
    # Phone
    phone_match = re.search(r'(\+?\d{1,3}[- ]?)?\d{10}', text)
    if phone_match: data['phone'] = phone_match.group()
    # DOB
    dob_match = re.search(r'\b(\d{2}[/-]\d{2}[/-]\d{4}|\d{4}[/-]\d{2}[/-]\d{2})\b', text)
    if dob_match: data['dob'] = dob_match.group()
    # Name
    lines = text.split('\n')
    for line in lines:
        clean_line = line.strip()
        if clean_line and len(clean_line.split()) >= 2 and not any(char.isdigit() for char in clean_line):
            if "RESUME" not in clean_line.upper() and "CV" != clean_line.upper():
                data['name_guess'] = clean_line
                break
    return data

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def parse_employee_document(request):
    """
    OCR Scanner for Auto-filling forms.
    Restricted to Admin/HR.
    """
    if not user_has_any_role(request.user, [ROLE_SUPER_ADMIN, ROLE_HR_MANAGER]):
        return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

    if 'document' not in request.FILES:
        return Response({'error': 'No document provided'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        uploaded_file = request.FILES['document']
        filename = uploaded_file.name.lower()
        extracted_text = ""

        if filename.endswith('.pdf'):
            try:
                reader = PdfReader(uploaded_file)
                for page in reader.pages:
                    text = page.extract_text()
                    if text: extracted_text += text + "\n"
            except Exception as pdf_error:
                print(f"PDF Error: {pdf_error}")
                return Response({'error': 'Could not read PDF.'}, status=400)
        else:
            try:
                image = Image.open(uploaded_file)
                extracted_text = pytesseract.image_to_string(image)
            except Exception as img_error:
                print(f"Image Error: {img_error}")
                return Response({'error': 'Invalid image file.'}, status=400)
        
        if not extracted_text.strip():
            return Response({'error': 'No readable text found.'}, status=400)

        parsed_data = extract_info_from_text(extracted_text)
        return Response({'success': True, 'data': parsed_data}, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Processing Error: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)