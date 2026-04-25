from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin
from django.utils.html import format_html
from django.utils import timezone
from django.urls import path
from django.shortcuts import redirect
from django.db import transaction

from ..models import DeliveryZone, DeliveryZoneUpload
from ..models.partner_models import (
    DeliveryPartnerProfile,
    DeliveryWallet,
    WalletTransaction,
    WithdrawalRequest,
    DeliveryAssignmentBatch,
    DeliveryBatchItems,
    DeliveryOTP,
    DeliveryLog,
)

# ─────────────────────────────────────────────
# Zone
# ─────────────────────────────────────────────
class DeliveryZoneAdmin(GISModelAdmin):
    default_zoom = 5
    list_display = ["name", "storage_location", "is_active", "created_at", "updated_at"]
    list_filter  = ["is_active", "storage_location"]


class DeliveryZoneUploadAdmin(admin.ModelAdmin):
    list_display = ["name", "storage_location", "geojson_file", "processed", "created_at"]
    list_filter  = ["storage_location", "processed"]


admin.site.register(DeliveryZone, DeliveryZoneAdmin)
admin.site.register(DeliveryZoneUpload, DeliveryZoneUploadAdmin)


# ─────────────────────────────────────────────
# Inlines
# ─────────────────────────────────────────────

class DeliveryWalletInline(admin.StackedInline):
    model          = DeliveryWallet
    readonly_fields = (
        "total_earned", "total_withdrawn", "current_balance",
        "today_earned", "today_deliveries", "last_reset_date", "updated_at",
    )
    can_delete = False
    extra      = 0


class WalletTransactionInline(admin.TabularInline):
    model           = WalletTransaction
    readonly_fields = ("transaction_type", "amount", "note", "created_at")
    can_delete      = False
    extra           = 0
    ordering        = ("-created_at",)
    max_num         = 20


class DeliveryBatchItemsInline(admin.TabularInline):
    """Shows all orders inside a batch."""
    model           = DeliveryBatchItems
    fields          = ("order", "attempt_number")
    readonly_fields = ("order", "attempt_number")
    can_delete      = False
    extra           = 0


class DeliveryLogInline(admin.TabularInline):
    """Shows logs inside a batch item detail."""
    model           = DeliveryLog
    readonly_fields = ("event", "note", "timestamp")
    can_delete      = False
    extra           = 0
    ordering        = ("-timestamp",)


# ─────────────────────────────────────────────
# DeliveryPartnerProfile
# ─────────────────────────────────────────────

@admin.register(DeliveryPartnerProfile)
class DeliveryPartnerProfileAdmin(admin.ModelAdmin):
    list_display   = ["employee_id", "full_name", "colored_status", "is_active_duty", "zone", "vehicle_type", "vehicle_number", "joining_date", "profile_image_preview"]
    list_filter    = ["status", "is_active_duty", "zone", "vehicle_type", "gender", "blood_group"]
    search_fields  = ["first_name", "last_name", "employee_id", "user__phone_number", "vehicle_number", "license_number"]
    readonly_fields = ("created_at", "updated_at", "profile_image_preview")
    list_editable  = ["is_active_duty"]
    ordering       = ["-created_at"]
    inlines        = [DeliveryWalletInline]

    fieldsets = (
        ("👤 Personal Info", {
            "fields": ("user", "employee_id", "first_name", "last_name", "dob", "gender", "blood_group", "profile_image", "profile_image_preview")
        }),
        ("📞 Contact", {"fields": ("emergency_contact", "address")}),
        ("🏍️ Vehicle & License", {
            "fields": ("vehicle_type", "vehicle_number", "license_number", "vehicle_insurance_expiry")
        }),
        ("💼 Professional", {
            "fields": ("zone", "joining_date", "status", "is_active_duty")
        }),
        ("🏦 Bank Details", {
            "fields": ("bank_account_number", "ifsc_code", "bank_name"),
            "classes": ("collapse",),
        }),
        ("🕒 Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    @admin.display(description="Name")
    def full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    @admin.display(description="Status")
    def colored_status(self, obj):
        colors = {"Active": "#22c55e", "Inactive": "#ef4444", "On Leave": "#f59e0b"}
        return format_html('<span style="color:{}; font-weight:600;">{}</span>', colors.get(obj.status, "#6b7280"), obj.status)

    @admin.display(description="Photo")
    def profile_image_preview(self, obj):
        if obj.profile_image:
            return format_html('<img src="{}" style="width:48px; height:48px; border-radius:50%; object-fit:cover;" />', obj.profile_image.url)
        return "—"


# ─────────────────────────────────────────────
# DeliveryAssignmentBatch
# ─────────────────────────────────────────────

@admin.register(DeliveryAssignmentBatch)
class DeliveryAssignmentBatchAdmin(admin.ModelAdmin):
    list_display    = ["batch_number", "delivery_man", "colored_status", "total_orders", "total_earnings", "slot_label", "delivery_date", "assigned_at"]
    list_filter     = ["status", "delivery_date", "assigned_at"]
    search_fields   = ["batch_number", "delivery_man__first_name", "delivery_man__last_name", "delivery_man__employee_id"]
    readonly_fields = ("batch_number", "assigned_at", "accepted_at", "completed_at", "total_earnings")
    ordering        = ["-assigned_at"]
    inlines         = [DeliveryBatchItemsInline]

    fieldsets = (
        ("Batch Info", {
            "fields": ("batch_number", "delivery_man", "status", "total_earnings", "created_by")
        }),
        ("Slot", {
            "fields": ("delivery_slot", "slot_label", "delivery_date")
        }),
        ("Timeline", {
            "fields": ("assigned_at", "accepted_at", "completed_at"),
            "classes": ("collapse",),
        }),
    )

    @admin.display(description="Status")
    def colored_status(self, obj):
        colors = {
            "pending":     "#3b82f6",
            "accepted":    "#8b5cf6",
            "in_progress": "#f59e0b",
            "completed":   "#22c55e",
            "cancelled":   "#ef4444",
        }
        return format_html('<span style="color:{}; font-weight:600;">{}</span>', colors.get(obj.status, "#6b7280"), obj.get_status_display())

    @admin.display(description="Orders")
    def total_orders(self, obj):
        return obj.assignments.count()


# ─────────────────────────────────────────────
# DeliveryBatchItems
# ─────────────────────────────────────────────

@admin.register(DeliveryBatchItems)
class DeliveryBatchItemsAdmin(admin.ModelAdmin):
    list_display    = ["id", "batch", "order", "attempt_number"]
    list_filter     = ["batch"]
    search_fields   = ["batch__batch_number", "order__order_number"]
    inlines         = [DeliveryLogInline]


# ─────────────────────────────────────────────
# DeliveryWallet
# ─────────────────────────────────────────────

@admin.register(DeliveryWallet)
class DeliveryWalletAdmin(admin.ModelAdmin):
    list_display    = ["delivery_man", "current_balance", "total_earned", "total_withdrawn", "today_earned", "today_deliveries", "last_reset_date", "updated_at"]
    search_fields   = ["delivery_man__first_name", "delivery_man__last_name", "delivery_man__employee_id"]
    readonly_fields = ("total_earned", "total_withdrawn", "current_balance", "today_earned", "today_deliveries", "last_reset_date", "updated_at")
    inlines         = [WalletTransactionInline]
    ordering        = ["-updated_at"]


# ─────────────────────────────────────────────
# WalletTransaction
# ─────────────────────────────────────────────

@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display    = ["wallet", "colored_type", "amount", "note", "created_at"]
    list_filter     = ["transaction_type", "created_at"]
    search_fields   = ["wallet__delivery_man__first_name", "wallet__delivery_man__last_name", "note"]
    readonly_fields = ("wallet", "transaction_type", "amount", "note", "created_at")
    ordering        = ["-created_at"]

    def has_add_permission(self, request): return False
    def has_delete_permission(self, request, obj=None): return False

    @admin.display(description="Type")
    def colored_type(self, obj):
        colors = {"credit": "#22c55e", "debit": "#ef4444", "bonus": "#3b82f6"}
        return format_html('<span style="color:{}; font-weight:600;">{}</span>', colors.get(obj.transaction_type, "#6b7280"), obj.get_transaction_type_display())


# ─────────────────────────────────────────────
# WithdrawalRequest
# ─────────────────────────────────────────────

@admin.register(WithdrawalRequest)
class WithdrawalRequestAdmin(admin.ModelAdmin):

    list_display = [
        "wallet",
        "amount",
        "payment_mode",
        "colored_status",
        "requested_at",
        "resolved_at",
        "action_buttons",
    ]

    list_filter = ["status", "payment_mode", "requested_at"]

    search_fields = [
        "wallet__delivery_man__first_name",
        "wallet__delivery_man__last_name",
        "upi_id",
        "bank_account_number",
    ]

    readonly_fields = ("requested_at", "resolved_at")

    ordering = ["-requested_at"]

    fieldsets = (
        ("Request Info", {
            "fields": (
                "wallet",
                "amount",
                "status",
                "admin_note",
                "requested_at",
                "resolved_at"
            )
        }),
        ("Payment Details", {
            "fields": (
                "payment_mode",
                "upi_id",
                "bank_account_number",
                "bank_ifsc",
                "bank_name",
                "account_holder_name"
            )
        }),
    )

    # ─────────────────────────────────────────────
    # Status Color
    # ─────────────────────────────────────────────

    @admin.display(description="Status")
    def colored_status(self, obj):
        colors = {
            "pending": "#f59e0b",
            "approved": "#22c55e",
            "rejected": "#ef4444"
        }

        return format_html(
            '<span style="color:{}; font-weight:600;">{}</span>',
            colors.get(obj.status, "#6b7280"),
            obj.get_status_display()
        )

    # ─────────────────────────────────────────────
    # Approve / Reject Buttons
    # ─────────────────────────────────────────────

    def action_buttons(self, obj):

        if obj.status != "pending":
            return "-"

        return format_html(
            '<a class="button" style="background:#22c55e;color:white;padding:4px 10px;border-radius:4px;text-decoration:none;" href="approve/{}/">Approve</a>&nbsp;'
            '<a class="button" style="background:#ef4444;color:white;padding:4px 10px;border-radius:4px;text-decoration:none;" href="reject/{}/">Reject</a>',
            obj.id,
            obj.id
        )

    action_buttons.short_description = "Actions"

    # ─────────────────────────────────────────────
    # Custom Admin URLs
    # ─────────────────────────────────────────────

    def get_urls(self):

        urls = super().get_urls()

        custom_urls = [
            path(
                "approve/<int:withdrawal_id>/",
                self.admin_site.admin_view(self.approve_withdrawal),
                name="approve-withdrawal",
            ),
            path(
                "reject/<int:withdrawal_id>/",
                self.admin_site.admin_view(self.reject_withdrawal),
                name="reject-withdrawal",
            ),
        ]

        return custom_urls + urls

    # ─────────────────────────────────────────────
    # Approve Withdrawal
    # ─────────────────────────────────────────────

    def approve_withdrawal(self, request, withdrawal_id):

        withdrawal = WithdrawalRequest.objects.select_related("wallet").get(id=withdrawal_id)

        if withdrawal.status != "pending":
            self.message_user(request, "Withdrawal already processed.")
            return redirect(request.META.get("HTTP_REFERER"))

        wallet = withdrawal.wallet

        if withdrawal.amount > wallet.current_balance:
            self.message_user(request, "Insufficient wallet balance.")
            return redirect(request.META.get("HTTP_REFERER"))

        try:
            with transaction.atomic():

                # Debit wallet
                wallet.debit(
                    withdrawal.amount,
                    note=f"Withdrawal approved (Request #{withdrawal.id})"
                )

                withdrawal.status = "approved"
                withdrawal.resolved_at = timezone.now()
                withdrawal.save()

                self.message_user(request, "Withdrawal approved successfully.")

        except Exception as e:
            self.message_user(request, f"Error: {str(e)}")

        return redirect(request.META.get("HTTP_REFERER"))

    # ─────────────────────────────────────────────
    # Reject Withdrawal
    # ─────────────────────────────────────────────

    def reject_withdrawal(self, request, withdrawal_id):

        withdrawal = WithdrawalRequest.objects.get(id=withdrawal_id)

        if withdrawal.status != "pending":
            self.message_user(request, "Withdrawal already processed.")
            return redirect(request.META.get("HTTP_REFERER"))

        withdrawal.status = "rejected"
        withdrawal.resolved_at = timezone.now()
        withdrawal.save()

        self.message_user(request, "Withdrawal rejected.")

        return redirect(request.META.get("HTTP_REFERER"))
    
# ─────────────────────────────────────────────
# DeliveryOTP
# ─────────────────────────────────────────────

@admin.register(DeliveryOTP)
class DeliveryOTPAdmin(admin.ModelAdmin):
    list_display    = ["batch_item", "otp", "is_verified", "created_at", "verified_at"]
    list_filter     = ["is_verified", "created_at"]
    search_fields   = ["batch_item__order__order_number", "batch_item__batch__batch_number"]
    readonly_fields = ("batch_item", "otp", "created_at", "verified_at")
    ordering        = ["-created_at"]

    def has_add_permission(self, request): return False


# ─────────────────────────────────────────────
# DeliveryLog
# ─────────────────────────────────────────────

@admin.register(DeliveryLog)
class DeliveryLogAdmin(admin.ModelAdmin):
    list_display    = ["batch_item", "event", "note", "timestamp"]
    list_filter     = ["event", "timestamp"]
    search_fields   = ["batch_item__order__order_number", "batch_item__batch__batch_number", "note"]
    readonly_fields = ("batch_item", "event", "note", "timestamp")
    ordering        = ["-timestamp"]

    def has_add_permission(self, request): return False
    def has_delete_permission(self, request, obj=None): return True