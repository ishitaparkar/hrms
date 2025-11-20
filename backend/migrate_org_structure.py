import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrms_core.settings')
django.setup()

from employee_management.models import Employee, Department, Designation

def migrate_data():
    employees = Employee.objects.all()
    print(f"Found {employees.count()} employees to migrate.")

    for emp in employees:
        dept_name = emp.department.strip() if emp.department else "Unassigned"
        desig_title = emp.designation.strip() if emp.designation else "Unassigned"

        # Get or create Department
        department, created = Department.objects.get_or_create(name=dept_name)
        if created:
            print(f"Created Department: {dept_name}")

        # Get or create Designation
        designation, created = Designation.objects.get_or_create(
            title=desig_title,
            department=department
        )
        if created:
            print(f"Created Designation: {desig_title} in {dept_name}")

        emp.department_new = department
        emp.designation_new = designation
        emp.save()
        print(f"Updated {emp.firstName} {emp.lastName}")

if __name__ == "__main__":
    migrate_data()
