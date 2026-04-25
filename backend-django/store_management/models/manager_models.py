from django.db import models
from phonenumber_field.modelfields import PhoneNumberField
from django.contrib.auth import get_user_model
from delivery.models import DeliveryZone

User = get_user_model()

class StoreManagerProfile(models.Model):
    GENDER_CHOICES = [
        ("Male", "Male"),
        ("Female", "Female"),
        ("Other", "Other"),
    ]

    BLOOD_GROUP_CHOICES = [
        ("A+", "A+"),
        ("A-", "A-"),
        ("B+", "B+"),
        ("B-", "B-"),
        ("O+", "O+"),
        ("O-", "O-"),
        ("AB+", "AB+"),
        ("AB-", "AB-"),
    ]

    STATUS_CHOICES = [
        ("Active", "Active"),
        ("Inactive", "Inactive"),
        ("On Leave", "On Leave"),
    ]

    ROLE_CHOICES = [
        ("Manager", "Manager"),
        ("Staff", "Staff"),
    ]

    SHIFT_CHOICES = [
        ("Full Time", "Full Time"),
    ]
    user = models.OneToOneField(
        User, on_delete=models.PROTECT, related_name="store_manager_profile"
    )
    storage_location = models.ForeignKey(
        'inventory.StorageLocation',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="store_managers",
    )
    
    # Personal Info
    employee_id = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default="Male")
    blood_group = models.CharField(
        max_length=5, choices=BLOOD_GROUP_CHOICES, default="O+"
    )
    profile_image = models.ImageField(upload_to="manager/profiles/", blank=True, null=True)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default="Manager")
    shift_timing = models.CharField(max_length=20, choices=SHIFT_CHOICES, default="Full Time")
    # Contact Info
    emergency_contact = PhoneNumberField(blank=True, null=True)
    current_address = models.TextField(blank=True)
    permanent_address = models.TextField(blank=True)

    # Professional Info
    joining_date = models.DateField()
    salary = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Active")
    is_active_duty = models.BooleanField(default=True)

    # Financial Info
    bank_account_number = models.CharField(max_length=50, blank=True)
    ifsc_code = models.CharField(max_length=20, blank=True)
    bank_name = models.CharField(max_length=100, blank=True)
    account_holder_name = models.CharField(max_length=100, blank=True)

    # Documents
    document_proof = models.FileField(upload_to="manager/documents/", blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.employee_id})"
