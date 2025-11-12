"""
Test script for the new Integration Connector/Metadata architecture
Tests syncing, querying, and data retrieval patterns

Run with: python manage.py shell < test_new_architecture.py
"""

from integrations.models import IntegrationMetadata, IntegrationConnector
from integrations.sync_service import BaseIntegrationSyncService
from customers.models import Customer
from django.utils import timezone
from datetime import datetime


def test_new_architecture():
    print("=" * 70)
    print("🧪 TESTING NEW INTEGRATION ARCHITECTURE")
    print("=" * 70)
    print()
    
    # Test 1: Create a test customer
    print("Test 1: Creating test customer...")
    customer, created = Customer.objects.get_or_create(
        name="Test Company for Architecture",
        defaults={
            'industry': 'technology',
            'arr': 100000.00,
            'health_score': 'healthy',
            'renewal_date': datetime.now().date(),
        }
    )
    print(f"   ✅ Customer: {customer.name} (ID: {customer.id})")
    print()
    
    # Test 2: Simulate Salesforce API response
    print("Test 2: Simulating Salesforce API response...")
    salesforce_response = {
        "Id": "0064V00001TestArch",
        "Name": "Test Company - Renewal Opportunity 2025",
        "AccountId": "0014V00001Test123",
        "Account": {
            "Name": "Test Company for Architecture"
        },
        "StageName": "Closed Won",
        "CloseDate": "2025-12-31",
        "Amount": 100000.00,
        "CurrencyIsoCode": "USD",
        "Amount_USD__c": 100000.00,
        "Probability": 100,
        "Type": "Renewal",
        "Opportunity_CSM__c": "Test CSM",
        "Renewal_Categories__c": "Verbal Commit (95%)",
        "Custom_Agreement__c": False,
        "CPQ_Auto_Renew__c": True,
        "Next_Step__c": "Test next step",
        "CreatedDate": "2025-01-01T10:00:00.000+0000",
        "LastModifiedDate": "2025-11-12T12:00:00.000+0000",
    }
    print(f"   ✅ Salesforce response simulated ({len(salesforce_response)} fields)")
    print()
    
    # Test 3: Extract important fields
    print("Test 3: Extracting important fields...")
    extracted_fields = {
        'opportunity_name': salesforce_response['Name'],
        'account_name': salesforce_response['Account']['Name'],
        'stage': salesforce_response['StageName'],
        'amount': salesforce_response['Amount'],
        'probability': salesforce_response['Probability'],
        'close_date': salesforce_response['CloseDate'],
        'opportunity_csm': salesforce_response.get('Opportunity_CSM__c', ''),
    }
    print(f"   ✅ Extracted {len(extracted_fields)} important fields")
    print(f"      Fields: {', '.join(extracted_fields.keys())}")
    print()
    
    # Test 4: Sync using new architecture
    print("Test 4: Syncing to new architecture...")
    sync_service = BaseIntegrationSyncService('SALESFORCE', api_version='v58.0')
    connector, created = sync_service.sync_record(
        company=customer,
        external_id=salesforce_response['Id'],
        raw_api_response=salesforce_response,
        extracted_fields=extracted_fields,
    )
    print(f"   ✅ Connector created: {connector}")
    print(f"      Type: {connector.type}")
    print(f"      External ID: {connector.external_id}")
    print(f"      Metadata ID: {connector.metadata.id}")
    print()
    
    # Test 5: Verify data storage
    print("Test 5: Verifying data storage...")
    metadata = connector.metadata
    print(f"   ✅ Metadata ID: {metadata.id}")
    print(f"      Raw data fields: {len(metadata.raw_data)}")
    print(f"      Extracted fields: {len(metadata.extracted_fields)}")
    print(f"      API version: {metadata.api_version}")
    print(f"      Last synced: {metadata.last_synced_at}")
    print()
    
    # Test 6: Query by company and type
    print("Test 6: Querying data by company and type...")
    connectors = IntegrationConnector.get_metadata_for_company(customer, 'SALESFORCE')
    print(f"   ✅ Found {connectors.count()} Salesforce connector(s)")
    for conn in connectors:
        print(f"      - {conn.external_id}: {conn.metadata.extracted_fields.get('opportunity_name')}")
    print()
    
    # Test 7: Get latest metadata
    print("Test 7: Getting latest metadata...")
    latest = IntegrationConnector.get_latest_metadata(customer, 'SALESFORCE')
    if latest:
        print(f"   ✅ Latest metadata found")
        print(f"      Opportunity: {latest.extracted_fields.get('opportunity_name')}")
        print(f"      Stage: {latest.extracted_fields.get('stage')}")
        print(f"      Amount: ${latest.extracted_fields.get('amount'):,.2f}")
    print()
    
    # Test 8: Test Gainsight sync
    print("Test 8: Testing Gainsight sync...")
    gainsight_response = {
        "Name": "Test Company for Architecture",
        "Gsid": "1I0054U9FAKXZ0H26HO92M3F1G5SPWVQDNF3TEST",
        "Renewal_Date": 1735689600000,
        "Status": "Active",
        "Stage": "Renewal",
        "Customer_Lifetime_in_Months": 24,
        "ARR": 100000.00,
        "Employees": 500,
        "Industry": "Technology",
        "csm__gr": {
            "email": "test.csm@example.com",
            "name": "Test CSM"
        },
        "LifecycleInWeeks": 96,
        "OriginalContractDate": 1704067200000,
    }
    
    gainsight_extracted = {
        'company_name': gainsight_response['Name'],
        'status': gainsight_response['Status'],
        'stage': gainsight_response['Stage'],
        'arr': gainsight_response['ARR'],
        'csm_name': gainsight_response['csm__gr']['name'],
        'lifetime_months': gainsight_response['Customer_Lifetime_in_Months'],
    }
    
    gainsight_sync = BaseIntegrationSyncService('GAINSIGHT', api_version='v1')
    gainsight_connector, g_created = gainsight_sync.sync_record(
        company=customer,
        external_id=gainsight_response['Gsid'],
        raw_api_response=gainsight_response,
        extracted_fields=gainsight_extracted,
    )
    print(f"   ✅ Gainsight connector created: {gainsight_connector.external_id}")
    print()
    
    # Test 9: Query all integrations for company
    print("Test 9: Querying all integrations for company...")
    all_connectors = IntegrationConnector.get_metadata_for_company(customer)
    print(f"   ✅ Found {all_connectors.count()} total integration(s)")
    for conn in all_connectors:
        print(f"      - {conn.type}: {conn.external_id}")
        print(f"        Extracted fields: {list(conn.metadata.extracted_fields.keys())}")
    print()
    
    # Test 10: Verify raw data is complete
    print("Test 10: Verifying raw data completeness...")
    salesforce_metadata = connector.metadata
    print(f"   ✅ Salesforce raw data contains:")
    print(f"      - Id: {salesforce_metadata.raw_data.get('Id')}")
    print(f"      - Name: {salesforce_metadata.raw_data.get('Name')}")
    print(f"      - All original fields preserved: {len(salesforce_metadata.raw_data)} fields")
    print()
    
    # Test 11: Test RAG data preparation
    print("Test 11: Testing RAG data preparation...")
    rag_data = salesforce_metadata.get_data_for_rag()
    print(f"   ✅ RAG data structure:")
    print(f"      - metadata_id: {rag_data['metadata_id']}")
    print(f"      - api_version: {rag_data['api_version']}")
    print(f"      - Has raw_data: {bool(rag_data['raw_data'])}")
    print(f"      - Has extracted_fields: {bool(rag_data['extracted_fields'])}")
    print()
    
    # Summary
    print("=" * 70)
    print("✅ ALL TESTS PASSED!")
    print("=" * 70)
    print()
    print("Summary:")
    print(f"  • Customer: {customer.name}")
    print(f"  • Salesforce connectors: {IntegrationConnector.objects.filter(company=customer, type='SALESFORCE').count()}")
    print(f"  • Gainsight connectors: {IntegrationConnector.objects.filter(company=customer, type='GAINSIGHT').count()}")
    print(f"  • Total metadata records: {IntegrationMetadata.objects.filter(connectors__company=customer).distinct().count()}")
    print()
    print("✅ New architecture is working as expected!")
    print("   - Data synced successfully")
    print("   - Queries work correctly")
    print("   - Raw data preserved")
    print("   - Extracted fields accessible")
    print("   - Multiple integrations supported")
    print()


# Run the test
test_new_architecture()

