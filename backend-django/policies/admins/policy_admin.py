from django.contrib import admin
from ..models import PolicyPage, FAQ

@admin.register(PolicyPage)
class PolicyPageAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'updated_at')
    search_fields = ('title', 'slug')
    list_filter = ('slug',)

@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = ('priority', 'question', 'is_active')
    list_editable = ('priority', 'is_active')
    list_display_links = ('question',)
    search_fields = ('question', 'answer')
    list_filter = ('is_active',)
    ordering = ('priority',)
