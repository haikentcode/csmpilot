"""
Base Sync Service for Integration Connector/Metadata Architecture
Provides helper methods for syncing external API data to the new flexible structure.
"""

from django.db import transaction
from django.utils import timezone
from .models import IntegrationMetadata, IntegrationConnector
from customers.models import Customer


class BaseIntegrationSyncService:
    """
    Base class for integration sync services.
    Handles the connector/metadata pattern for flexible data storage.
    """
    
    def __init__(self, integration_type, api_version=None):
        """
        Initialize sync service.
        
        Args:
            integration_type: One of IntegrationConnector.INTEGRATION_TYPE_CHOICES (e.g., 'SALESFORCE')
            api_version: API version string (e.g., 'v58.0')
        """
        self.integration_type = integration_type
        self.api_version = api_version
    
    @transaction.atomic
    def sync_record(self, company, external_id, raw_api_response, extracted_fields=None):
        """
        Sync a single record from external API to the connector/metadata structure.
        
        Args:
            company: Customer instance
            external_id: External system ID (e.g., Salesforce Opportunity ID)
            raw_api_response: Complete raw API response (dict)
            extracted_fields: Optional dict of extracted important fields for quick access
        
        Returns:
            tuple: (connector, created) - IntegrationConnector instance and whether it was created
        """
        # Create or update metadata
        metadata, metadata_created = IntegrationMetadata.objects.update_or_create(
            id=None,  # We'll find by connector, not create new metadata each time
            defaults={
                'raw_data': raw_api_response,
                'extracted_fields': extracted_fields or {},
                'api_version': self.api_version,
            }
        )
        
        # For updates, we want to update existing metadata, not create new
        # So we find existing connector first
        connector = IntegrationConnector.objects.filter(
            company=company,
            type=self.integration_type,
            external_id=external_id,
            is_active=True
        ).first()
        
        if connector:
            # Update existing metadata
            connector.metadata.raw_data = raw_api_response
            if extracted_fields:
                connector.metadata.extracted_fields = extracted_fields
            connector.metadata.api_version = self.api_version
            connector.metadata.save()
            connector.save()
            return connector, False
        else:
            # Create new metadata and connector
            metadata = IntegrationMetadata.objects.create(
                raw_data=raw_api_response,
                extracted_fields=extracted_fields or {},
                api_version=self.api_version,
            )
            
            connector = IntegrationConnector.objects.create(
                company=company,
                metadata=metadata,
                type=self.integration_type,
                external_id=external_id,
                is_active=True,
            )
            return connector, True
    
    def get_company_metadata(self, company, integration_type=None):
        """
        Get all metadata for a company.
        
        Args:
            company: Customer instance
            integration_type: Optional filter by type (defaults to self.integration_type)
        
        Returns:
            QuerySet of IntegrationConnector instances
        """
        return IntegrationConnector.get_metadata_for_company(
            company,
            integration_type or self.integration_type
        )
    
    def get_latest_metadata(self, company):
        """
        Get the latest metadata for a company of this integration type.
        
        Args:
            company: Customer instance
        
        Returns:
            IntegrationMetadata instance or None
        """
        return IntegrationConnector.get_latest_metadata(company, self.integration_type)

