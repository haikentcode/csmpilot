# Integration Connector/Metadata Architecture

## Overview

This module provides a flexible, future-proof architecture for storing external API data (Salesforce, Gainsight, HubSpot, etc.) without requiring schema changes when APIs evolve.

## Architecture

```
Company (Customer)
    ↓
IntegrationConnector (type: SALESFORCE | GAINSIGHT | etc.)
    ↓
IntegrationMetadata (raw_data: JSON)
```

## Benefits

1. **API Format Changes**: No schema migrations needed when APIs add/change fields
2. **Complete Data Storage**: Raw API responses stored for AI/RAG processing
3. **Type-Safe Filtering**: Filter by `connector.type` enum
4. **Easy Expansion**: Add new integrations by adding new type to enum
5. **Flexible Queries**: Query by company, type, external_id, etc.

## Models

### IntegrationMetadata
- `raw_data`: Complete raw API response (JSON)
- `extracted_fields`: Optional extracted important fields for quick access
- `api_version`: API version used (e.g., 'v58.0')
- `last_synced_at`: Sync timestamp

### IntegrationConnector
- `company`: ForeignKey to Customer
- `metadata`: ForeignKey to IntegrationMetadata
- `type`: Enum (SALESFORCE, GAINSIGHT, HUBSPOT, etc.)
- `external_id`: External system ID (e.g., Salesforce Opportunity ID)
- `is_active`: Active status
- `connection_metadata`: Additional connection info (JSON)

## Usage Examples

### Get all Salesforce data for a company:
```python
from integrations.models import IntegrationConnector
from customers.models import Customer

customer = Customer.objects.get(name="Europcar International")
salesforce_data = IntegrationConnector.get_metadata_for_company(customer, 'SALESFORCE')

for connector in salesforce_data:
    print(connector.metadata.raw_data)  # Full Salesforce response
```

### Get latest Gainsight data:
```python
gainsight_metadata = IntegrationConnector.get_latest_metadata(customer, 'GAINSIGHT')
if gainsight_metadata:
    print(gainsight_metadata.raw_data)  # Full Gainsight response
```

### Sync a new record:
```python
from integrations.sync_service import BaseIntegrationSyncService

sync_service = BaseIntegrationSyncService('SALESFORCE', api_version='v58.0')
connector, created = sync_service.sync_record(
    company=customer,
    external_id='0064V00001NhvGwQAJ',
    raw_api_response=salesforce_response_dict,
    extracted_fields={'amount': 85000, 'stage': 'Closed Won'}  # Optional
)
```

## Migration from Old Structure

The old structure (SalesforceOpportunity, GainsightCompany) can coexist with the new structure during migration. Sync services can be updated to use the new connector/metadata pattern while maintaining backward compatibility.

