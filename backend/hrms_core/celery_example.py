"""
Example Celery configuration for HRMS project.

This file shows how to configure Celery for the HRMS application,
including periodic tasks for role expiration.

To use this configuration:
1. Rename this file to celery.py
2. Install required packages: pip install celery redis
3. Update settings.py with Celery configuration
4. Start Redis server
5. Run Celery worker and beat scheduler

See authentication/ROLE_EXPIRATION_SCHEDULING.md for detailed instructions.
"""

import os
from celery import Celery
from celery.schedules import crontab

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrms_core.settings')

app = Celery('hrms_core')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()


# Periodic task schedule
app.conf.beat_schedule = {
    # Expire temporary roles every 15 minutes
    'expire-temporary-roles': {
        'task': 'authentication.tasks.expire_temporary_roles_task',
        'schedule': crontab(minute='*/15'),  # Run every 15 minutes
        'options': {
            'expires': 60 * 10,  # Task expires after 10 minutes if not executed
        }
    },
    
    # Alternative schedules (uncomment the one you prefer):
    
    # Run every hour
    # 'expire-temporary-roles': {
    #     'task': 'authentication.tasks.expire_temporary_roles_task',
    #     'schedule': crontab(minute=0, hour='*'),
    # },
    
    # Run every 30 minutes
    # 'expire-temporary-roles': {
    #     'task': 'authentication.tasks.expire_temporary_roles_task',
    #     'schedule': crontab(minute='*/30'),
    # },
    
    # Run daily at 2 AM
    # 'expire-temporary-roles': {
    #     'task': 'authentication.tasks.expire_temporary_roles_task',
    #     'schedule': crontab(minute=0, hour=2),
    # },
}

# Celery configuration
app.conf.update(
    # Task result backend
    result_expires=3600,  # Results expire after 1 hour
    
    # Task execution settings
    task_acks_late=True,  # Tasks are acknowledged after execution
    task_reject_on_worker_lost=True,  # Reject tasks if worker is lost
    
    # Timezone
    timezone='UTC',
    enable_utc=True,
)


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Debug task to test Celery configuration."""
    print(f'Request: {self.request!r}')


# Add this to hrms_core/__init__.py to ensure Celery is loaded:
# from .celery import app as celery_app
# __all__ = ('celery_app',)
