"""
Management command to check and expire temporary role assignments.

This command queries RoleAssignments where expires_at < now() and is_active = True,
sets is_active to False, removes users from their Groups, and creates audit log entries.

Usage:
    python manage.py expire_roles
    
This command should be run periodically via cron job or task scheduler.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth.models import User
from authentication.models import RoleAssignment, AuditLog


class Command(BaseCommand):
    help = 'Expire temporary role assignments that have passed their expiration date'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be expired without actually expiring roles',
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        
        if dry_run:
            self.stdout.write(self.style.WARNING('Running in DRY RUN mode - no changes will be made'))
        
        self.stdout.write('Checking for expired role assignments...')
        
        # Get current time
        now = timezone.now()
        
        # Query RoleAssignments where expires_at < now() and is_active = True
        expired_assignments = RoleAssignment.objects.filter(
            expires_at__lt=now,
            is_active=True
        ).select_related('user', 'role', 'assigned_by')
        
        expired_count = expired_assignments.count()
        
        if expired_count == 0:
            self.stdout.write(self.style.SUCCESS('No expired role assignments found.'))
            return
        
        self.stdout.write(f'Found {expired_count} expired role assignment(s)')
        
        # Process each expired assignment
        success_count = 0
        error_count = 0
        
        for assignment in expired_assignments:
            try:
                user = assignment.user
                role = assignment.role
                
                self.stdout.write(
                    f'  Processing: {user.username} - {role.name} '
                    f'(expired: {assignment.expires_at.strftime("%Y-%m-%d %H:%M:%S")})'
                )
                
                if not dry_run:
                    # Set is_active to False
                    assignment.is_active = False
                    assignment.save()
                    
                    # Remove user from Group
                    user.groups.remove(role)
                    
                    # Create audit log entry
                    AuditLog.objects.create(
                        action='ROLE_REVOKED',
                        actor=None,  # System action, no actor
                        target_user=user,
                        resource_type='RoleAssignment',
                        resource_id=assignment.id,
                        details={
                            'role_name': role.name,
                            'reason': 'Automatic expiration',
                            'expired_at': assignment.expires_at.isoformat(),
                            'assigned_by': assignment.assigned_by.username if assignment.assigned_by else None,
                            'assigned_at': assignment.assigned_at.isoformat(),
                            'notes': assignment.notes,
                        },
                        ip_address=None  # System action, no IP
                    )
                    
                    self.stdout.write(
                        self.style.SUCCESS(f'    ✓ Expired role: {role.name} for user: {user.username}')
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f'    [DRY RUN] Would expire role: {role.name} for user: {user.username}')
                    )
                
                success_count += 1
                
            except Exception as e:
                error_count += 1
                self.stdout.write(
                    self.style.ERROR(f'    ✗ Error processing assignment {assignment.id}: {str(e)}')
                )
        
        # Summary
        self.stdout.write('')
        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f'DRY RUN complete! Would expire {success_count} role assignment(s). '
                    f'Errors: {error_count}'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Role expiration complete! Expired: {success_count}, Errors: {error_count}'
                )
            )
