import json
import uuid
from django.contrib.auth.models import AnonymousUser
from django.db import transaction
from django.http import JsonResponse
from rest_framework.exceptions import AuthenticationFailed as DRFAuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed, InvalidToken
from ..models.cart_models import Cart

class CartMixin:

    def authenticate_request(self, request):
        try:
            jwt_auth = JWTAuthentication()
            auth_result = jwt_auth.authenticate(request)
            if auth_result is not None:
                request.user, _ = auth_result
            else:
                request.user = AnonymousUser()

        except (InvalidToken, AuthenticationFailed, DRFAuthenticationFailed) as e:
            # Re-raise the exception so the View can handle it and return 401
            raise
        except Exception:
            request.user = AnonymousUser()

    def get_or_create_cart(self, request):

        if request.user.is_authenticated:
            with transaction.atomic():
                cart = (
                    Cart.objects.select_for_update()
                    .filter(user=request.user, is_active=True)
                    .first()
                )
                if cart:
                    return cart, False

                cart = Cart.objects.create(user=request.user, is_active=True)
                return cart, True
        else:
            cart_id = self.get_cart_id(request)

            if cart_id:
                cart = Cart.objects.filter(
                    session_key=cart_id, user__isnull=True, is_active=True
                ).first()
                if cart:
                    return cart, cart_id

            cart_id = str(uuid.uuid4())
            cart = Cart.objects.create(session_key=cart_id, is_active=True)
            return cart, cart_id

    def get_cart_id(self, request):
        cart_id = request.headers.get("X-Cart-ID")
        if not cart_id and request.method == "POST" or request.method == "GET":
            try:
                body = json.loads(request.body)
                cart_id = body.get("cart_id")
            except:
                pass

        return cart_id

    def json_response(self, success=True, message="", data=None, status=200):
        response_data = {
            "success": success,
            "message": message,
        }
        if data:
            response_data["data"] = data

        return JsonResponse(response_data, status=status)

    def handle_auth_error(self, exception):
        """
        Standardized handling for authentication errors.
        Returns a 401 JSON response with proper error details.
        """
        if hasattr(exception, "detail") and isinstance(exception.detail, dict):
            return JsonResponse(exception.detail, status=401)

        # Fallback for other auth errors
        return JsonResponse(
            {"detail": str(exception), "code": "authentication_failed"}, status=401
        )
