from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from customers.models import Customer
import json


class GainsightCompany(models.Model):
    """
    Gainsight Company metadata and extended fields.
    This model stores all Gainsight-specific data that doesn't fit in the core Customer model.
    Linked to Customer via ForeignKey for proper relationship mapping.
    """
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('churned', 'Churned'),
        ('at_risk', 'At Risk'),
        ('expansion', 'Expansion'),
    ]
    
    STAGE_CHOICES = [
        ('new_customer', 'New Customer'),
        ('kicked_off', 'Kicked Off'),
        ('launched', 'Launched'),
        ('adoption', 'Adoption'),
        ('expansion', 'Expansion'),
        ('renewal', 'Renewal'),
        ('churned', 'Churned'),
    ]
    
    # Foreign Key to Customer (primary relationship)
    customer = models.ForeignKey(
        Customer, 
        on_delete=models.CASCADE, 
        related_name='gainsight_companies',
        null=True,
        blank=True,
        help_text="Link to Customer record"
    )
    
    # Gainsight ID (unique identifier from Gainsight)
    gainsight_id = models.CharField(
        max_length=50, 
        unique=True,
        db_index=True,
        help_text="Gainsight Company GSID (e.g., 1I0054U9FAKXZ0H26HO92M3F1G5SPWVQDNF3)"
    )
    
    # Core Company Fields (from Gainsight API)
    company_name = models.CharField(
        max_length=255,
        help_text="Company name from Gainsight"
    )
    
    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        blank=True,
        null=True,
        help_text="Company status"
    )
    
    stage = models.CharField(
        max_length=50,
        choices=STAGE_CHOICES,
        blank=True,
        null=True,
        help_text="Current lifecycle stage"
    )
    
    # Customer Success Manager
    csm_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Customer Success Manager name"
    )
    
    csm_email = models.EmailField(
        blank=True,
        null=True,
        help_text="Customer Success Manager email"
    )
    
    # Lifecycle Metrics
    customer_lifetime_in_months = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="Customer lifetime in months"
    )
    
    lifecycle_in_weeks = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="Lifecycle in weeks"
    )
    
    # Contract Dates
    original_contract_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Original contract date"
    )
    
    renewal_date = models.DateField(
        null=True,
        blank=True,
        help_text="Renewal date from Gainsight"
    )
    
    # Company Details
    employees = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="Number of employees"
    )
    
    # Parent Company Relationship
    parent_company_id = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Parent company Gainsight ID"
    )
    
    parent_company_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Parent company name"
    )
    
    # Additional Gainsight Fields
    created_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Created date in Gainsight"
    )
    
    modified_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Last modified date in Gainsight"
    )
    
    # Custom Gainsight Fields (stored as JSON for flexibility)
    gainsight_metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional Gainsight metadata"
    )
    
    # Raw API Response (for debugging and future RAG processing)
    raw_api_response = models.JSONField(
        default=dict,
        blank=True,
        help_text="Complete raw API response from Gainsight for RAG processing"
    )
    
    # Sync tracking
    last_synced_at = models.DateTimeField(
        auto_now=True,
        help_text="Last sync timestamp from Gainsight"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    
    updated_at = models.DateTimeField(
        auto_now=True
    )
    
    class Meta:
        verbose_name = "Gainsight Company"
        verbose_name_plural = "Gainsight Companies"
        ordering = ['-renewal_date', 'company_name']
        indexes = [
            models.Index(fields=['gainsight_id']),
            models.Index(fields=['customer', '-renewal_date']),
            models.Index(fields=['status', 'stage']),
        ]
    
    def __str__(self):
        return f"{self.company_name} ({self.gainsight_id})"
    
    @property
    def is_active(self):
        """Check if company is active"""
        return self.status == 'active'
    
    @property
    def lifetime_years(self):
        """Calculate lifetime in years"""
        if self.customer_lifetime_in_months:
            return round(self.customer_lifetime_in_months / 12, 2)
        return None
    
    def get_metadata_for_rag(self):
        """
        Prepare structured metadata for RAG/vector DB processing.
        Returns a dictionary with all relevant fields for semantic search.
        """
        return {
            'gainsight_id': self.gainsight_id,
            'company_name': self.company_name,
            'status': self.get_status_display() if self.status else None,
            'stage': self.get_stage_display() if self.stage else None,
            'csm_name': self.csm_name,
            'csm_email': self.csm_email,
            'customer_lifetime_in_months': self.customer_lifetime_in_months,
            'lifecycle_in_weeks': self.lifecycle_in_weeks,
            'employees': self.employees,
            'renewal_date': self.renewal_date.isoformat() if self.renewal_date else None,
            'original_contract_date': self.original_contract_date.isoformat() if self.original_contract_date else None,
            'parent_company': {
                'id': self.parent_company_id,
                'name': self.parent_company_name,
            } if self.parent_company_id else None,
            'metadata': self.gainsight_metadata,
        }
