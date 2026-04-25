import datetime
from django.contrib.auth import get_user_model
from store_management.models import StoreManagerProfile
from store_management.utils import get_safe_storage_location

User = get_user_model()


def create_staff(*, validated_data: dict,request) -> StoreManagerProfile:
    email = validated_data.pop('email')
    phone_number = validated_data.pop('phone_number')  # required, no default
    password = validated_data.pop('password', None)
    validated_data.pop('storage_location', None)
    storage_location = get_safe_storage_location(request)

    last = StoreManagerProfile.objects.order_by('-id').first()
    next_id = (last.id + 1) if last else 1
    employee_id = f"EMP{next_id:04d}"

    user = User.objects.create_user(
        phone_number=phone_number,
        email=email,
        password=password,
        role=User.Roles.STORE_MANAGER,  
        is_active=True,                 
    )

    profile = StoreManagerProfile.objects.create(
        user=user,
        employee_id=employee_id,
        storage_location=storage_location,
        joining_date=validated_data.pop('joining_date', datetime.date.today()),
        **validated_data
    )
    return profile


def update_staff(*, instance: StoreManagerProfile, validated_data: dict,request) -> StoreManagerProfile:
    email = validated_data.pop('email', None)
    phone_number = validated_data.pop('phone_number', None)
    storage_location = get_safe_storage_location(request)

    if email:
        instance.user.email = email
    if phone_number:
        instance.user.phone_number = phone_number

    if email or phone_number:
        instance.user.save()

    for attr, value in validated_data.items():
        setattr(instance, attr, value)

    if not instance.storage_location:
        instance.storage_location = storage_location
    instance.save()
    return instance


def delete_staff(*, instance: StoreManagerProfile) -> None:
    instance.user.delete()


def toggle_staff_status(*, instance: StoreManagerProfile, new_status: str) -> StoreManagerProfile:
    if not new_status:
        raise ValueError("Status is required.")

    valid_statuses = [choice[0] for choice in StoreManagerProfile.STATUS_CHOICES]
    if new_status not in valid_statuses:
        raise ValueError(f"Invalid status. Choose from: {valid_statuses}")

    instance.status = new_status
    instance.save(update_fields=['status'])
    return instance