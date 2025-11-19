"""
Celery tasks for authentication app.

This module contains asynchronous tasks for the RBAC system,
including periodic tasks for role expiration.

To use these tasks, you need to:
1. Install Celery: pip install celery redis
2. Configure Celery in hrms_core/celery.py
3. Start Celery worker and beat scheduler

See ROLE_EXPIRATION_SCHEDULING.md for detailed setup instructions.
"""

try:
    from celery import shared_task
    CELERY_AVAILABLE = True
except ImportError:
    CELERY_AVAILABLE = False
    # Define a dummy decorator if Celery is not installed
    def shared_task(func):
        return func


@shared_task
def expire_temporary_roles_task():
    """
    Celery task to expire temporary role assignments.
    
    This task calls the expire_temporary_roles() utility function
    to process all expired role assignments.
    
    Returns:
        str: Summary message with expired count and error count
        
    Example Celery Beat configuration in hrms_core/celery.py:
        app.conf.beat_schedule = {
            'expire-temporary-roles': {
                'task': 'authentication.tasks.expire_temporary_roles_task',
                'schedule': crontab(minute='*/15'),  # Every 15 minutes
            },
        }
    """
    from .utils import expire_temporary_roles
    
    result = expire_temporary_roles()
    
    message = (
        f"Role expiration task completed: "
        f"Expired {result['expired_count']} role(s), "
        f"{result['error_count']} error(s)"
    )
    
    return message


if not CELERY_AVAILABLE:
    # Provide helpful message if someone tries to use this without Celery
    def _celery_not_installed_warning():
        raise ImportError(
            "Celery is not installed. To use Celery tasks, install it with: "
            "pip install celery redis\n"
            "See ROLE_EXPIRATION_SCHEDULING.md for setup instructions."
        )
    
    # Override the task function to show warning
    original_task = expire_temporary_roles_task
    def expire_temporary_roles_task():
        _celery_not_installed_warning()
