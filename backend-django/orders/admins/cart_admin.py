from django.contrib import admin
from django.urls import reverse
from django.utils import timezone
from django.utils.html import format_html


from ..models.cart_models import Cart,CartItem



# ==================
# CART Item ADMIN
# ==================


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ("added_at", "get_subtotal", "get_total", "get_total_weight", "product_weight")
    fields = (
        "product",
        "product_weight",
        "quantity",
        "unit_price",
        "cut_price",
        "get_subtotal",
        "get_total",
        "get_total_weight",
        "added_at",
    )
    raw_id_fields = ("product",)

    def get_subtotal(self, obj):
        if obj.pk:
            subtotal = obj.get_subtotal()
            return format_html("₹{}", f"{subtotal:.2f}")
        return "-"

    get_subtotal.short_description = "Subtotal"

    def get_total(self, obj):
        if obj.pk:
            total = obj.get_total()
            return format_html("₹{}", f"{total:.2f}")
        return "-"

    get_total.short_description = "Total"

    def get_total_weight(self, obj):
        if obj.pk:
            weight = obj.get_total_weight()
            return format_html("{} kg", f"{weight:.2f}")
        return "-"

    get_total_weight.short_description = "Weight"


# ==================
# CART ADMIN
# ==================


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user_link",
        "session_key_short",
        "items_count",
        "cart_subtotal",
        "cart_weight",
        "is_active",
        "updated_at",
    )
    list_filter = ("is_active", "created_at", "updated_at")
    search_fields = (
        "user__phone_number",
        "user__email",
        "user__profile__first_name",
        "user__profile__last_name",
        "session_key",
    )
    readonly_fields = (
        "created_at",
        "updated_at",
        "cart_subtotal",
        "cart_weight",
        "items_count",
    )
    date_hierarchy = "created_at"
    inlines = [CartItemInline]

    fieldsets = (
        ("Cart Information", {"fields": ("user", "session_key", "is_active")}),
        ("Cart Summary", {"fields": ("items_count", "cart_subtotal", "cart_weight")}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def user_link(self, obj):
        if obj.user:
            url = reverse("admin:accounts_user_change", args=[obj.user.pk])
            return format_html('<a href="{}">{}</a>', url, obj.user)
        return format_html('<span style="color: #999;">Guest User</span>')

    user_link.short_description = "User"
    user_link.admin_order_field = "user"

    def session_key_short(self, obj):
        if obj.session_key:
            return (
                f"{obj.session_key[:20]}..."
                if len(obj.session_key) > 20
                else obj.session_key
            )
        return "-"

    session_key_short.short_description = "Session"

    def items_count(self, obj):
        count = obj.get_items_count()
        return format_html("<strong>{}</strong> items", count)

    items_count.short_description = "Items"

    def cart_subtotal(self, obj):
        subtotal = obj.get_subtotal()
        return format_html(
            '<strong style="color: #0066cc;">₹{}</strong>', f"{subtotal:.2f}"
        )

    cart_subtotal.short_description = "Subtotal"

    def cart_weight(self, obj):
        weight = obj.get_total_weight()
        return format_html("{} kg", f"{weight:.2f}")

    cart_weight.short_description = "Total Weight"

    actions = ["mark_inactive", "delete_abandoned_carts"]

    def mark_inactive(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated} cart(s) marked as inactive.")

    mark_inactive.short_description = "Mark selected carts as inactive"

    def delete_abandoned_carts(self, request, queryset):
        # Delete carts inactive for more than 7 days
        threshold = timezone.now() - timezone.timedelta(days=7)
        abandoned = queryset.filter(is_active=False, updated_at__lt=threshold)
        count = abandoned.count()
        abandoned.delete()
        self.message_user(request, f"{count} abandoned cart(s) deleted.")

    delete_abandoned_carts.short_description = "Delete abandoned carts (7+ days)"


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "cart_link",
        "product_link",
        "quantity",
        "unit_price",
        "cut_price",
        "item_total",
        "product_weight",
        "item_weight",
        "added_at",
    )
    list_filter = ("added_at", "updated_at")
    search_fields = ("cart__user__phone_number", "product__name", "product__sku")
    readonly_fields = ("added_at", "updated_at", "item_total", "item_weight", "product_weight")
    raw_id_fields = ("cart", "product")
    filter_horizontal = ("selected_cuts",)
    date_hierarchy = "added_at"

    fieldsets = (
        ("Cart & Product", {"fields": ("cart", "product", "product_weight")}),
        (
            "Pricing",
            {
                "fields": (
                    "quantity",
                    "unit_price",
                    "selected_cuts",
                    "cut_price",
                    "item_total",
                )
            },
        ),
        ("Weight", {"fields": ("item_weight",)}),
        (
            "Timestamps",
            {"fields": ("added_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def cart_link(self, obj):
        url = reverse("admin:orders_cart_change", args=[obj.cart.pk])
        return format_html('<a href="{}">Cart #{}</a>', url, obj.cart.id)

    cart_link.short_description = "Cart"

    def product_link(self, obj):
        url = reverse("admin:products_product_change", args=[obj.product.pk])
        return format_html('<a href="{}">{}</a>', url, obj.product.name)

    product_link.short_description = "Product"

    def item_total(self, obj):
        total = obj.get_total()
        return format_html("<strong>₹{}</strong>", f"{total:.2f}")

    item_total.short_description = "Total"

    def item_weight(self, obj):
        weight = obj.get_total_weight()
        return format_html("{} kg", f"{weight:.2f}")

    item_weight.short_description = "Weight"
