from django.contrib import admin
from django.urls import reverse
from django.utils import timezone
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from inventory.models.delivery_slot_models import DeliveryTimeSlot
from ..models.orders_models import Order, OrderTracking, OrderAddress, OrderItem, PaymentMethodLog
from django import forms

# ==================
# ORDER ADMIN
# ==================


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = (
        "product_name",
        "sku",
        "sell_type",
        "quantity",
        "weight",
        "expected_net_weight_min_per_kg_snapshot",
        "expected_net_weight_max_per_kg_snapshot",
        "is_custom",
        "custom_note",
        "entered_by",
        "unit_price",
        "cut_price",
        "subtotal",
        "product_image_preview",
    )
    fields = (
        "product_image_preview",
        "product_name",
        "sell_type",
        "sku",
        "quantity",
        "weight",
        "expected_net_weight_min_per_kg_snapshot",
        "expected_net_weight_max_per_kg_snapshot",
        "is_custom",
        "custom_note",
        "entered_by",
        "unit_price",
        "cut_price",
        "subtotal",
    )
    can_delete = False

    def product_image_preview(self, obj):
        if obj.product_image:
            return format_html(
                '<img src="{}" width="50" height="50" style="object-fit: cover; border-radius: 4px;" />',
                obj.product_image.url,
            )
        return "-"

    product_image_preview.short_description = "Image"

    def has_add_permission(self, request, obj=None):
        return False
class OrderAddressForm(forms.ModelForm):
    class Meta:
        model = OrderAddress
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # make optional in admin
        self.fields["house_details"].required = False

    def clean(self):
        cleaned_data = super().clean()

        if not cleaned_data.get("house_details"):
            cleaned_data["house_details"] = "-"

        return cleaned_data

class OrderAddressInline(admin.StackedInline):
    model = OrderAddress
    form = OrderAddressForm   
    extra = 0
    max_num = 1
    readonly_fields = ("created_at", "get_full_address")
    fieldsets = (
        ("Contact Information", {"fields": ("full_name", "email", "phone")}),
        (
            "Address Details",
            {
                "fields": (
                    "address_type",
                    "house_details",
                    "address_line_2",
                    "city",
                    "state",
                    "postal_code",
                    "country",
                    "get_full_address",
                    "billing_address",
                    "is_billing_same_as_shipping",
                ),
                "classes": ("collapse",),
            },
        ),
        ("Reference", {"fields": ("user_address", "created_at")}),
    )

    def get_full_address(self, obj):
        if obj.pk:
            return obj.get_full_address()
        return "-"

    get_full_address.short_description = "Full Address"


class OrderTrackingInline(admin.TabularInline):
    model = OrderTracking
    extra = 1
    readonly_fields = ("timestamp", "updated_by")
    fields = ("status", "location", "completed", "is_current", "updated_by", "timestamp")
    ordering = ("-timestamp",)


class PaymentMethodLogInline(admin.TabularInline):
    model = PaymentMethodLog
    extra = 0
    readonly_fields = ("old_method", "new_method", "changed_by", "changed_at", "notes")
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


class OrderAdminForm(forms.ModelForm):
    created_at_manual = forms.DateTimeField(
        required=False,
        label="Created at",
        widget=forms.DateTimeInput(attrs={"type": "datetime-local"}),
    )

    class Meta:
        model = Order
        exclude = ["created_at"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        if self.instance and self.instance.pk and self.instance.created_at:
            self.fields["created_at_manual"].initial = self.instance.created_at



@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    form = OrderAdminForm
    list_display = (
        "order_number",
        "customer_info",        # ← replaces user_link
        "status_badge",


        "payment_status_badge",
        "payment_method",
        "delivery_day_display",
        "delivery_slot_display",
        "items_count",
        "order_total",
        "order_weight",
        "created_at",
    )
    list_filter = (
        "status",
        "payment_status",
        "payment_method",


        "created_at",
        "updated_at",
        "estimated_delivery_date",
    )
    search_fields = (
        "order_number",
        "user__phone_number",
        "user__email",
        "user__profile__first_name",
        "user__profile__last_name",
        "transaction_id",
        "discount_code",
        "delivery_slot_label",
    )

    readonly_fields = (
        "order_number",
        "token_number",
        "items_count",
        "order_summary",
        "tracking_timeline_display",
        "delivery_day",
        "delivery_slot",
        "delivery_slot_start",
        "delivery_slot_end",
        "created_at",
        'updated_at',
        "delivery_slot_label",
    )
    date_hierarchy = "created_at"
    inlines = [OrderItemInline, OrderAddressInline, OrderTrackingInline, PaymentMethodLogInline]
    fieldsets = (
        (
            "Order Information",
            {
                "fields": (
                    "order_number",
                    "token_number",
                    "user",
                    "status",
                    "notes",
                )
            },
        ),
        (
            "Payment Details",
            {
                "fields": (
                    "payment_status",
                    "payment_method",
                    "transaction_id",
                )
            },
        ),
        (
            "Pricing",
            {
                "fields": (
                    "subtotal",
                    "vat_percentage",
                    "vat_amount",
                    "discount_code",
                    "discount_amount",
                    "discount_percentage",
                    "discount_fixed_amount",
                    "delivery_charge",
                    "partial_pay",
                    "cash_collected",
                    "remaining_amount",
                    "adjustable_amount",
                    "total_amount",
                ),"classes": ("collapse",),
            },
        ),
        (
            "Delivery Slot",
            {
                "fields": (
                    "delivery_day",
                    "delivery_slot",
                    "delivery_slot_label",
                    "delivery_slot_start",
                    "delivery_slot_end",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Delivery",
            {
                "fields": (
                    "estimated_delivery_date",
                    "delivered_at",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Order Summary",
            {
                "fields": (
                    "items_count",
                    "total_weight",
                    "total_pieces",
                    "order_summary",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Tracking Timeline",
            {
                "fields": ("tracking_timeline_display",),
                "classes": ("collapse",),
            },
        ),
        (
            "Invoice",
            {
                "fields": (
                    "invoice_pdf",
                    "invoice_generated_at",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Timestamps",
            {
                "fields": (
                    "created_at",
                    "created_at_manual",
                    "updated_at",
                ),
            },
        ),
    )

    def user_link(self, obj):
        url = reverse("admin:accounts_user_change", args=[obj.user.pk if obj.user else None])
        display = (
            obj.user.profile.get_full_name()
            if hasattr(obj.user, "profile")
            else str(obj.user)
        )
        return format_html('<a href="{}">{}</a>', url, display)

    user_link.short_description = "Customer"
    user_link.admin_order_field = "user"
    def customer_info(self, obj):
        if obj.source == "MANUAL_STORE":
            name = obj.customer_name or "—"
            phone = obj.customer_phone or "—"
        else:
            # Online order — pull from OrderAddress
            try:
                name = obj.order_address.full_name or "—"
                phone = obj.order_address.phone or "—"
            except Exception:
                name = "—"
                phone = "—"

        return format_html(
            '<strong>{}</strong><br>'
            '<span style="color:#666;font-size:11px;">📞 {}</span>',
            name, phone,
        )

    customer_info.short_description = "Customer"
    customer_info.admin_order_field = "user"


    def status_badge(self, obj):
        colors = {
            "PENDING": "#f0ad4e",
            "CONFIRMED": "#5bc0de",
            "PROCESSING": "#0275d8",
            "PACKED": "#5cb85c",
            "OUT_FOR_DELIVERY": "#5cb85c",
            "DELIVERED": "#28a745",
            "CANCELLED": "#d9534f",
        }
        color = colors.get(obj.status, "#999")
        return format_html(
            '<span style="background-color: {}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display(),
        )

    status_badge.short_description = "Status"
    status_badge.admin_order_field = "status"

    def payment_status_badge(self, obj):
        colors = {
            "PENDING": "#f0ad4e",
            "PAID": "#28a745",
            "FAILED": "#d9534f",
            "REFUNDED": "#6c757d",
        }
        color = colors.get(obj.payment_status, "#999")
        return format_html(
            '<span style="background-color: {}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: bold;">{}</span>',
            color,
            obj.get_payment_status_display(),
        )

    payment_status_badge.short_description = "Payment"
    payment_status_badge.admin_order_field = "payment_status"

    def items_count(self, obj):
        count = obj.order_items.count()
        return format_html("<strong>{}</strong> items", count)

    items_count.short_description = "Items"

    def order_total(self, obj):
        return format_html(
            '<strong style="color: #0066cc; font-size: 14px;">₹{}</strong>',
            f"{obj.total_amount:.2f}",
        )

    order_total.short_description = "Total"
    order_total.admin_order_field = "total_amount"

    def order_weight(self, obj):
        return format_html("{} kg", f"{obj.total_weight:.4f}")

    order_weight.short_description = "Weight"

    def order_summary(self, obj):
        items = obj.order_items.all()
        summary = '<div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 10px;">'
        summary += '<h3 style="margin-top: 0;">Order Summary</h3>'
        summary += '<table style="width: 100%; border-collapse: collapse;">'
        summary += '<tr style="background: #e9ecef;"><th style="padding: 8px; text-align: left;">Product</th><th style="padding: 8px; text-align: center;">Qty</th><th style="padding: 8px; text-align: right;">Price</th><th style="padding: 8px; text-align: right;">Total</th></tr>'

        for item in items:
            summary += f'<tr style="border-bottom: 1px solid #dee2e6;">'
            summary += f'<td style="padding: 8px;">{item.product_name}</td>'
            summary += (
                f'<td style="padding: 8px; text-align: center;">{item.quantity}</td>'
            )
            summary += f'<td style="padding: 8px; text-align: right;">₹{item.unit_price:.2f}</td>'
            summary += f'<td style="padding: 8px; text-align: right;">₹{item.subtotal:.2f}</td>'
            summary += "</tr>"

        summary += f'<tr><td colspan="3" style="padding: 8px; text-align: right;"><strong>Subtotal:</strong></td><td style="padding: 8px; text-align: right;">₹{obj.subtotal:.2f}</td></tr>'
        summary += f'<tr><td colspan="3" style="padding: 8px; text-align: right;"><strong>VAT ({obj.vat_percentage}%):</strong></td><td style="padding: 8px; text-align: right;">₹{obj.vat_amount:.2f}</td></tr>'

        if obj.discount_amount > 0:
            summary += f'<tr><td colspan="3" style="padding: 8px; text-align: right; color: #28a745;"><strong>Discount ({obj.discount_code}):</strong></td><td style="padding: 8px; text-align: right; color: #28a745;">-₹{obj.discount_amount:.2f}</td></tr>'

        summary += f'<tr><td colspan="3" style="padding: 8px; text-align: right;"><strong>Delivery Charge:</strong></td><td style="padding: 8px; text-align: right;">₹{obj.delivery_charge:.2f}</td></tr>'
        summary += f'<tr style="background: #e9ecef; font-size: 16px;"><td colspan="3" style="padding: 10px; text-align: right;"><strong>Total Amount:</strong></td><td style="padding: 10px; text-align: right;"><strong>₹{obj.total_amount:.2f}</strong></td></tr>'
        summary += "</table></div>"

        return format_html(summary)

    order_summary.short_description = "Detailed Summary"

    actions = [
        "mark_confirmed",
        "mark_processing",
        "mark_delivered",
        "mark_cancelled",
        "export_orders_csv",
    ]

    def mark_confirmed(self, request, queryset):
        for order in queryset:
            order.update_status(Order.OrderStatus.CONFIRMED, updated_by_user=request.user, updated_from='ADMIN_DASHBOARD')
        self.message_user(request, f"{queryset.count()} order(s) marked as confirmed.")

    mark_confirmed.short_description = "Mark as Confirmed"

    def mark_processing(self, request, queryset):
        for order in queryset:
            order.update_status(Order.OrderStatus.PROCESSING, updated_by_user=request.user, updated_from='ADMIN_DASHBOARD')
        self.message_user(request, f"{queryset.count()} order(s) marked as processing.")

    mark_processing.short_description = "Mark as Processing"

    def mark_delivered(self, request, queryset):
        for order in queryset:
            # For delivered, we also set timestamp. update_status handles status and tracking.
            # We might need to set delivered_at manually or inside update_status?
            # update_status only does status & tracking.
            # Let's set delivered_at here then call update_status
            order.delivered_at = timezone.now()
            order.save(update_fields=['delivered_at'])
            order.update_status(Order.OrderStatus.DELIVERED, updated_by_user=request.user, updated_from='ADMIN_DASHBOARD')
        self.message_user(request, f"{queryset.count()} order(s) marked as delivered.")

    mark_delivered.short_description = "Mark as Delivered"

    def mark_cancelled(self, request, queryset):
        for order in queryset:
            order.update_status(Order.OrderStatus.CANCELLED, updated_by_user=request.user, updated_from='ADMIN_DASHBOARD')
        self.message_user(request, f"{queryset.count()} order(s) marked as cancelled.")

    mark_cancelled.short_description = "Mark as Cancelled"
    def export_orders_csv(self, request, queryset):
        import csv
        from django.http import HttpResponse

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="orders.csv"'

        writer = csv.writer(response)
        writer.writerow([
            "Order Number",
            "Token Number",
            "Source",
            "Purchase Type",
            "Status",
            "Payment Status",
            "Payment Method",
            "Transaction ID",
            # Customer
            "Customer Email",
            "Customer Name",
            "Customer Phone",
            # Pricing
            "Subtotal",
            "VAT %",
            "VAT Amount",
            "Discount Code",
            "Discount Amount",
            "Discount %",
            "Discount Fixed Amount",
            "Delivery Charge",
            "Adjustable Amount",
            "Total Amount",
            "Partial Pay",
            "Remaining Amount",
            "Cash Collected",
            # Weight & Pieces
            "Total Weight (kg)",
            "Total Pieces",
            # Delivery
            "Delivery Day",
            "Delivery Slot",
            "Estimated Delivery Date",
            "Delivered At",
            # Address
            "Full Name",
            "Phone",
            "House Details",
            "Address Line 2",
            "City",
            "State",
            "Postal Code",
            "Country",
            # Meta
            "Notes",
            "Cancellation Reason",
            "Cancelled At",
            "Cancelled By",
            "Created By",
            "Created At",
            "Updated At",
        ])

        queryset = queryset.select_related(
            "user", "order_address", "cancelled_by", "created_by", "delivery_slot"
        )

        for order in queryset:
            addr = getattr(order, "order_address", None)

            # Customer name & phone logic
            if order.source == order.OrderSource.MANUAL_STORE:
                customer_name  = order.customer_name  or ""
                customer_phone = order.customer_phone or ""
            else:
                customer_name  = addr.full_name if addr else ""
                customer_phone = addr.phone     if addr else ""

            writer.writerow([
                order.order_number,
                order.token_number or "",
                order.get_source_display(),
                order.get_purchase_type_display(),
                order.get_status_display(),
                order.payment_status,
                order.payment_method,
                order.transaction_id or "",
                # Customer
                order.user.email if order.user else "",
                customer_name,
                customer_phone,
                # Pricing
                order.subtotal,
                order.vat_percentage,
                order.vat_amount,
                order.discount_code or "",
                order.discount_amount,
                order.discount_percentage,
                order.discount_fixed_amount,
                order.delivery_charge,
                order.adjustable_amount,
                order.total_amount,
                order.partial_pay,
                order.remaining_amount,
                order.cash_collected,
                # Weight & Pieces
                order.total_weight,
                order.total_pieces or 0,
                # Delivery
                order.get_delivery_day_display(),
                order.delivery_slot_label or "",
                order.estimated_delivery_date.strftime("%Y-%m-%d") if order.estimated_delivery_date else "",
                order.delivered_at.strftime("%Y-%m-%d %H:%M:%S") if order.delivered_at else "",
                # Address
                addr.full_name    if addr else "",
                addr.phone        if addr else "",
                addr.house_details if addr else "",
                addr.address_line_2 or "" if addr else "",
                addr.city         if addr else "",
                addr.state        if addr else "",
                addr.postal_code  if addr else "",
                addr.country      if addr else "",
                # Meta
                order.notes or "",
                order.cancellation_reason or "",
                order.cancelled_at.strftime("%Y-%m-%d %H:%M:%S") if order.cancelled_at else "",
                str(order.cancelled_by) if order.cancelled_by else "",
                str(order.created_by)   if order.created_by   else "",
                order.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                order.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
            ])

        return response

    export_orders_csv.short_description = "Export selected orders to CSV"


    # ADD THIS NEW METHOD
    def tracking_timeline_display(self, obj):
        """Display tracking timeline in admin"""
        timeline = obj.get_tracking_timeline()

        if not timeline:
            return format_html(
                '<p style="color: #95a5a6;">No tracking information available</p>'
            )

        html = '<div style="margin: 10px 0;">'

        for item in timeline:
            # Icon based on completion
            if item["completed"]:
                icon = "✅"
                color = "#27ae60"
                weight = "bold"
            elif item["is_current"]:
                icon = "🔄"
                color = "#3498db"
                weight = "bold"
            else:
                icon = "⭕"
                color = "#95a5a6"
                weight = "normal"

            html += f'<div style="margin: 8px 0; padding: 10px; border-left: 3px solid {color}; background-color: #f8f9fa;">'
            html += f'<span style="font-weight: {weight}; color: {color};">{icon} {item["status_display"]}</span>'

            if item["timestamp"]:
                from django.utils import timezone

                local_time = timezone.localtime(item["timestamp"])
                timestamp = local_time.strftime("%B %d, %Y at %I:%M %p")
                html += f'<br><small style="color: #7f8c8d;">📅 {timestamp}</small>'
            html += "</div>"

        html += "</div>"

        return mark_safe(html)

    tracking_timeline_display.short_description = "Tracking Timeline"

    # UPDATE EXISTING ACTIONS
    def save_model(self, request, obj, form, change):
        created_at_manual = form.cleaned_data.get("created_at_manual")

        if change and 'status' in form.changed_data:
            obj._skip_signal_tracking = True

        super().save_model(request, obj, form, change)

        # update AFTER save
        if created_at_manual:
            Order.objects.filter(pk=obj.pk).update(created_at=created_at_manual)
            obj.created_at = created_at_manual

        # tracking logic
        if change and 'status' in form.changed_data:
            obj.update_status(
                obj.status,
                updated_by_user=request.user,
                updated_from='ADMIN_DASHBOARD'
            )
            
# ==================

    def delivery_slot_display(self, obj):
        if obj.delivery_slot_label:
            return obj.delivery_slot_label
        if obj.delivery_slot_start and obj.delivery_slot_end:
            return f"{obj.delivery_slot_start.strftime('%I:%M %p')} - {obj.delivery_slot_end.strftime('%I:%M %p')}"
        return "-"

    delivery_slot_display.short_description = "Delivery Slot"
    delivery_slot_display.admin_order_field = "delivery_slot_start"


    def delivery_day_display(self, obj):
        return obj.get_delivery_day_display()
        
    delivery_day_display.short_description = "Delivery Day"
    delivery_day_display.admin_order_field = "delivery_day"
    
# ORDER TRACKING ADMIN
# ==================


@admin.register(OrderTracking)
class OrderTrackingAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "order_link",
        "status_badge",
        "location",
        "formatted_timestamp",
        "has_notes",
    )
    list_filter = ("status", "timestamp", "completed", "is_current")
    search_fields = ("order__order_number", "location", "notes")
    readonly_fields = ("timestamp", "formatted_timestamp", "updated_by")
    date_hierarchy = "timestamp"
    list_per_page = 25
    autocomplete_fields = ["order"]

    fieldsets = (
        (
            "Tracking Details",
            {
                "fields": (
                    "status",
                    "location",
                    "assigned_for_delivery",
                    "completed",
                    "is_current",
                    "updated_by",
                    "notes",
                )
            },
        ),
        (
            "Timeline",
            {"fields": ("timestamp", "formatted_timestamp"), "classes": ("collapse",)},
        ),
    )

    def order_link(self, obj):
        """Clickable link to order detail page"""
        url = reverse("admin:orders_order_change", args=[obj.order.pk])
        return format_html(
            '<a href="{}" style="font-weight: 500;">{}</a>', url, obj.order.order_number
        )

    order_link.short_description = "Order Number"
    order_link.admin_order_field = "order__order_number"

    def status_badge(self, obj):
        """Display status with colored badge"""
        status_colors = {
            "PENDING": "#95a5a6",
            "CONFIRMED": "#3498db",  # Blue
            "PROCESSING": "#f39c12",  # Orange
            "PACKED": "#e67e22",  # Dark Orange
            "OUT_FOR_DELIVERY": "#16a085",  # Teal
            "DELIVERED": "#27ae60",  # Green
            "CANCELLED": "#c0392b",
        }
        color = status_colors.get(obj.status, "#95a5a6")
        return format_html(
            '<span style="background-color: {}; color: white; padding: 5px 12px; '
            "border-radius: 12px; font-size: 11px; font-weight: 600; "
            'display: inline-block; text-transform: uppercase;">{}</span>',
            color,
            obj.get_status_display(),
        )

    status_badge.short_description = "Status"
    status_badge.admin_order_field = "status"

    def formatted_timestamp(self, obj):
        """Human-readable timestamp with icon"""
        from django.utils import timezone

        local_time = timezone.localtime(obj.timestamp)
        return format_html(
            '<span style="color: #666;">📅 {}</span>',
            local_time.strftime("%b %d, %Y at %I:%M %p"),
        )

    formatted_timestamp.short_description = "Date & Time"

    def has_notes(self, obj):
        """Show if tracking entry has notes"""
        if obj.notes:
            return format_html(
                '<span style="color: #27ae60; font-size: 16px;" title="{}">✓</span>',
                obj.notes[:50] + "..." if len(obj.notes) > 50 else obj.notes,
            )
        return format_html('<span style="color: #e74c3c;">✗</span>')

    has_notes.short_description = "Notes"
    has_notes.admin_order_field = "notes"

    def get_queryset(self, request):
        """Optimize queries with select_related"""
        queryset = super().get_queryset(request)
        return queryset.select_related("order", "order__user")

    def has_add_permission(self, request, obj=None):
        """Prevent direct creation - use Order admin or API"""
        return False

    def has_delete_permission(self, request, obj=None):
        """Prevent deletion of tracking records"""
        return True

    def save_model(self, request, obj, form, change):
        """Auto-update order status when tracking is added"""
        super().save_model(request, obj, form, change)

        # Update the order's current status to match latest tracking
        if obj.status == "delivered":
            obj.order.status = "delivered"
            obj.order.save(update_fields=["status"])

    class Media:
        css = {
            "all": (
                "admin/css/custom_ordertracking.css",
            )  # Optional: for additional styling
        }


@admin.register(PaymentMethodLog)
class PaymentMethodLogAdmin(admin.ModelAdmin):
    list_display = ("order_link", "old_method", "new_method", "changed_by", "changed_at")
    list_filter = ("old_method", "new_method", "changed_at")
    search_fields = ("order__order_number", "changed_by__username", "notes")
    readonly_fields = ("order", "old_method", "new_method", "changed_by", "changed_at", "notes")
    date_hierarchy = "changed_at"

    def order_link(self, obj):
        url = reverse("admin:orders_order_change", args=[obj.order.pk])
        return format_html('<a href="{}">{}</a>', url, obj.order.order_number)

    order_link.short_description = "Order"

    def has_add_permission(self, request):
        return False

