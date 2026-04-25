# accounts/admins/company_admin.py

# Packages Imports
from django.contrib import admin

# Local Imports
from ..models import CompanyInfo


@admin.register(CompanyInfo)
class CompanyInfoAdmin(admin.ModelAdmin):
    list_display = ["name", "gstin", "pan_no", "email", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["name", "gstin", "pan_no", "email"]

    fieldsets = (
        ("Company Information", {"fields": ("name", "logo", "is_active")}),
        (
            "Address",
            {
                "fields": (
                    "address_line1",
                    "address_line2",
                    "city",
                    "state",
                    "pincode",
                    "country",
                    "state_code",
                )
            },
        ),
        ("Tax & Legal", {"fields": ("pan_no", "gstin", "cin_no")}),
        ("Contact", {"fields": ("email", "phone")}),
    )

    def has_add_permission(self, request):
        return not CompanyInfo.objects.exists()
