import json

from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from rest_framework.exceptions import AuthenticationFailed as DRFAuthenticationFailed
from rest_framework_simplejwt.exceptions import AuthenticationFailed, InvalidToken

from ..mixins import AddressMixin
from ..models import UserAddress
from ..serializers import UserAddressSerializer
from ..selectors.address_selectors import (
    get_active_addresses_for_user,
    get_active_addresses_for_session,
    get_address_for_user,
    get_address_for_session,
)
from ..services.address_service import (
    ensure_guest_session_address,
    create_address_service,
    merge_addresses_service,
    set_default_address_service,
)


@method_decorator(csrf_exempt, name="dispatch")
class AddressListCreateView(AddressMixin, View):
    def get(self, request):
        try:
            self.authenticate_request(request)

            if request.user.is_authenticated:
                addresses = get_active_addresses_for_user(request.user)
                serializer = UserAddressSerializer(addresses, many=True)
                return self.json_response(data={"addresses": serializer.data})

            session_id = ensure_guest_session_address(self, request)
            if session_id is None:
                return self.json_response(success=False, message="Please provide a valid session id", status=400)

            addresses = get_active_addresses_for_session(session_id)
            serializer = UserAddressSerializer(addresses, many=True)
            return self.json_response(data={"addresses": serializer.data, "session_id": session_id})

        except (InvalidToken, AuthenticationFailed, DRFAuthenticationFailed) as e:
            return self.handle_auth_error(e)
        except Exception as e:
            print("address =>", e)
            return self.json_response(success=False, message=str(e), status=500)

    def post(self, request):
        try:
            self.authenticate_request(request)

            payload, status_code = create_address_service(self, request)
            return self.json_response(
                success=payload.get("success", True),
                message=payload.get("message", ""),
                data=payload.get("data", {}) if payload.get("success", True) else {"errors": payload.get("errors", {})},
                status=status_code,
            )

        except (InvalidToken, AuthenticationFailed, DRFAuthenticationFailed) as e:
            return self.handle_auth_error(e)
        except json.JSONDecodeError:
            return self.json_response(success=False, message="Invalid JSON format", status=400)
        except Exception as e:
            print("error ==>", e)
            return self.json_response(success=False, message=f"An error occurred: {str(e)}", status=500)

@method_decorator(csrf_exempt, name="dispatch")
class AddressDetailView(AddressMixin, View):
    def get_address(self, request, address_id):
        try:
            if request.user.is_authenticated:
                return get_address_for_user(address_id, request.user)

            session_id = self.get_session_id(request)
            if not session_id:
                return None

            return get_address_for_session(address_id, session_id)

        except UserAddress.DoesNotExist:
            return None

    def get(self, request, address_id):
        try:
            self.authenticate_request(request)
            address = self.get_address(request, address_id)

            if not address:
                return self.json_response(success=False, message="Address not found", status=404)

            serializer = UserAddressSerializer(address)
            return self.json_response(data=serializer.data)

        except (InvalidToken, AuthenticationFailed, DRFAuthenticationFailed) as e:
            return self.handle_auth_error(e)
        except Exception as e:
            return self.json_response(success=False, message=str(e), status=500)

    def put(self, request, address_id):
        try:
            self.authenticate_request(request)
            address = self.get_address(request, address_id)

            if not address:
                return self.json_response(success=False, message="Address not found", status=404)

            data = json.loads(request.body)

            serializer = UserAddressSerializer(address, data=data, partial=True)

            if not serializer.is_valid():
                print("serializer.errors", serializer.errors)
                return self.json_response(
                    success=False,
                    message="; ".join(self.format_serializer_errors(serializer.errors)),
                    data={"errors": serializer.errors},
                    status=400,
                )

            user = request.user if request.user.is_authenticated else None
            session_id = None if user else address.session_key

            duplicate = self.is_duplicate_address(
                user=user,
                session_key=session_id,
                address_data=serializer.validated_data,
                exclude_id=address_id,
            )

            if duplicate:
                return self.json_response(success=False, message="Duplicate address exists", status=400)

            serializer.save()
            return self.json_response(message="Address updated successfully")

        except (InvalidToken, AuthenticationFailed, DRFAuthenticationFailed) as e:
            return self.handle_auth_error(e)
        except json.JSONDecodeError:
            return self.json_response(success=False, message="Invalid JSON format", status=400)
        except Exception as e:
            print("e==>", e)
            return self.json_response(success=False, message=f"An error occurred: {str(e)}", status=500)

    def delete(self, request, address_id):
        try:
            self.authenticate_request(request)
            address = self.get_address(request, address_id)

            if not address:
                return self.json_response(success=False, message="Address not found", status=404)

            if address.is_default:
                return self.json_response(success=False, message="Default address cannot be deleted", status=400)

            address.soft_delete()
            return self.json_response(message="Address deleted successfully")

        except (InvalidToken, AuthenticationFailed, DRFAuthenticationFailed) as e:
            return self.handle_auth_error(e)
        except Exception as e:
            return self.json_response(success=False, message=str(e), status=500)


@method_decorator(csrf_exempt, name="dispatch")
class MergeAddressView(AddressMixin, View):
    def post(self, request):
        try:
            self.authenticate_request(request)

            if not request.user.is_authenticated:
                return self.json_response(success=False, message="Authentication required", status=401)

            data = json.loads(request.body)
            session_id = data.get("session_id")

            if not session_id:
                return self.json_response(success=False, message="session_id required", status=400)

            payload, code = merge_addresses_service(self, request, session_id)
            return self.json_response(message=payload.get("message"), data=payload.get("data", {}), status=code)

        except (InvalidToken, AuthenticationFailed, DRFAuthenticationFailed) as e:
            return self.handle_auth_error(e)
        except json.JSONDecodeError:
            return self.json_response(success=False, message="Invalid JSON format", status=400)
        except Exception as e:
            return self.json_response(success=False, message=f"An error occurred: {str(e)}", status=500)


@method_decorator(csrf_exempt, name="dispatch")
class SetDefaultAddressView(AddressMixin, View):
    def post(self, request, address_id):
        try:
            self.authenticate_request(request)

            if request.user.is_authenticated:
                try:
                    address = get_address_for_user(address_id, request.user)
                except UserAddress.DoesNotExist:
                    return self.json_response(success=False, message="Address not found", status=404)
            else:
                session_id = self.get_session_id(request)
                if not session_id:
                    return self.json_response(success=False, message="Session required", status=400)
                try:
                    address = get_address_for_session(address_id, session_id)
                except UserAddress.DoesNotExist:
                    return self.json_response(success=False, message="Address not found", status=404)

            set_default_address_service(request, address)

            return self.json_response(message="Default address set successfully")

        except (InvalidToken, AuthenticationFailed, DRFAuthenticationFailed) as e:
            return self.handle_auth_error(e)
        except Exception as e:
            print(e)
            return self.json_response(success=False, message=str(e), status=500)
