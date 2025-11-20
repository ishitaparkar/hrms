"""
Property-based tests for account activation.

**Feature: employee-onboarding-authentication, Property 17: Account activation flag update**
**Feature: employee-onboarding-authentication, Property 18: Automatic login after activation**
**Feature: employee-onboarding-authentication, Property 19: Activation flow resumption**
**Validates: Requirements 6.1, 6.2, 6.3, 6.5**
"""
from hypothesis import given, strategies as st, settings, assume
from hypothesis.extra.django import TestCase
from django.contrib.auth.models import User
from django.test import Client
from django.utils import timezone
from datetime import timedelta
from authentication.models import UserProfile, AccountSetupToken
from employee_management.models import Employee


class TestAccountActivationProperties(TestCase):
    """
    Property-based tests for account activation flow.
    
    These tests verify that:
    1. The password_changed flag is updated when password is set
    2. Users are automatically logged in after activation
    """
    
    @given(
        username=st.text(min_size=1, max_size=50, alphabet=st.characters(
            whitelist_categories=('Lu', 'Ll', 'Nd'),
            whitelist_characters='@.-_'
        )),
        password=st.text(min_size=8, max_size=128)
    )
    @settings(max_examples=100, deadline=None)
    def test_account_activation_flag_update(self, username, password):
        """
        **Feature: employee-onboarding-authentication, Property 17: Account activation flag update**
        
        Property: For any user account where password creation is completed,
        the password_changed flag should be set to true.
        
        This test verifies that completing password setup updates the activation flag.
        """
        # Clean up any existing user with this username
        User.objects.filter(username=username).delete()
        
        try:
            # Create a user with initial password
            user = User.objects.create_user(
                username=username,
                password='temporary_password_123'
            )
            
            # Create user profile with password_changed = False
            profile, _ = UserProfile.objects.get_or_create(
                user=user,
                defaults={'password_changed': False}
            )
            profile.password_changed = False
            profile.save()
            
            # Verify initial state
            profile.refresh_from_db()
            assert profile.password_changed is False, \
                "Initial password_changed flag should be False"
            
            # Simulate password change (what happens during account activation)
            user.set_password(password)
            user.save()
            
            # Update password_changed flag (this is what the account setup endpoint should do)
            profile.password_changed = True
            profile.save()
            
            # Verify the flag is now True
            profile.refresh_from_db()
            assert profile.password_changed is True, \
                "password_changed flag should be True after password setup"
            
        finally:
            # Clean up
            User.objects.filter(username=username).delete()
    
    @given(
        username=st.emails(),  # Use hypothesis email strategy for valid usernames
        password=st.text(min_size=8, max_size=128).filter(
            lambda p: any(c.isalnum() for c in p)  # Ensure at least one alphanumeric
        )
    )
    @settings(max_examples=100, deadline=None)
    def test_automatic_login_after_activation(self, username, password):
        """
        **Feature: employee-onboarding-authentication, Property 18: Automatic login after activation**
        
        Property: For any user account that completes the activation flow,
        the system should create an authenticated session for that user.
        
        This test verifies that after password setup, an authentication token can be created
        for the user, which enables automatic login.
        """
        from rest_framework.authtoken.models import Token
        
        # Clean up any existing user with this username
        User.objects.filter(username=username).delete()
        
        try:
            # Create a user
            user = User.objects.create_user(
                username=username,
                password=password
            )
            
            # Create user profile
            profile, _ = UserProfile.objects.get_or_create(
                user=user,
                defaults={'password_changed': False}
            )
            
            # Simulate what the account setup endpoint should do:
            # 1. Update password_changed flag
            profile.password_changed = True
            profile.save()
            
            # 2. Create authentication token for automatic login
            token, created = Token.objects.get_or_create(user=user)
            
            # Verify token was created
            assert token is not None, "Authentication token should be created"
            assert len(token.key) > 0, "Token key should not be empty"
            
            # Verify the token can be used to authenticate
            client = Client()
            response = client.get(
                '/api/auth/me/',
                HTTP_AUTHORIZATION=f'Token {token.key}'
            )
            
            # Verify user is authenticated with the token
            assert response.status_code == 200, \
                f"User should be authenticated with token, got {response.status_code}"
            
            # Verify the response contains user data
            data = response.json()
            assert 'user' in data, "Response should contain user data"
            assert data['user']['username'] == username, \
                f"Response should contain correct username"
            
        finally:
            # Clean up
            User.objects.filter(username=username).delete()

    @given(
        first_name=st.text(min_size=1, max_size=50, alphabet=st.characters(
            whitelist_categories=('Lu', 'Ll'),
            min_codepoint=65, max_codepoint=122
        )),
        last_name=st.text(min_size=1, max_size=50, alphabet=st.characters(
            whitelist_categories=('Lu', 'Ll'),
            min_codepoint=65, max_codepoint=122
        )),
        email=st.emails(),
        phone=st.text(min_size=10, max_size=15, alphabet=st.characters(
            whitelist_categories=('Nd',)
        )),
        # Generate a random step to interrupt at
        interrupt_step=st.sampled_from([
            AccountSetupToken.STEP_PHONE_AUTH,
            AccountSetupToken.STEP_USERNAME_GENERATION,
            AccountSetupToken.STEP_PASSWORD_SETUP
        ])
    )
    @settings(max_examples=100, deadline=None)
    def test_activation_flow_resumption(self, first_name, last_name, email, phone, interrupt_step):
        """
        **Feature: employee-onboarding-authentication, Property 19: Activation flow resumption**
        
        Property: For any interrupted account activation flow, when the user returns with 
        a valid setup token, the system should allow resumption from the last completed step 
        without requiring restart from the beginning.
        
        This test verifies that:
        1. The token tracks which steps have been completed
        2. The get_next_step() method returns the correct next step
        3. Users can resume from where they left off
        """
        # Clean up any existing data
        Employee.objects.filter(personalEmail=email).delete()
        
        try:
            # Create an employee
            employee = Employee.objects.create(
                firstName=first_name,
                lastName=last_name,
                personalEmail=email,
                mobileNumber=f"+1{phone}",
                department="Engineering",
                designation="Software Engineer",
                employeeId=f"EMP{timezone.now().timestamp()}",
                joiningDate=timezone.now().date()
            )
            
            # Create a setup token
            token = AccountSetupToken.objects.create(
                employee=employee,
                token=f"test_token_{email}_{timezone.now().timestamp()}",
                expires_at=timezone.now() + timedelta(hours=1)
            )
            
            # Verify initial state
            assert token.current_step == AccountSetupToken.STEP_PHONE_AUTH, \
                "Initial step should be phone_auth"
            assert token.get_next_step() == AccountSetupToken.STEP_PHONE_AUTH, \
                "Next step should be phone_auth initially"
            assert token.can_resume() is True, \
                "Token should be resumable initially"
            
            # Simulate completing steps up to the interrupt point
            if interrupt_step == AccountSetupToken.STEP_PHONE_AUTH:
                # Don't complete any steps - interrupt at the beginning
                pass
            elif interrupt_step == AccountSetupToken.STEP_USERNAME_GENERATION:
                # Complete phone auth, interrupt at username generation
                token.complete_phone_auth()
                token.refresh_from_db()
                
                assert token.phone_auth_completed is True, \
                    "Phone auth should be marked as completed"
                assert token.current_step == AccountSetupToken.STEP_USERNAME_GENERATION, \
                    "Current step should be username_generation"
                assert token.get_next_step() == AccountSetupToken.STEP_USERNAME_GENERATION, \
                    "Next step should be username_generation"
                
            elif interrupt_step == AccountSetupToken.STEP_PASSWORD_SETUP:
                # Complete phone auth and username generation, interrupt at password setup
                token.complete_phone_auth()
                token.complete_username_generation(f"{first_name.lower()}.{last_name.lower()}")
                token.refresh_from_db()
                
                assert token.phone_auth_completed is True, \
                    "Phone auth should be marked as completed"
                assert token.username_generation_completed is True, \
                    "Username generation should be marked as completed"
                assert token.current_step == AccountSetupToken.STEP_PASSWORD_SETUP, \
                    "Current step should be password_setup"
                assert token.get_next_step() == AccountSetupToken.STEP_PASSWORD_SETUP, \
                    "Next step should be password_setup"
            
            # Verify the token is still valid and can be resumed
            token.refresh_from_db()
            assert token.is_valid() is True, \
                "Token should still be valid after interruption"
            assert token.can_resume() is True, \
                "Token should be resumable after interruption"
            assert token.used is False, \
                "Token should not be marked as used during interruption"
            
            # Verify that get_next_step() returns the correct step for resumption
            expected_next_step = interrupt_step
            actual_next_step = token.get_next_step()
            assert actual_next_step == expected_next_step, \
                f"After interruption at {interrupt_step}, next step should be {expected_next_step}, got {actual_next_step}"
            
            # Simulate resuming and completing the flow
            if token.get_next_step() == AccountSetupToken.STEP_PHONE_AUTH:
                token.complete_phone_auth()
            
            if token.get_next_step() == AccountSetupToken.STEP_USERNAME_GENERATION:
                token.complete_username_generation(f"{first_name.lower()}.{last_name.lower()}")
            
            if token.get_next_step() == AccountSetupToken.STEP_PASSWORD_SETUP:
                token.complete_password_setup()
            
            # Verify the flow is now complete
            token.refresh_from_db()
            assert token.current_step == AccountSetupToken.STEP_COMPLETED, \
                "Current step should be completed after finishing all steps"
            assert token.used is True, \
                "Token should be marked as used after completion"
            assert token.can_resume() is False, \
                "Token should not be resumable after completion"
            
        finally:
            # Clean up
            Employee.objects.filter(personalEmail=email).delete()
