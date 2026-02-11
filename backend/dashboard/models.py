from django.db import models
from django.conf import settings

class Announcement(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    # UI helpers
    icon = models.CharField(max_length=50, default="campaign") # Material icon name
    color = models.CharField(max_length=20, default="purple") # UI color theme

    def __str__(self):
        return self.title
    
    class Meta:
        ordering = ['-created_at']

class Event(models.Model):
    title = models.CharField(max_length=200)
    date_time = models.DateTimeField()
    location = models.CharField(max_length=200, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title
    
    class Meta:
        ordering = ['date_time']

