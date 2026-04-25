import json
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt

from rest_framework.exceptions import AuthenticationFailed as DRFAuthenticationFailed
from rest_framework_simplejwt.exceptions import AuthenticationFailed, InvalidToken

from ..mixins.cart_mixins import CartMixin

from ..services.cart_services import (
    add_to_cart_service,
    update_cart_item_service,
    increase_cart_item_service,
    decrease_cart_item_service,
    remove_cart_item_service,
    clear_cart_service,
    cart_detail_service,
    merge_cart_service,
)


@method_decorator(csrf_exempt, name="dispatch")
class AddToCartView(CartMixin, View):
    def post(self, request):
        try:
            self.authenticate_request(request)

            success, message, data, status_code = add_to_cart_service(
                request, get_or_create_cart=self.get_or_create_cart
            )
            return self.json_response(success=success, message=message, data=data, status=status_code)

        except (InvalidToken, AuthenticationFailed, DRFAuthenticationFailed) as e:
            return self.handle_auth_error(e)
        except json.JSONDecodeError:
            return self.json_response(success=False, message="Invalid JSON data", status=400)
        except Exception as e:
            print("Error From Add to cart",e)
            return self.json_response(success=False, message=str(e), status=500)


@method_decorator(csrf_exempt, name="dispatch")
class UpdateCartItemView(CartMixin, View):
    def post(self, request, item_id):
        try:
            self.authenticate_request(request)

            success, message, data, status_code = update_cart_item_service(
                request, item_id=item_id, get_or_create_cart=self.get_or_create_cart
            )
            return self.json_response(success=success, message=message, data=data, status=status_code)

        except (InvalidToken, AuthenticationFailed, DRFAuthenticationFailed) as e:
            return self.handle_auth_error(e)
        except Exception as e:
            return self.json_response(success=False, message=str(e), status=500)


@method_decorator(csrf_exempt, name="dispatch")
class IncreaseCartItemView(CartMixin, View):
    def post(self, request, item_id):
        try:
            self.authenticate_request(request)

            success, message, data, status_code = increase_cart_item_service(
                request, item_id=item_id, get_or_create_cart=self.get_or_create_cart
            )
            return self.json_response(success=success, message=message, data=data, status=status_code)

        except (InvalidToken, AuthenticationFailed, DRFAuthenticationFailed) as e:
            return self.handle_auth_error(e)
        except Exception as e:
            print("Increase API Error===>",e)
            return self.json_response(success=False, message=str(e), status=500)


@method_decorator(csrf_exempt, name="dispatch")
class DecreaseCartItemView(CartMixin, View):
    def post(self, request, item_id):
        try:
            self.authenticate_request(request)

            success, message, data, status_code = decrease_cart_item_service(
                request, item_id=item_id, get_or_create_cart=self.get_or_create_cart
            )
            return self.json_response(success=success, message=message, data=data, status=status_code)

        except (InvalidToken, AuthenticationFailed, DRFAuthenticationFailed) as e:
            return self.handle_auth_error(e)
        except Exception as e:
            return self.json_response(success=False, message=str(e), status=500)


@method_decorator(csrf_exempt, name="dispatch")
class RemoveCartItemView(CartMixin, View):
    def post(self, request, item_id):
        try:
            self.authenticate_request(request)

            success, message, data, status_code = remove_cart_item_service(
                request, item_id=item_id, get_or_create_cart=self.get_or_create_cart
            )
            return self.json_response(success=success, message=message, data=data, status=status_code)

        except (InvalidToken, AuthenticationFailed, DRFAuthenticationFailed) as e:
            return self.handle_auth_error(e)
        except Exception as e:
            return self.json_response(success=False, message=str(e), status=500)


@method_decorator(csrf_exempt, name="dispatch")
class ClearCartView(CartMixin, View):
    def post(self, request):
        try:
            self.authenticate_request(request)

            success, message, data, status_code = clear_cart_service(
                request, get_or_create_cart=self.get_or_create_cart
            )
            return self.json_response(success=success, message=message, data=data, status=status_code)

        except (InvalidToken, AuthenticationFailed, DRFAuthenticationFailed) as e:
            return self.handle_auth_error(e)
        except Exception as e:
            return self.json_response(success=False, message=str(e), status=500)


class CartDetailView(CartMixin, View):
    def get(self, request):
        try:
            self.authenticate_request(request)

            success, message, data, status_code = cart_detail_service(
                request, get_or_create_cart=self.get_or_create_cart
            )
            return self.json_response(success=success, data=data, status=status_code)

        except (InvalidToken, AuthenticationFailed, DRFAuthenticationFailed) as e:
            if hasattr(e, "detail") and isinstance(e.detail, dict):
                return JsonResponse(e.detail, status=401)
            return JsonResponse({"detail": str(e), "code": "authentication_failed"}, status=401)

        except Exception as e:
            print(e)
            return self.json_response(success=False, message=str(e), status=500)


@method_decorator(csrf_exempt, name="dispatch")
class MergeCartView(CartMixin, View):
    def post(self, request):
        try:
            self.authenticate_request(request)

            success, message, data, status_code = merge_cart_service(
                request, get_or_create_cart=self.get_or_create_cart
            )
            return self.json_response(success=success, message=message, data=data, status=status_code)

        except (InvalidToken, AuthenticationFailed, DRFAuthenticationFailed) as e:
            return self.handle_auth_error(e)
        except Exception as e:
            return self.json_response(success=False, message=str(e), status=500)
