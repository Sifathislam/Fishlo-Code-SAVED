from django.db import transaction
from django.db.models import Q
from rest_framework import status
from django.contrib.auth import get_user_model

from store_management.utils import get_safe_storage_location
from delivery.models.partner_models import DeliveryPartnerProfile
from delivery.serializers.store_delivery_serializers import (
    StoreDeliveryPartnerListSerializer,
    StoreDeliveryPartnerCreateUpdateSerializer
)

User = get_user_model()

def get_store_delivery_partners(request):
    try:
        storage_location = get_safe_storage_location(request)
        if not storage_location:
            return False, "No storage location found for the store manager.", [], status.HTTP_404_NOT_FOUND

        search_query = request.query_params.get("search", "")
        duty_status = request.query_params.get("status", "All")
        vehicle_type = request.query_params.get("vehicle_type", "All")

        # Get all partners whose zone maps to this storage location
        queryset = DeliveryPartnerProfile.objects.filter(
            zone__storage_location=storage_location
        ).select_related("user", "zone", "wallet")

        if search_query:
            queryset = queryset.filter(
                Q(first_name__icontains=search_query) |
                Q(last_name__icontains=search_query) |
                Q(user__phone_number__icontains=search_query) |
                Q(vehicle_number__icontains=search_query)
            )

        if duty_status != "All":
            queryset = queryset.filter(status=duty_status)
            
        if vehicle_type != "All":
            queryset = queryset.filter(vehicle_type=vehicle_type)

        serializer = StoreDeliveryPartnerListSerializer(queryset, many=True)
        return True, "Delivery partners fetched successfully.", serializer.data, status.HTTP_200_OK

    except Exception as e:
        return False, str(e), [], status.HTTP_500_INTERNAL_SERVER_ERROR


def create_store_delivery_partner(request, data):
    try:
        storage_location = get_safe_storage_location(request)
        if not storage_location:
            return False, "No storage location found for the store manager.", None, status.HTTP_404_NOT_FOUND

        # Just grab the first zone for this storage location for now
        zone = storage_location.delivery_zones.first()
        if not zone:
            return False, "No delivery zone is linked to this store.", None, status.HTTP_400_BAD_REQUEST

        serializer = StoreDeliveryPartnerCreateUpdateSerializer(data=data)
        if not serializer.is_valid():
            return False, "Validation failed", serializer.errors, status.HTTP_400_BAD_REQUEST

        phone = serializer.validated_data.pop("phone")
        email = serializer.validated_data.pop("email", None)
        password = serializer.validated_data.pop("password", "Delivery@123") # Default password if not provided

        with transaction.atomic():
            # Check if user with phone exists
            existing_user = User.objects.filter(phone_number=phone).first()
            
            if existing_user:
                # Check if this user already has a delivery profile
                if hasattr(existing_user, "delivery_partner_profile"):
                    return False, "This user is already registered as a delivery partner.", {"phone": ["This user is already registered as a delivery partner."]}, status.HTTP_400_BAD_REQUEST
                user = existing_user
                # Optionally update password if provided
                if password and password != "Delivery@123":
                    user.set_password(password)
                if email:
                    user.email = email
                user.role = User.Roles.DELIVERY_PARTNER
                user.is_active = True # Allow login
                user.save()
            else:
                # Create new user
                user = User.objects.create_user(
                    phone_number=phone, 
                    email=email,
                    password=password,
                    role=User.Roles.DELIVERY_PARTNER,
                    is_active=True # Allow login
                )
            
            # Create profile
            profile = DeliveryPartnerProfile.objects.create(
                user=user,
                zone=zone,
                **serializer.validated_data
            )
            
            response_serializer = StoreDeliveryPartnerListSerializer(profile)
            return True, "Delivery partner created successfully.", response_serializer.data, status.HTTP_201_CREATED

    except Exception as e:
        return False, str(e), None, status.HTTP_500_INTERNAL_SERVER_ERROR


def update_store_delivery_partner(request, partner_id, data):
    try:
        storage_location = get_safe_storage_location(request)
        if not storage_location:
            return False, "No storage location found.", None, status.HTTP_404_NOT_FOUND

        try:
            profile = DeliveryPartnerProfile.objects.get(
                id=partner_id, 
                zone__storage_location=storage_location
            )
        except DeliveryPartnerProfile.DoesNotExist:
            return False, "Delivery partner not found or doesn't belong to your store.", None, status.HTTP_404_NOT_FOUND

        serializer = StoreDeliveryPartnerCreateUpdateSerializer(profile, data=data, partial=True)
        if not serializer.is_valid():
            return False, "Validation failed.", serializer.errors, status.HTTP_400_BAD_REQUEST

        phone = serializer.validated_data.pop("phone", None)
        email = serializer.validated_data.pop("email", None)
        password = serializer.validated_data.pop("password", None)

        with transaction.atomic():
            if phone and phone != getattr(profile.user, "phone_number", ""):
                 if User.objects.filter(phone_number=phone).exclude(id=profile.user.id).exists():
                     return False, "Another user with this phone number already exists.", {"phone": ["Another user with this phone number already exists."]}, status.HTTP_400_BAD_REQUEST
                 profile.user.phone_number = phone
            
            if email:
                if User.objects.filter(email=email).exclude(id=profile.user.id).exists():
                    return False, "Another user with this email already exists.", {"email": ["Another user with this email already exists."]}, status.HTTP_400_BAD_REQUEST
                profile.user.email = email
                 
            if password:
                profile.user.set_password(password)
                
            profile.user.save()
            serializer.save()

            response_serializer = StoreDeliveryPartnerListSerializer(profile)
            return True, "Delivery partner updated successfully.", response_serializer.data, status.HTTP_200_OK

    except Exception as e:
        return False, str(e), None, status.HTTP_500_INTERNAL_SERVER_ERROR


def deactivate_store_delivery_partner(request, partner_id):
    try:
        storage_location = get_safe_storage_location(request)
        
        try:
            profile = DeliveryPartnerProfile.objects.get(
                id=partner_id, 
                zone__storage_location=storage_location
            )
        except DeliveryPartnerProfile.DoesNotExist:
            return False, "Delivery partner not found.", None, status.HTTP_404_NOT_FOUND

        profile.status = "Inactive"
        profile.is_active_duty = False
        profile.save(update_fields=["status", "is_active_duty"])

        return True, "Delivery partner deactivated successfully.", None, status.HTTP_200_OK

    except Exception as e:
        return False, str(e), None, status.HTTP_500_INTERNAL_SERVER_ERROR
