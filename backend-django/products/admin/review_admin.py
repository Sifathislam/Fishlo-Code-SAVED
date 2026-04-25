from django.contrib import admin

from ..models import Review


# ------------
# REVIEW ADMIN
# ------------
@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("user", "product", "star", "is_approved", "created_at")
    list_filter = ("is_approved", "star", "created_at")
    search_fields = ("product__name", "comment", "user__phone_number")
    readonly_fields = ("user", "product", "created_at")
    list_editable = ("is_approved",)
    autocomplete_fields = ["user", "product"]

    fieldsets = (
        ("Review Information", {"fields": ("user", "product", "star", "comment")}),
        ("Moderation", {"fields": ("is_approved",)}),
        ("Metadata", {"fields": ("created_at",), "classes": ("collapse",)}),
    )

    actions = ["approve_reviews", "unapprove_reviews"]

    def approve_reviews(self, request, queryset):
        updated = queryset.update(is_approved=True)
        self.message_user(request, f"{updated} review(s) approved successfully.")

    approve_reviews.short_description = "Approve selected reviews"

    def unapprove_reviews(self, request, queryset):
        updated = queryset.update(is_approved=False)
        self.message_user(request, f"{updated} review(s) unapproved successfully.")

    unapprove_reviews.short_description = "Unapprove selected reviews"
