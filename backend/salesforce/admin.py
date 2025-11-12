from django.contrib import admin
from .models import SalesforceOpportunity


@admin.register(SalesforceOpportunity)
class SalesforceOpportunityAdmin(admin.ModelAdmin):
    list_display = [
        'opportunity_name', 
        'account_name', 
        'stage', 
        'probability', 
        'amount', 
        'close_date',
        'customer',
        'last_synced_at'
    ]
    list_filter = [
        'stage', 
        'opportunity_type', 
        'renewal_categories',
        'close_date',
        'last_synced_at'
    ]
    search_fields = [
        'opportunity_name', 
        'account_name', 
        'salesforce_id',
        'opportunity_csm',
        'customer__name'
    ]
    readonly_fields = [
        'salesforce_id',
        'last_synced_at',
        'created_at',
        'updated_at',
        'raw_api_response',
        'salesforce_metadata'
    ]
    fieldsets = (
        ('Basic Information', {
            'fields': ('customer', 'salesforce_id', 'opportunity_name', 'account_name')
        }),
        ('Sales Details', {
            'fields': (
                'stage', 'probability', 'amount', 'currency_code', 'amount_usd',
                'close_date', 'opportunity_type', 'opportunity_csm', 'renewal_categories'
            )
        }),
        ('Ownership & Source', {
            'fields': ('opportunity_owner', 'lead_source', 'closed_reason', 'priority')
        }),
        ('Agreement & Renewal', {
            'fields': (
                'custom_agreement', 'cpq_auto_renew', 
                'send_survey_to_buying_contact', 'billing_survey_sent_time'
            )
        }),
        ('Milestones', {
            'fields': (
                'verbal_award', 'security_review_completed', 
                'mutually_agreed_sign_date', 'financial_terms_agreed', 'legal_completed'
            )
        }),
        ('Notes & Additional Info', {
            'fields': (
                'next_step', 'support_needed', 'executive_influencers',
                'gr_number', 'feature_request', 'furthest_stage',
                'was_lost_without_advancement'
            )
        }),
        ('Metadata', {
            'fields': ('salesforce_metadata', 'raw_api_response'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('last_synced_at', 'created_at', 'updated_at')
        }),
    )
    ordering = ['-close_date', '-amount']
    date_hierarchy = 'close_date'
