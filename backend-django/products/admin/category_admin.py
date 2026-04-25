from django.contrib import admin
from django.utils.html import format_html

from ..models import Category, SubCategory


# ------------
# CATEGORY ADMIN
# ------------
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("image_preview", "name", "product_count", "created_at")
    list_filter = ("created_at",)
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ("created_at", "image_preview")

    fieldsets = (
        ("Basic Information", {"fields": ("name", "slug", "description")}),
        ("Media", {"fields": ("image", "image_preview")}),
        (
            "Metadata",
            {"fields": ("created_at", "deleted_at"), "classes": ("collapse",)},
        ),
    )

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" width="50" height="50" style="object-fit: cover;" />',
                obj.image.url,
            )
        return "No Image"

    image_preview.short_description = "Preview"

    def product_count(self, obj):
        return obj.products.count()

    product_count.short_description = "Products"


# ------------
# SUBCATEGORY ADMIN
# ------------
@admin.register(SubCategory)
class SubCategoryAdmin(admin.ModelAdmin):
    list_display = ("image_preview", "name", "category", "product_count", "created_at")
    list_filter = ("category", "created_at")
    search_fields = ("name", "description", "category__name")
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ("created_at", "image_preview")
    autocomplete_fields = ["category"]

    fieldsets = (
        ("Basic Information", {"fields": ("category", "name", "slug", "description")}),
        ("Media", {"fields": ("image", "image_preview")}),
        (
            "Metadata",
            {"fields": ("created_at", "deleted_at"), "classes": ("collapse",)},
        ),
    )

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" width="100" height="100" style="object-fit: cover;" />',
                obj.image.url,
            )
        return "No Image"

    image_preview.short_description = "Preview"

    def product_count(self, obj):
        return obj.products.count()

    product_count.short_description = "Products"
