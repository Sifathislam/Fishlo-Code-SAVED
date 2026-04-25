from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.db.models import Q

User = get_user_model()


class CustomAuthBackend(ModelBackend):

    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None or password is None:
            return None

        try:
            # Try to find user by email first, then phone number
            user = User.objects.get(Q(email=username) | Q(phone_number=username))

            # Only allow password authentication for superusers, staff, or specific roles
            if (
                user.is_superuser
                or user.is_staff
                or user.role in [User.Roles.STORE_MANAGER, User.Roles.DELIVERY_PARTNER]
            ) and user.check_password(password):
                return user

        except User.DoesNotExist:
            # Run the default password hasher once to reduce timing
            User().set_password(password)
            return None
        except User.MultipleObjectsReturned:
            # If multiple users found, try exact email match
            try:
                user = User.objects.get(email=username)
                if user.is_superuser and user.check_password(password):
                    return user
            except User.DoesNotExist:
                pass
            return None

        return None
