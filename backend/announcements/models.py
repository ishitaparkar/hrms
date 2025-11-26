from django.db import models
from django.contrib.auth.models import User


class Announcement(models.Model):
    """
    Model for organizational announcements.
    Stores announcements that can be viewed by all users.
    """
    title = models.CharField(max_length=255, help_text="Title of the announcement")
    content = models.TextField(help_text="Full content of the announcement")
    author = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='announcements',
        help_text="User who created the announcement"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(
        default=True, 
        help_text="Whether the announcement is currently active/visible"
    )

    class Meta:
        verbose_name = "Announcement"
        verbose_name_plural = "Announcements"
        ordering = ['-created_at']  # Most recent first
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.title} - {self.author.username}"

    def get_author_name(self):
        """Return the full name of the author or username if name not available"""
        if self.author.first_name and self.author.last_name:
            return f"{self.author.first_name} {self.author.last_name}"
        return self.author.username

    def deactivate(self):
        """Deactivate the announcement"""
        self.is_active = False
        self.save()

    def activate(self):
        """Activate the announcement"""
        self.is_active = True
        self.save()
