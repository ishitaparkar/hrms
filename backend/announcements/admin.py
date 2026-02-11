from django.contrib import admin
from .models import Announcement


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'created_at', 'is_active']
    list_filter = ['is_active', 'created_at']
    search_fields = ['title', 'content', 'author__username']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Announcement Details', {
            'fields': ('title', 'content', 'author', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        """Set the author to the current user if creating new announcement"""
        if not change:  # If creating new object
            obj.author = request.user
        super().save_model(request, obj, form, change)
