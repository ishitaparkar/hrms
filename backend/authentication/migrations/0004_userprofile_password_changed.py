# Generated migration for adding password_changed field to UserProfile

from django.db import migrations, models


def set_existing_users_password_changed(apps, schema_editor):
    """
    Set password_changed to True for all existing UserProfile records
    to avoid forcing password change for existing users.
    """
    UserProfile = apps.get_model('authentication', 'UserProfile')
    
    # Update all existing UserProfile records
    updated_count = UserProfile.objects.all().update(password_changed=True)
    
    print(f"\nPassword Change Migration Summary:")
    print(f"- Set password_changed=True for {updated_count} existing user profiles")


def reverse_set_password_changed(apps, schema_editor):
    """
    Reverse migration - set password_changed back to False.
    """
    UserProfile = apps.get_model('authentication', 'UserProfile')
    UserProfile.objects.all().update(password_changed=False)
    print("Reverse migration: Reset password_changed to False for all users")


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0003_populate_user_profiles'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='password_changed',
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(
            set_existing_users_password_changed,
            reverse_set_password_changed
        ),
    ]
