from django.contrib import admin
from .models import IntegrationMetadata, IntegrationConnector


@admin.register(IntegrationMetadata)
class IntegrationMetadataAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'api_version',
        'last_synced_at',
        'created_at',
    ]
    list_filter = [
        'api_version',
        'last_synced_at',
        'created_at',
    ]
    readonly_fields = [
        'id',
        'created_at',
        'updated_at',
        'last_synced_at',
    ]
    fieldsets = (
        ('Metadata', {
            'fields': ('raw_data', 'extracted_fields', 'api_version')
        }),
        ('Timestamps', {
            'fields': ('last_synced_at', 'created_at', 'updated_at')
        }),
    )
    ordering = ['-last_synced_at']
    date_hierarchy = 'last_synced_at'
    
    def has_add_permission(self, request):
        # Metadata should be created via sync services, not manually
        return False


@admin.register(IntegrationConnector)
class IntegrationConnectorAdmin(admin.ModelAdmin):
    list_display = [
        'company',
        'type',
        'external_id',
        'is_active',
        'created_at',
    ]
    list_filter = [
        'type',
        'is_active',
        'created_at',
    ]
    search_fields = [
        'company__name',
        'external_id',
        'metadata__raw_data',
    ]
    readonly_fields = [
        'created_at',
        'updated_at',
    ]
    fieldsets = (
        ('Connection', {
            'fields': ('company', 'metadata', 'type', 'external_id', 'is_active')
        }),
        ('Additional Info', {
            'fields': ('connection_metadata',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    ordering = ['-created_at']
    date_hierarchy = 'created_at'
    
    def get_queryset(self, request):
        return super().get_queryset().select_related('company', 'metadata')

