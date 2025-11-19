from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, NotFound
from rest_framework.views import APIView
from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import Employee, EmployeeDocument
from .serializers import EmployeeSerializer, EmployeeDocumentSerializer, TeamMemberSerializer
from authentication.permissions import IsHRManager, IsEmployee
from authentication.utils import (
    user_has_any_role,
    get_user_department,
    ROLE_SUPER_ADMIN,
    ROLE_HR_MANAGER,
    ROLE_EMPLOYEE
)


class EmployeeListCreateAPIView(generics.ListCreateAPIView):
    """
    List and create employees with role-based filtering and permissions.
    
    GET: Returns employees based on user role:
        - Super Admin/HR Manager: All employees
        - Employee: Only their own employee record
    
    POST: Requires HR Manager or Super Admin role
    """
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter employees based on user role.
        """
        user = self.request.user
        
        # Super Admin and HR Manager can see all employees
        if user_has_any_role(user, [ROLE_SUPER_ADMIN, ROLE_HR_MANAGER]):
            return Employee.objects.all()
        
        # Employee can only see their own record
        if hasattr(user, 'profile') and user.profile and user.profile.employee:
            return Employee.objects.filter(id=user.profile.employee.id)
        
        return Employee.objects.none()
    
    def perform_create(self, serializer):
        """
        Create employee with permission check.
        Only HR Manager and Super Admin can create employees.
        """
        user = self.request.user
        
        # Check if user has permission to manage employees
        if not user_has_any_role(user, [ROLE_SUPER_ADMIN, ROLE_HR_MANAGER]):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to create employees.")
        
        serializer.save()
    
    def create(self, request, *args, **kwargs):
        """
        Override create to add account creation details to the response.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Get the created employee instance
        employee = serializer.instance
        
        # Prepare response data
        response_data = serializer.data
        
        # Add account creation details if available
        if hasattr(employee, '_account_creation_result'):
            result = employee._account_creation_result
            response_data['account_creation'] = {
                'user_account_created': result['user_account_created'],
                'username': result['username'],
            }
            
            # If there was an error, include it in the response
            if result['error_message']:
                response_data['account_creation']['error'] = result['error_message']
                response_data['account_creation']['warning'] = (
                    "Employee created successfully, but user account creation encountered an issue. "
                    "Please manually create the account or contact system administrator."
                )
            else:
                # Success message
                response_data['account_creation']['message'] = (
                    f"Employee and user account created successfully. "
                    f"Login credentials have been sent to {result['username']}."
                )
        
        headers = self.get_success_headers(serializer.data)
        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)
    
    def get_serializer_context(self):
        """
        Add permission metadata to serializer context.
        """
        context = super().get_serializer_context()
        context['user_roles'] = list(self.request.user.groups.values_list('name', flat=True))
        context['can_manage'] = user_has_any_role(
            self.request.user, 
            [ROLE_SUPER_ADMIN, ROLE_HR_MANAGER]
        )
        return context


class EmployeeDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a single employee with role-based permissions.
    
    GET: Allowed based on role and department scope
    PUT/PATCH: Requires HR Manager or Super Admin role
    DELETE: Requires HR Manager or Super Admin role
    """
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter employees based on user role for object-level access.
        """
        user = self.request.user
        
        # Super Admin and HR Manager can access all employees
        if user_has_any_role(user, [ROLE_SUPER_ADMIN, ROLE_HR_MANAGER]):
            return Employee.objects.all()
        
        # Employee can only access their own record
        if hasattr(user, 'profile') and user.profile and user.profile.employee:
            return Employee.objects.filter(id=user.profile.employee.id)
        
        return Employee.objects.none()
    
    def perform_update(self, serializer):
        """
        Update employee with permission check.
        Only HR Manager and Super Admin can update employees.
        """
        user = self.request.user
        
        # Check if user has permission to manage employees
        if not user_has_any_role(user, [ROLE_SUPER_ADMIN, ROLE_HR_MANAGER]):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to update employees.")
        
        serializer.save()
    
    def perform_destroy(self, instance):
        """
        Delete employee with permission check.
        Only HR Manager and Super Admin can delete employees.
        """
        user = self.request.user
        
        # Check if user has permission to manage employees
        if not user_has_any_role(user, [ROLE_SUPER_ADMIN, ROLE_HR_MANAGER]):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to delete employees.")
        
        instance.delete()
    
    def get_serializer_context(self):
        """
        Add permission metadata to serializer context.
        """
        context = super().get_serializer_context()
        context['user_roles'] = list(self.request.user.groups.values_list('name', flat=True))
        context['can_manage'] = user_has_any_role(
            self.request.user, 
            [ROLE_SUPER_ADMIN, ROLE_HR_MANAGER]
        )
        return context



class EmployeeDocumentListAPIView(generics.ListCreateAPIView):
    """
    List and create documents for a specific employee.
    
    GET: Returns documents for the specified employee (with role-based access)
    POST: Create a new document (requires HR Manager or Super Admin role)
    """
    serializer_class = EmployeeDocumentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter documents based on employee ID and user permissions.
        """
        employee_id = self.kwargs.get('employee_id')
        user = self.request.user
        
        # Verify the employee exists
        try:
            employee = Employee.objects.get(id=employee_id)
        except Employee.DoesNotExist:
            return EmployeeDocument.objects.none()
        
        # Check if user has permission to view this employee's documents
        if not self._can_access_employee_documents(user, employee):
            raise PermissionDenied("You do not have permission to view these documents.")
        
        # Return documents for the specified employee
        return EmployeeDocument.objects.filter(employee_id=employee_id)
    
    def _can_access_employee_documents(self, user, employee):
        """
        Check if user can access documents for the given employee.
        """
        # Super Admin and HR Manager can access all documents
        if user_has_any_role(user, [ROLE_SUPER_ADMIN, ROLE_HR_MANAGER]):
            return True
        
        # Employee can only access their own documents
        if hasattr(user, 'profile') and user.profile and user.profile.employee:
            return user.profile.employee.id == employee.id
        
        return False
    
    def perform_create(self, serializer):
        """
        Create document with permission check and employee association.
        """
        employee_id = self.kwargs.get('employee_id')
        user = self.request.user
        
        # Verify the employee exists
        try:
            employee = Employee.objects.get(id=employee_id)
        except Employee.DoesNotExist:
            raise NotFound("Employee not found.")
        
        # Only HR Manager and Super Admin can upload documents
        if not user_has_any_role(user, [ROLE_SUPER_ADMIN, ROLE_HR_MANAGER]):
            raise PermissionDenied("You do not have permission to upload documents.")
        
        # Save with employee association
        serializer.save(employee=employee)
    
    def list(self, request, *args, **kwargs):
        """
        Override list to return documents grouped by category.
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        # Group documents by category
        documents_by_category = {
            'Personal': [],
            'Employment': [],
            'Certificates': []
        }
        
        for doc in serializer.data:
            category = doc.get('category', 'Personal')
            if category in documents_by_category:
                documents_by_category[category].append(doc)
        
        return Response({
            'documents': serializer.data,
            'documents_by_category': documents_by_category
        })


class EmployeeDocumentDownloadAPIView(generics.RetrieveAPIView):
    """
    Download a specific employee document.
    
    GET: Returns the document file for download (with role-based access)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, employee_id, document_id):
        """
        Handle document download with permission check.
        """
        user = request.user
        
        # Get the employee and document
        employee = get_object_or_404(Employee, id=employee_id)
        document = get_object_or_404(EmployeeDocument, id=document_id, employee=employee)
        
        # Check if user has permission to download this document
        if not self._can_access_employee_documents(user, employee):
            raise PermissionDenied("You do not have permission to download this document.")
        
        # Return the file as a download
        try:
            response = FileResponse(document.file.open('rb'), as_attachment=True)
            response['Content-Disposition'] = f'attachment; filename="{document.name}"'
            return response
        except FileNotFoundError:
            raise Http404("Document file not found.")
    
    def _can_access_employee_documents(self, user, employee):
        """
        Check if user can access documents for the given employee.
        """
        # Super Admin and HR Manager can access all documents
        if user_has_any_role(user, [ROLE_SUPER_ADMIN, ROLE_HR_MANAGER]):
            return True
        
        # Employee can only access their own documents
        if hasattr(user, 'profile') and user.profile and user.profile.employee:
            return user.profile.employee.id == employee.id
        
        return False



class MyTeamAPIView(APIView):
    """
    Retrieve the current user's team information including manager and team members.
    
    GET: Returns:
        - manager: The reporting manager (employee with 'Manager' in designation in same department)
        - department: The user's department name
        - team_members: List of employees in the same department (excluding the user)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Get team information for the authenticated user.
        """
        user = request.user
        
        # Get the user's employee record
        if not hasattr(user, 'profile') or not user.profile or not user.profile.employee:
            return Response({
                'error': 'No employee record found for this user.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        employee = user.profile.employee
        department = employee.department
        
        # Find the reporting manager
        # Manager is identified as someone with 'Manager' in their designation in the same department
        manager = self._get_reporting_manager(employee, department)
        
        # Get team members (employees in the same department, excluding the current user)
        team_members = self._get_team_members(employee, department)
        
        # Serialize the data
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
        """
        Find the reporting manager for the employee.
        
        Logic: Find an employee in the same department with 'Manager' in their designation.
        Priority order:
        1. Exact match for department and designation contains 'Manager'
        2. If multiple managers exist, return the first one (can be enhanced with explicit manager field)
        
        Args:
            employee: The current employee
            department: The employee's department
            
        Returns:
            Employee object or None
        """
        # Look for employees with 'Manager' in their designation in the same department
        # Exclude the current employee in case they are also a manager
        manager = Employee.objects.filter(
            department=department,
            designation__icontains='Manager'
        ).exclude(id=employee.id).first()
        
        return manager
    
    def _get_team_members(self, employee, department):
        """
        Get all team members in the same department.
        
        Logic: Return all employees in the same department excluding the current user.
        
        Args:
            employee: The current employee
            department: The employee's department
            
        Returns:
            QuerySet of Employee objects
        """
        # Get all employees in the same department, excluding the current user
        team_members = Employee.objects.filter(
            department=department
        ).exclude(id=employee.id).order_by('firstName', 'lastName')
        
        return team_members
