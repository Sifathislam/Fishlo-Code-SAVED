from django.contrib import admin

from .models import AIPrompt, ChatMessage, ChatSession, StockReservation


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user_profile",
        "storage_location",
        "device_type",
        "started_at",
        "ended_at",
        "message_count",
    )
    list_display_links = ["id", "user_profile"]
    list_filter = ("device_type", "storage_location")
    search_fields = ("user_profile__user__phone_number",)


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "session",
        "role",
        "short_text",
        "language",
        "sentiment",
        "intent",
        "is_abusive",
        "created_at",
    )
    list_display_links = ("id", "session")
    list_filter = ("role", "language", "sentiment", "is_abusive")
    search_fields = ("text",)
    ordering = ("-created_at",)

    def short_text(self, obj):
        return (obj.text[:50] + "...") if len(obj.text) > 50 else obj.text


admin.site.register(AIPrompt)
admin.site.register(StockReservation)
