"""
Integration Connector and Metadata Models
Flexible architecture for storing external API data (Salesforce, Gainsight, etc.)

Architecture:
    Company (Customer) -> Connector -> Metadata
    
Benefits:
    - Handles API response format changes without schema migrations
    - Easy to add new integrations (HubSpot, etc.)
    - Stores complete raw responses for AI/RAG processing
    - Type-safe filtering via connector.type enum
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from customers.models import Customer


class IntegrationMetadata(models.Model):
    """
    Generic metadata storage for external API responses.
    Stores complete raw API responses as JSON for flexibility and future AI/RAG processing.
    """
    
    # Raw API response stored as JSON
    raw_data = models.JSONField(
        default=dict,
        help_text="Complete raw API response from external system (Salesforce, Gainsight, etc.)"
    )
    
    # Optional: Store extracted/parsed important fields for quick access
    # This can be populated from raw_data for common queries
    extracted_fields = models.JSONField(
        default=dict,
        blank=True,
        help_text="Extracted important fields from raw_data for quick access (optional)"
    )
    
    # API version/timestamp for tracking changes
    api_version = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="API version used (e.g., 'v58.0' for Salesforce)"
    )
    
    # Sync tracking
    last_synced_at = models.DateTimeField(
        auto_now=True,
        help_text="Last sync timestamp"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    
    updated_at = models.DateTimeField(
        auto_now=True
    )
    
    class Meta:
        verbose_name = "Integration Metadata"
        verbose_name_plural = "Integration Metadata"
        ordering = ['-last_synced_at']
        indexes = [
            models.Index(fields=['-last_synced_at']),
        ]
    
    def __str__(self):
        return f"Metadata #{self.id} (Synced: {self.last_synced_at})"
    
    def get_data_for_rag(self):
        """
        Prepare data for RAG/vector DB processing.
        Returns structured data from raw_data.
        """
        return {
            'metadata_id': self.id,
            'raw_data': self.raw_data,
            'extracted_fields': self.extracted_fields,
            'api_version': self.api_version,
            'last_synced_at': self.last_synced_at.isoformat(),
        }


class IntegrationConnector(models.Model):
    """
    Connector table linking Company (Customer) to Integration Metadata.
    Provides type-safe filtering and relationship management.
    """
    
    INTEGRATION_TYPE_CHOICES = [
        ('SALESFORCE', 'Salesforce'),
        ('GAINSIGHT', 'Gainsight'),
        ('HUBSPOT', 'HubSpot'),
        ('ZENDESK', 'Zendesk'),
        ('INTERCOM', 'Intercom'),
        ('OTHER', 'Other'),
    ]
    
    # Foreign keys
    company = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name='integration_connectors',
        help_text="Company (Customer) this integration belongs to"
    )
    
    metadata = models.ForeignKey(
        IntegrationMetadata,
        on_delete=models.CASCADE,
        related_name='connectors',
        help_text="Metadata record containing raw API response"
    )
    
    # Integration type (enum)
    type = models.CharField(
        max_length=20,
        choices=INTEGRATION_TYPE_CHOICES,
        db_index=True,
        help_text="Type of integration (Salesforce, Gainsight, etc.)"
    )
    
    # External system ID (for matching/updating)
    external_id = models.CharField(
        max_length=100,
        db_index=True,
        help_text="External system ID (e.g., Salesforce Opportunity ID, Gainsight GSID)"
    )
    
    # Sync status
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this connector is currently active"
    )
    
    # Additional metadata about the connection
    connection_metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional metadata about this connection (e.g., sync frequency, last error)"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    
    updated_at = models.DateTimeField(
        auto_now=True
    )
    
    class Meta:
        verbose_name = "Integration Connector"
        verbose_name_plural = "Integration Connectors"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['company', 'type']),
            models.Index(fields=['type', 'external_id']),
            models.Index(fields=['company', '-created_at']),
        ]
        # Ensure one connector per company+type+external_id combination
        unique_together = [['company', 'type', 'external_id']]
    
    def __str__(self):
        return f"{self.company.name} - {self.get_type_display()} - {self.external_id}"
    
    @classmethod
    def get_metadata_for_company(cls, company, integration_type=None):
        """
        Get all metadata for a company, optionally filtered by type.
        
        Usage:
            # Get all integrations for a company
            connectors = IntegrationConnector.get_metadata_for_company(customer)
            
            # Get only Salesforce data
            salesforce_connectors = IntegrationConnector.get_metadata_for_company(customer, 'SALESFORCE')
        """
        queryset = cls.objects.filter(company=company, is_active=True)
        if integration_type:
            queryset = queryset.filter(type=integration_type)
        return queryset.select_related('metadata')
    
    @classmethod
    def get_latest_metadata(cls, company, integration_type):
        """
        Get the latest metadata for a company of a specific type.
        """
        connector = cls.objects.filter(
            company=company,
            type=integration_type,
            is_active=True
        ).select_related('metadata').order_by('-metadata__last_synced_at').first()
        
        return connector.metadata if connector else None

