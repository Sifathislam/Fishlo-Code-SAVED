# Packages Imports
from datetime import timedelta

from django.db.models import Q
from django.utils import timezone

# Local Import
from .models import OTPAttempt

# ------------------------------
# OTPRateLimiter - FIXED VERSION
# ------------------------------
class OTPRateLimiter:

    def __init__(self, max_attempts=3, window_minutes=5):
        self.max_attempts = max_attempts
        self.window_minutes = window_minutes

    def check_and_log(self, phone_number, action_type):
        """
        Check if request is allowed and log it.
        Returns dict with allowed status and remaining attempts.
        """
        
        # Define the time window (5 minutes from now)
        time_threshold = timezone.now() - timedelta(minutes=self.window_minutes)

        # Get all valid attempts in the window (exclude failed verifications)
        valid_attempts = OTPAttempt.objects.filter(
            phone_number=phone_number,
            attempt_type=action_type,
            attempted_at__gte=time_threshold,
        ).exclude(
            Q(attempt_type="verify") & Q(status="failed")
        ).order_by('-attempted_at')
        

        # Count only success and blocked attempts (not failed ones)
        attempt_count = valid_attempts.filter(
            status__in=['success', 'blocked']
        ).count()
        

        # If user has NOT reached the limit yet (0, 1, or 2 attempts)
        if attempt_count < self.max_attempts:
            # Log the new attempt as success
            self._log_attempt(phone_number, action_type, "success", None)
            
            # Calculate remaining attempts
            remaining = self.max_attempts - (attempt_count + 1)
            
            
            return {
                "allowed": True,
                "message": "Request allowed",
                "remaining": remaining,
            }
        
        # User has reached the limit (3 or more attempts)
        # Get the MOST RECENT counting attempt (should be the 3rd attempt)
        most_recent_attempt = valid_attempts.filter(
            status__in=['success', 'blocked']
        ).first()

        if most_recent_attempt:
            # Calculate when the window expires (5 min from the MOST RECENT attempt)
            window_expires_at = most_recent_attempt.attempted_at + timedelta(
                minutes=self.window_minutes
            )
            retry_after = int((window_expires_at - timezone.now()).total_seconds())


            # If the window has expired, DELETE ALL old attempts and allow new request
            if retry_after <= 0:
                # Delete all attempts for this phone number and action type
                deleted_count = OTPAttempt.objects.filter(
                    phone_number=phone_number,
                    attempt_type=action_type
                ).delete()[0]
                
                
                # Log the new attempt as success (fresh start)
                self._log_attempt(phone_number, action_type, "success", None)
                
                return {
                    "allowed": True,
                    "message": "Request allowed",
                    "remaining": self.max_attempts - 1,
                }

            # Window has NOT expired - block the request
            # DO NOT log to database - just return blocked status
            wait_time = self._format_wait_time(retry_after)
            error_msg = f"Too many attempts. Please wait {wait_time} before trying again."

            return {
                "allowed": False,
                "message": error_msg,
                "remaining": 0,
                "retry_after": retry_after,
            }

        # Fallback: If no recent attempt found but count >= max (shouldn't happen)
        # Block the request with default time WITHOUT logging
        error_msg = f"Too many attempts. Please wait {self.window_minutes} minutes."
        
        return {
            "allowed": False,
            "message": error_msg,
            "remaining": 0,
            "retry_after": self.window_minutes * 60,
        }

    def log_failure(self, phone_number, action_type, error_message):
        """Log a failed attempt (invalid OTP, API errors, etc.)"""
        self._log_attempt(phone_number, action_type, "failed", error_message)

    def _format_wait_time(self, seconds):
        """Format seconds into human-readable time"""
        if seconds <= 0:
            return "0s"
        
        minutes = seconds // 60
        secs = seconds % 60
        
        if minutes > 0:
            return f"{minutes}m {secs}s"
        return f"{secs}s"

    def _log_attempt(self, phone_number, attempt_type, status, error_message=None):
        """Log attempt to database"""
        try:
            otp_attempt = OTPAttempt.objects.create(
                phone_number=phone_number,
                attempt_type=attempt_type,
                status=status,
                error_message=error_message,
            )
            return otp_attempt
        except Exception as e:
            # Log silently fails - don't break the flow
            print(f"Failed to log attempt: {e}")
            pass