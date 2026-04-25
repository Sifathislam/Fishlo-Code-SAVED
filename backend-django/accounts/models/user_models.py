# accounts/models/user_models.py

import uuid

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

from phonenumber_field.modelfields import PhoneNumberField


class CustomUserManager(BaseUserManager):
    def create_user(self, phone_number, password=None, **extra_fields):
        if not phone_number:
            raise ValueError("The phone number must be set")

        user = self.model(phone_number=phone_number, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_number=None, email=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        if not email:
            raise ValueError("Superuser must have an email address.")
        if not password:
            raise ValueError("Superuser must have a password.")

        email = self.normalize_email(email)

        if not phone_number:
            phone_number = f"{uuid.uuid4().int % 10000000000:010d}"

        user = self.model(phone_number=phone_number, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    class Roles(models.TextChoices):
        CUSTOMER = "CUSTOMER", "Customer"
        STORE_MANAGER = "STORE_MANAGER", "Store Manager"
        DELIVERY_PARTNER = "DELIVERY_PARTNER", "Delivery Partner"
        
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    phone_number = PhoneNumberField(
        unique=True,
        region="IN",
        help_text="Required. Must be a unique Indian phone number.",
    )
    email = models.EmailField(
        max_length=255,
        unique=True,
        blank=True,
        null=True,
        help_text="Required for superusers only.",
    )
    is_active = models.BooleanField(
        default=False, help_text="Designates whether this user has verified their OTP."
    )

    role = models.CharField(
        max_length=20, choices=Roles.choices, default=Roles.CUSTOMER
    )
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = CustomUserManager()

    USERNAME_FIELD = "phone_number"
    REQUIRED_FIELDS = ["email"]

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        if self.is_superuser and self.email:
            return f"{self.email} (Admin)"
        return str(self.phone_number)

    def has_usable_password(self):
        return super().has_usable_password()
