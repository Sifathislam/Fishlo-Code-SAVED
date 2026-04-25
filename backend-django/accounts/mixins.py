# Packages Imports
import re
import json

from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.http import JsonResponse
from rest_framework.exceptions import AuthenticationFailed as DRFAuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed, InvalidToken

# Local Imports
from .models import UserAddress

User = get_user_model()


# -------------------
# Address Mixin
# --------------------
class AddressMixin:
    """Handles authentication and session management for addresses"""

    def authenticate_request(self, request):
        """Authenticate user via JWT or set as anonymous"""
        try:
            jwt_auth = JWTAuthentication()
            auth_result = jwt_auth.authenticate(request)
            if auth_result:
                request.user, _ = auth_result
            else:
                request.user = AnonymousUser()
        except (InvalidToken, AuthenticationFailed, DRFAuthenticationFailed) as e:
            raise
        except Exception:
            request.user = AnonymousUser()

    def get_session_id(self, request):
        """Extract and sanitize session ID from headers or request body"""
        session_id = request.headers.get("X-Session-ID")
        if not session_id and request.method == "POST":
            try:
                body = json.loads(request.body)
                session_id = body.get("session_id")
            except:
                pass

        # Sanitize session ID - should be UUID format
        if session_id:
            # Only allow alphanumeric and hyphens (UUID format)
            if not re.match(r"^[a-zA-Z0-9\-]+$", session_id):
                return None
        
        return session_id

    def json_response(self, success=True, message="", data=None, status=200):
        """Build standardized JSON response"""
        response_data = {"success": success, "message": message}
        if data:
            response_data["data"] = data
        return JsonResponse(response_data, status=status)

    def handle_auth_error(self, exception):
        """Return formatted 401 response for auth failures"""
        if hasattr(exception, "detail") and isinstance(exception.detail, dict):
            return JsonResponse(exception.detail, status=401)
        return JsonResponse(
            {"detail": str(exception), "code": "authentication_failed"}, status=401
        )

    def is_duplicate_address(
        self, user=None, session_key=None, address_data=None, exclude_id=None
    ):
        """
        Check if address already exists for user/session
        SECURITY: Uses Django ORM parameterized queries (automatically safe from SQL injection)
        """
        # Django ORM automatically parameterizes these queries
        filters = {
            "house_details__iexact": (address_data.get("house_details") or "").strip(),
            "city__iexact": (address_data.get("city") or "").strip(),
            "state__iexact": (address_data.get("state") or "").strip(),
            "postal_code": (address_data.get("postal_code") or "").strip(),
            "is_active": True,
        }

        if user and user.is_authenticated:
            filters["user"] = user
        else:
            filters["session_key"] = session_key
            filters["user__isnull"] = True

        # Django ORM uses parameterized queries - safe from SQL injection
        queryset = UserAddress.objects.filter(**filters)
        if exclude_id:
            queryset = queryset.exclude(id=exclude_id)

        return queryset.first()

    def format_serializer_errors(self, errors):
        """Format serializer errors into user-friendly messages"""
        messages = []
        for field, msgs in errors.items():
            if isinstance(msgs, list):
                messages.extend(msgs)
            else:
                messages.append(str(msgs))
        return messages
