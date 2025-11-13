"""
Example: How to update sync services to use the new connector/metadata architecture

This shows how Salesforce and Gainsight sync services should be refactored.
"""

from integrations.sync_service import BaseIntegrationSyncService
from integrations.models import IntegrationConnector
from customers.models import Customer
from django.db import transaction


class ExampleSalesforceSyncService(BaseIntegrationSyncService):
    """
    Example refactored Salesforce sync service using connector/metadata pattern.
    """
    
    def __init__(self, api_base_url='http://localhost:3001/mock-apis/salesforce'):
        super().__init__(integration_type='SALESFORCE', api_version='v58.0')
        self.api_base_url = api_base_url.rstrip('/')
    
    def extract_important_fields(self, salesforce_data):
        """
        Extract important fields from Salesforce response for quick access.
        These are fields commonly used in frontend queries.
        """
        return {
            'opportunity_name': salesforce_data.get('Name', ''),
            'account_name': salesforce_data.get('Account', {}).get('Name', ''),
            'stage': salesforce_data.get('StageName', ''),
            'amount': salesforce_data.get('Amount', 0) or salesforce_data.get('Amount_USD__c', 0),
            'probability': salesforce_data.get('Probability', 0),
            'close_date': salesforce_data.get('CloseDate', ''),
            'opportunity_csm': salesforce_data.get('Opportunity_CSM__c', ''),
        }
    
    @transaction.atomic
    def sync_opportunity(self, salesforce_data):
        """
        Sync a Salesforce opportunity using the new connector/metadata pattern.
        """
        # Extract core fields for Customer table (frontend display)
        account_name = salesforce_data.get('Account', {}).get('Name', '')
        account_id = salesforce_data.get('AccountId', '')
        amount = salesforce_data.get('Amount', 0) or salesforce_data.get('Amount_USD__c', 0)
        close_date_str = salesforce_data.get('CloseDate', '')
        
        # Get or create Customer (core frontend fields only)
        customer, _ = Customer.objects.get_or_create(
            name=account_name,
            defaults={
                'industry': self._map_industry(account_name),
                'arr': amount,
                'health_score': self._calculate_health_score(salesforce_data),
                'renewal_date': self._parse_date(close_date_str),
            }
        )
        
        # Update customer if needed
        customer.arr = amount
        customer.renewal_date = self._parse_date(close_date_str)
        customer.save()
        
        # Extract important fields for quick access
        extracted_fields = self.extract_important_fields(salesforce_data)
        
        # Sync to connector/metadata structure (stores complete raw response)
        opportunity_id = salesforce_data.get('Id')
        connector, created = self.sync_record(
            company=customer,
            external_id=opportunity_id,
            raw_api_response=salesforce_data,  # Complete raw response
            extracted_fields=extracted_fields,  # Important fields for quick queries
        )
        
        return {
            'customer': customer,
            'connector': connector,
            'created': created
        }
    
    def _map_industry(self, account_name):
        """Map account name to industry"""
        # Simple heuristic - can be improved
        account_lower = account_name.lower()
        if any(word in account_lower for word in ['tech', 'software']):
            return 'technology'
        return 'other'
    
    def _calculate_health_score(self, salesforce_data):
        """Calculate health score from Salesforce data"""
        probability = salesforce_data.get('Probability', 0) or 0
        stage = salesforce_data.get('StageName', '')
        
        if stage == 'Closed Won':
            return 'healthy'
        elif stage == 'Closed Lost':
            return 'critical'
        elif probability >= 75:
            return 'healthy'
        elif probability >= 50:
            return 'at_risk'
        return 'critical'
    
    def _parse_date(self, date_str):
        """Parse date string"""
        from datetime import datetime
        try:
            return datetime.strptime(date_str, '%Y-%m-%d').date()
        except (ValueError, TypeError):
            from datetime import date
            return date.today()


# Usage example:
"""
# In sync service:
sync_service = ExampleSalesforceSyncService()
result = sync_service.sync_opportunity(salesforce_api_response)

# Later, to query:
customer = Customer.objects.get(name="Europcar International")

# Get all Salesforce data for this customer
salesforce_connectors = IntegrationConnector.get_metadata_for_company(customer, 'SALESFORCE')
for connector in salesforce_connectors:
    raw_data = connector.metadata.raw_data  # Complete Salesforce response
    extracted = connector.metadata.extracted_fields  # Quick access fields
    
# Get latest Salesforce data
latest = IntegrationConnector.get_latest_metadata(customer, 'SALESFORCE')
if latest:
    print(latest.raw_data)  # Full response
    print(latest.extracted_fields)  # Important fields
"""

