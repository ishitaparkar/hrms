from django.contrib import admin
from .models import Appraisal, Goal, Achievement, Training


@admin.register(Appraisal)
class AppraisalAdmin(admin.ModelAdmin):
    list_display = ['employee', 'rating', 'date', 'reviewer', 'period_start', 'period_end']
    list_filter = ['date', 'rating']
    search_fields = ['employee__firstName', 'employee__lastName', 'employee__employeeId']
    date_hierarchy = 'date'


@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = ['employee', 'title', 'status', 'completion_percentage', 'target_date']
    list_filter = ['status', 'target_date']
    search_fields = ['employee__firstName', 'employee__lastName', 'title']


@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ['employee', 'title', 'date', 'awarded_by']
    list_filter = ['date']
    search_fields = ['employee__firstName', 'employee__lastName', 'title']
    date_hierarchy = 'date'


@admin.register(Training)
class TrainingAdmin(admin.ModelAdmin):
    list_display = ['employee', 'course_name', 'completion_date', 'certificate_issued', 'provider']
    list_filter = ['completion_date', 'certificate_issued']
    search_fields = ['employee__firstName', 'employee__lastName', 'course_name', 'provider']
    date_hierarchy = 'completion_date'
