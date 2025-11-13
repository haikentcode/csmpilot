from django.contrib import admin
from .models import GainsightCompany


@admin.register(GainsightCompany)
class GainsightCompanyAdmin(admin.ModelAdmin):
    list_display = [
        'company_name',
        'status',
        'stage',
        'csm_name',
        'customer_lifetime_in_months',
        'renewal_date',
        'customer',
        'last_synced_at'
    ]
    list_filter = [
        'status',
        'stage',
        'renewal_date',
        'last_synced_at'
    ]
    search_fields = [
        'company_name',
        'gainsight_id',
        'csm_name',
        'csm_email',
        'customer__name'
    ]
    readonly_fields = [
        'gainsight_id',
        'last_synced_at',
        'created_at',
        'updated_at',
        'raw_api_response',
        'gainsight_metadata'
    ]
    fieldsets = (
        ('Basic Information', {
            'fields': ('customer', 'gainsight_id', 'company_name')
        }),
        ('Status & Stage', {
            'fields': ('status', 'stage')
        }),
        ('Customer Success Manager', {
            'fields': ('csm_name', 'csm_email')
        }),
        ('Lifecycle Metrics', {
            'fields': (
                'customer_lifetime_in_months', 'lifecycle_in_weeks',
                'employees', 'renewal_date', 'original_contract_date'
            )
        }),
        ('Parent Company', {
            'fields': ('parent_company_id', 'parent_company_name')
        }),
        ('Timestamps', {
            'fields': ('created_date', 'modified_date', 'last_synced_at', 'created_at', 'updated_at')
        }),
        ('Metadata', {
            'fields': ('gainsight_metadata', 'raw_api_response'),
            'classes': ('collapse',)
        }),
    )
    ordering = ['-renewal_date', 'company_name']
    date_hierarchy = 'renewal_date'
