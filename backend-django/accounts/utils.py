
# Packages Imports
import uuid
from django.contrib.auth import get_user_model
from .models import UserAddress
# Local Imports
from .serializers import (
    UserAddressSerializer,
)
User = get_user_model()

def addressCreatorFunction(self, request, data):
    serializer = UserAddressSerializer(data=data)

    if not serializer.is_valid():
        return {
            "success": False,
            "message": "; ".join(self.format_serializer_errors(serializer.errors)),
            "errors": serializer.errors,
        }, 400

    validated_data = serializer.validated_data
    user = request.user if request.user.is_authenticated else None
    session_id = None if user else (self.get_session_id(request) or str(uuid.uuid4()))

    duplicate = self.is_duplicate_address(user=user, session_key=session_id, address_data=validated_data)
    if duplicate:
        for field, value in validated_data.items():
            setattr(duplicate, field, value)
        duplicate.save()

        payload = {"address_id": duplicate.id}
        if not user:
            payload["session_id"] = session_id

        return {"success": True, "message": "Address updated successfully", "data": payload}, 200

    validated_data["user"] = user
    validated_data["session_key"] = session_id
    address = UserAddress.objects.create(**validated_data)

    payload = {"address_id": address.id}
    if not user:
        payload["session_id"] = session_id

    return {"success": True, "message": "Address created successfully", "data": payload}, 201
