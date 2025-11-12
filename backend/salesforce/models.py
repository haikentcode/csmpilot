from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from customers.models import Customer
import json


class SalesforceOpportunity(models.Model):
    """
    Salesforce Opportunity metadata and extended fields.
    This model stores all Salesforce-specific data that doesn't fit in the core Customer model.
    Linked to Customer via ForeignKey for proper relationship mapping.
    """
    
    STAGE_CHOICES = [
        ('qualified', 'Qualified'),
        ('development', 'Development'),
        ('proposal', 'Proposal'),
        ('negotiating', 'Negotiating'),
        ('contracting', 'Contracting'),
        ('ready_to_close', 'Ready to Close'),
        ('closed_won', 'Closed Won'),
        ('closed_lost', 'Closed Lost'),
    ]
    
    RENEWAL_CATEGORY_CHOICES = [
        ('verbal_commit', 'Verbal Commit (95%)'),
        ('leaning_our_way', 'Leaning our Way (65%)'),
        ('neutral', 'Neutral (50%)'),
        ('leaning_away', 'Leaning Away (35%)'),
        ('at_risk', 'At Risk (20%)'),
    ]
    
    TYPE_CHOICES = [
        ('new_business', 'New Business'),
        ('renewal', 'Renewal'),
        ('upsell', 'Upsell'),
        ('cross_sell', 'Cross-Sell'),
    ]
    
    PRIORITY_CHOICES = [
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]
    
    # Foreign Key to Customer (primary relationship)
    customer = models.ForeignKey(
        Customer, 
        on_delete=models.CASCADE, 
        related_name='salesforce_opportunities',
        null=True,
        blank=True,
        help_text="Link to Customer record"
    )
    
    # Salesforce ID (unique identifier from Salesforce)
    salesforce_id = models.CharField(
        max_length=18, 
        unique=True,
        db_index=True,
        help_text="Salesforce Opportunity ID (e.g., 0064V00001NhvGwQAJ)"
    )
    
    # Core Opportunity Fields (from Salesforce)
    opportunity_name = models.CharField(
        max_length=255,
        help_text="Full opportunity name from Salesforce"
    )
    
    account_name = models.CharField(
        max_length=255,
        help_text="Account name from Salesforce"
    )
    
    stage = models.CharField(
        max_length=50,
        choices=STAGE_CHOICES,
        help_text="Current sales stage"
    )
    
    probability = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Probability percentage"
    )
    
    close_date = models.DateField(
        help_text="Expected close date"
    )
    
    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Opportunity amount"
    )
    
    currency_code = models.CharField(
        max_length=3,
        default='USD',
        help_text="Currency code (USD, EUR, etc.)"
    )
    
    amount_usd = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Amount converted to USD"
    )
    
    # Custom Salesforce Fields (from screenshots)
    opportunity_csm = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Customer Success Manager assigned"
    )
    
    renewal_categories = models.CharField(
        max_length=50,
        choices=RENEWAL_CATEGORY_CHOICES,
        blank=True,
        null=True,
        help_text="Renewal category classification"
    )
    
    opportunity_type = models.CharField(
        max_length=50,
        choices=TYPE_CHOICES,
        default='renewal',
        help_text="Type of opportunity"
    )
    
    opportunity_owner = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Salesforce opportunity owner/team"
    )
    
    lead_source = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Lead source"
    )
    
    closed_reason = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Reason for closure (if closed)"
    )
    
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        blank=True,
        null=True,
        help_text="Opportunity priority"
    )
    
    # Custom Agreement & CPQ Fields
    custom_agreement = models.BooleanField(
        default=False,
        help_text="Custom agreement flag"
    )
    
    cpq_auto_renew = models.BooleanField(
        default=False,
        help_text="CPQ auto-renewal enabled"
    )
    
    send_survey_to_buying_contact = models.BooleanField(
        default=False,
        help_text="Send survey to buying contact"
    )
    
    billing_survey_sent_time = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When billing survey was sent"
    )
    
    # Additional Fields from Screenshots
    executive_influencers = models.TextField(
        blank=True,
        null=True,
        help_text="Executive influencers"
    )
    
    gr_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="GR Number"
    )
    
    feature_request = models.TextField(
        blank=True,
        null=True,
        help_text="Feature requests"
    )
    
    furthest_stage = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Furthest stage reached"
    )
    
    was_lost_without_advancement = models.BooleanField(
        default=False,
        help_text="Was lost without advancement"
    )
    
    # Sales Stage Milestones (from screenshots)
    verbal_award = models.BooleanField(
        default=False,
        help_text="Verbal award milestone"
    )
    
    security_review_completed = models.BooleanField(
        default=False,
        help_text="Security review completed"
    )
    
    mutually_agreed_sign_date = models.BooleanField(
        default=False,
        help_text="Mutually agreed sign date"
    )
    
    financial_terms_agreed = models.BooleanField(
        default=False,
        help_text="Financial terms agreed"
    )
    
    legal_completed = models.BooleanField(
        default=False,
        help_text="Legal completed"
    )
    
    # Opportunity Notes Fields
    next_step = models.TextField(
        blank=True,
        null=True,
        help_text="Next step notes"
    )
    
    support_needed = models.TextField(
        blank=True,
        null=True,
        help_text="Support needed notes"
    )
    
    # Salesforce Metadata (stored as JSON for flexibility)
    salesforce_metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional Salesforce metadata (attributes, URLs, etc.)"
    )
    
    # Raw API Response (for debugging and future RAG processing)
    raw_api_response = models.JSONField(
        default=dict,
        blank=True,
        help_text="Complete raw API response from Salesforce for RAG processing"
    )
    
    # Sync tracking
    last_synced_at = models.DateTimeField(
        auto_now=True,
        help_text="Last sync timestamp from Salesforce"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    
    updated_at = models.DateTimeField(
        auto_now=True
    )
    
    class Meta:
        verbose_name = "Salesforce Opportunity"
        verbose_name_plural = "Salesforce Opportunities"
        ordering = ['-close_date', '-amount']
        indexes = [
            models.Index(fields=['salesforce_id']),
            models.Index(fields=['customer', '-close_date']),
            models.Index(fields=['stage', '-amount']),
        ]
    
    def __str__(self):
        return f"{self.opportunity_name} ({self.salesforce_id})"
    
    @property
    def is_closed(self):
        """Check if opportunity is closed"""
        return self.stage in ['closed_won', 'closed_lost']
    
    @property
    def is_won(self):
        """Check if opportunity is won"""
        return self.stage == 'closed_won'
    
    def get_metadata_for_rag(self):
        """
        Prepare structured metadata for RAG/vector DB processing.
        Returns a dictionary with all relevant fields for semantic search.
        """
        return {
            'salesforce_id': self.salesforce_id,
            'opportunity_name': self.opportunity_name,
            'account_name': self.account_name,
            'stage': self.get_stage_display(),
            'probability': float(self.probability),
            'amount': float(self.amount),
            'currency': self.currency_code,
            'close_date': self.close_date.isoformat() if self.close_date else None,
            'opportunity_csm': self.opportunity_csm,
            'renewal_categories': self.get_renewal_categories_display() if self.renewal_categories else None,
            'opportunity_type': self.get_opportunity_type_display(),
            'opportunity_owner': self.opportunity_owner,
            'next_step': self.next_step,
            'support_needed': self.support_needed,
            'executive_influencers': self.executive_influencers,
            'feature_request': self.feature_request,
            'milestones': {
                'verbal_award': self.verbal_award,
                'security_review_completed': self.security_review_completed,
                'mutually_agreed_sign_date': self.mutually_agreed_sign_date,
                'financial_terms_agreed': self.financial_terms_agreed,
                'legal_completed': self.legal_completed,
            },
            'metadata': self.salesforce_metadata,
        }
