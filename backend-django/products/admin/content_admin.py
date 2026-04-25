from django.contrib import admin

from ..models import Source, WhatYouGet


# --------------------
# What You Get ADMIN
# -------------------
@admin.register(WhatYouGet)
class WhatYouGetAdmin(admin.ModelAdmin):
    list_display = ["name", "product", "created_at", "updated_at"]
    search_fields = ["name", "content", "product__name"]
    list_filter = ["created_at", "updated_at"]
    readonly_fields = ["created_at", "updated_at"]
    autocomplete_fields = ["product"]


# ---------------
# Source ADMIN
# --------------
@admin.register(Source)
class SourceAdmin(admin.ModelAdmin):
    list_display = ["name", "product", "created_at", "updated_at"]
    search_fields = ["name", "content", "product__name"]
    list_filter = ["created_at", "updated_at"]
    readonly_fields = ["created_at", "updated_at"]
    autocomplete_fields = ["product"]
