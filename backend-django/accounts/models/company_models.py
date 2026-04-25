# accounts/models/company_models.py

from django.core.validators import RegexValidator
from django.db import models


class CompanyInfo(models.Model):
    """Stores company information that appears on invoices"""

    name = models.CharField(max_length=255, default="Fishlo Private Limited")
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)
    country = models.CharField(max_length=100, default="India")

    pan_no = models.CharField(
        max_length=10,
        validators=[
            RegexValidator(regex=r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$", message="Invalid PAN format")
        ],
    )
    gstin = models.CharField(
        max_length=15,
        validators=[
            RegexValidator(
                regex=r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$",
                message="Invalid GSTIN format",
            )
        ],
    )
    cin_no = models.CharField(max_length=21, blank=True, null=True)
    state_code = models.CharField(max_length=2)
    email = models.EmailField()
    phone = models.CharField(max_length=15, blank=True)

    logo = models.ImageField(upload_to="company_logos/", blank=True, null=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Company Information"

    def __str__(self):
        return self.name

    def get_full_address(self):
        parts = [
            self.address_line1,
            self.address_line2,
            self.city,
            self.state,
            self.pincode,
            self.country,
        ]
        return ", ".join([p for p in parts if p])
