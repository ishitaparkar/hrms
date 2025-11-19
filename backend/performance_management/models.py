from django.db import models
from django.contrib.auth.models import User
from employee_management.models import Employee


class Appraisal(models.Model):
    """
    Stores employee performance appraisal records.
    """
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='appraisals'
    )
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        help_text="Performance rating (e.g., 4.5 out of 5)"
    )
    date = models.DateField(help_text="Date of appraisal")
    reviewer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='appraisals_reviewed'
    )
    comments = models.TextField(blank=True)
    period_start = models.DateField(help_text="Start date of appraisal period")
    period_end = models.DateField(help_text="End date of appraisal period")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee.firstName} {self.employee.lastName} - {self.date} (Rating: {self.rating})"

    class Meta:
        verbose_name = "Appraisal"
        verbose_name_plural = "Appraisals"
        ordering = ['-date']


class Goal(models.Model):
    """
    Stores employee goals and objectives.
    """
    STATUS_CHOICES = [
        ('In Progress', 'In Progress'),
        ('Completed', 'Completed'),
        ('Overdue', 'Overdue'),
        ('Cancelled', 'Cancelled'),
    ]

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='goals'
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    target_date = models.DateField(help_text="Target completion date")
    completion_percentage = models.IntegerField(
        default=0,
        help_text="Completion percentage (0-100)"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='In Progress'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee.firstName} {self.employee.lastName} - {self.title}"

    class Meta:
        verbose_name = "Goal"
        verbose_name_plural = "Goals"
        ordering = ['-created_at']


class Achievement(models.Model):
    """
    Stores employee achievements and awards.
    """
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='achievements'
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    date = models.DateField(help_text="Date of achievement")
    awarded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='achievements_awarded'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee.firstName} {self.employee.lastName} - {self.title}"

    class Meta:
        verbose_name = "Achievement"
        verbose_name_plural = "Achievements"
        ordering = ['-date']


class Training(models.Model):
    """
    Stores employee training and course completion records.
    """
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='trainings'
    )
    course_name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    completion_date = models.DateField(help_text="Date of course completion")
    certificate_issued = models.BooleanField(default=False)
    certificate_url = models.URLField(blank=True, null=True)
    provider = models.CharField(max_length=255, blank=True)
    duration_hours = models.IntegerField(
        null=True,
        blank=True,
        help_text="Training duration in hours"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee.firstName} {self.employee.lastName} - {self.course_name}"

    class Meta:
        verbose_name = "Training"
        verbose_name_plural = "Trainings"
        ordering = ['-completion_date']
