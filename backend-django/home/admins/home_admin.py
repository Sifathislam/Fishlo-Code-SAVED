from django.contrib import admin

from ..models import Banner, Offer, Subscriber


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ["id", "title", "created_at"]
    search_fields = ["title"]


@admin.register(Offer)
class OfferAdmin(admin.ModelAdmin):
    list_display = ["id", "slot", "start_date", "end_date", "active"]
    list_filter = ["active", "start_date", "end_date"]
    search_fields = ["slot__title"]


@admin.register(Subscriber)
class SubscriberAdmin(admin.ModelAdmin):
    list_display = ["email", "user", "is_active", "created_at"]
    search_fields = ["email", "user__username"]
    list_filter = ["is_active", "created_at"]
    readonly_fields = ["created_at"]
