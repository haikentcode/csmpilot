"""
Gainsight Sync Service
Handles syncing data from mock Gainsight API to Django models.
Maps Gainsight Company response to Customer and GainsightCompany models.
"""

import requests
from datetime import datetime, timezone as dt_timezone
from django.utils import timezone
from django.db import transaction
from customers.models import Customer
from .models import GainsightCompany


class GainsightSyncService:
    """
    Service to sync Gainsight Company data to Django models.
    Maps primary data to Customer table, metadata to GainsightCompany table.
    """
    
    def __init__(self, api_base_url='http://localhost:3001/mock-apis/gainsight'):
        self.api_base_url = api_base_url.rstrip('/')
    
    def fetch_companies(self):
        """
        Fetch all companies from mock Gainsight API using Read API (POST query)
        """
        url = f"{self.api_base_url}/v1/data/objects/query/Company"
        try:
            # Gainsight Read API uses POST with query body
            query_body = {
                "select": [
                    "Name",
                    "Renewal_Date",
                    "Status",
                    "Stage",
                    "Customer_Lifetime_in_Months",
                    "ARR",
                    "Employees",
                    "Industry",
                    "csm__gr.email",
                    "csm__gr.name",
                    "LifecycleInWeeks",
                    "OriginalContractDate",
                    "Parentcompany",
                    "Gsid",
                    "CreatedDate",
                    "ModifiedDate"
                ],
                "limit": 5000,
                "offset": 0
            }
            
            headers = {
                'Content-Type': 'application/json',
                'Accesskey': 'mock-access-key'  # Mock key for testing
            }
            
            response = requests.post(url, json=query_body, headers=headers, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            # Gainsight API returns {result: true, data: [...]}
            if data.get('result') and data.get('data'):
                return data['data']
            return []
        except requests.RequestException as e:
            print(f"Error fetching companies from Gainsight: {e}")
            return []
    
    def map_status_to_internal(self, gainsight_status):
        """
        Map Gainsight status to internal status choices
        """
        status_mapping = {
            'Active': 'active',
            'Inactive': 'inactive',
            'Churned': 'churned',
            'At Risk': 'at_risk',
            'Expansion': 'expansion',
        }
        # Handle both string IDs and display names
        if isinstance(gainsight_status, str) and len(gainsight_status) > 20:
            # Likely a Gainsight ID, return as-is or map
            return 'active'  # Default
        return status_mapping.get(gainsight_status, 'active')
    
    def map_stage_to_internal(self, gainsight_stage):
        """
        Map Gainsight stage to internal stage choices
        """
        stage_mapping = {
            'New Customer': 'new_customer',
            'Kicked Off': 'kicked_off',
            'Launched': 'launched',
            'Adoption': 'adoption',
            'Expansion': 'expansion',
            'Renewal': 'renewal',
            'Churned': 'churned',
        }
        # Handle both string IDs and display names
        if isinstance(gainsight_stage, str) and len(gainsight_stage) > 20:
            # Likely a Gainsight ID, return default
            return 'new_customer'
        return stage_mapping.get(gainsight_stage, 'new_customer')
    
    def map_industry_to_internal(self, gainsight_industry):
        """
        Map Gainsight industry to Customer model industry choices
        """
        industry_mapping = {
            'Technology': 'technology',
            'Healthcare': 'healthcare',
            'Finance': 'finance',
            'Education': 'education',
            'Retail': 'retail',
            'Manufacturing': 'manufacturing',
        }
        return industry_mapping.get(gainsight_industry, 'other')
    
    def calculate_health_score(self, status, stage, lifetime_months=None):
        """
        Calculate health score based on Gainsight status, stage, and lifetime
        """
        if status == 'churned':
            return 'critical'
        elif status == 'at_risk':
            return 'at_risk'
        elif status == 'active' and stage in ['expansion', 'renewal']:
            return 'healthy'
        elif status == 'active' and lifetime_months and lifetime_months >= 12:
            return 'healthy'
        elif status == 'active':
            return 'at_risk'
        return 'at_risk'
    
    def _parse_timestamp(self, timestamp):
        """
        Parse Gainsight timestamp (can be milliseconds or ISO string)
        """
        if not timestamp:
            return None
        try:
            # Handle millisecond timestamp
            if isinstance(timestamp, (int, float)):
                return datetime.fromtimestamp(timestamp / 1000, tz=dt_timezone.utc)
            # Handle ISO string
            if isinstance(timestamp, str):
                # Try ISO format first
                try:
                    return datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                except ValueError:
                    # Try parsing as milliseconds
                    return datetime.fromtimestamp(int(timestamp) / 1000, tz=dt_timezone.utc)
        except (ValueError, TypeError, OverflowError):
            return None
        return None
    
    def _parse_date(self, date_value):
        """
        Parse Gainsight date (can be timestamp or date string)
        """
        if not date_value:
            return None
        try:
            # Handle millisecond timestamp
            if isinstance(date_value, (int, float)):
                dt = datetime.fromtimestamp(date_value / 1000, tz=dt_timezone.utc)
                return dt.date()
            # Handle ISO date string
            if isinstance(date_value, str):
                return datetime.strptime(date_value.split('T')[0], '%Y-%m-%d').date()
        except (ValueError, TypeError, OverflowError):
            return None
        return None
    
    @transaction.atomic
    def sync_company(self, gainsight_data):
        """
        Sync a single Gainsight Company to Django models.
        Primary data goes to Customer, metadata goes to GainsightCompany.
        """
        if not gainsight_data:
            return None
        
        # Extract core fields for Customer table
        company_name = gainsight_data.get('Name', '')
        gainsight_id = gainsight_data.get('Gsid', '')
        arr = gainsight_data.get('ARR', 0) or 0
        industry = self.map_industry_to_internal(gainsight_data.get('Industry', ''))
        renewal_date = self._parse_date(gainsight_data.get('Renewal_Date'))
        status = self.map_status_to_internal(gainsight_data.get('Status', ''))
        stage = self.map_stage_to_internal(gainsight_data.get('Stage', ''))
        lifetime_months = gainsight_data.get('Customer_Lifetime_in_Months')
        
        # Calculate health score
        health_score = self.calculate_health_score(status, stage, lifetime_months)
        
        # Default renewal date if not provided
        if not renewal_date:
            renewal_date = datetime.now().date()
        
        # Get or create Customer (primary data)
        # Try to match by Gainsight ID first, then by name
        customer = None
        customer_created = False
        
        if gainsight_id:
            try:
                customer = Customer.objects.get(gainsight_company_id=gainsight_id)
            except Customer.DoesNotExist:
                pass
        
        if not customer:
            try:
                customer = Customer.objects.get(name=company_name)
            except Customer.DoesNotExist:
                customer = Customer.objects.create(
                    name=company_name,
                    industry=industry,
                    arr=arr,
                    health_score=health_score,
                    renewal_date=renewal_date,
                    gainsight_company_id=gainsight_id,
                    gainsight_synced=True,
                    last_gainsight_sync=timezone.now(),
                )
                customer_created = True
        
        # Update customer if it already existed
        if not customer_created:
            customer.name = company_name
            customer.industry = industry
            customer.arr = arr
            customer.health_score = health_score
            customer.renewal_date = renewal_date
            customer.gainsight_company_id = gainsight_id
            customer.gainsight_synced = True
            customer.last_gainsight_sync = timezone.now()
            customer.save()
        
        # Extract CSM information
        csm_email = gainsight_data.get('csm__gr.email', '')
        csm_name = gainsight_data.get('csm__gr.name', '')
        
        # Extract parent company
        parent_company = gainsight_data.get('Parentcompany', '')
        parent_company_id = None
        parent_company_name = None
        if isinstance(parent_company, dict):
            parent_company_id = parent_company.get('Gsid', '')
            parent_company_name = parent_company.get('Name', '')
        elif isinstance(parent_company, str) and len(parent_company) > 20:
            parent_company_id = parent_company
        
        # Get or create GainsightCompany (metadata)
        gainsight_company, company_created = GainsightCompany.objects.get_or_create(
            gainsight_id=gainsight_id,
            defaults={
                'customer': customer,
                'company_name': company_name,
                'status': status,
                'stage': stage,
                'csm_name': csm_name,
                'csm_email': csm_email,
                'customer_lifetime_in_months': lifetime_months,
                'lifecycle_in_weeks': gainsight_data.get('LifecycleInWeeks'),
                'employees': gainsight_data.get('Employees'),
                'renewal_date': renewal_date,
                'original_contract_date': self._parse_timestamp(
                    gainsight_data.get('OriginalContractDate')
                ),
                'parent_company_id': parent_company_id,
                'parent_company_name': parent_company_name,
                'created_date': self._parse_timestamp(gainsight_data.get('CreatedDate')),
                'modified_date': self._parse_timestamp(gainsight_data.get('ModifiedDate')),
                'gainsight_metadata': {
                    'Status': gainsight_data.get('Status'),
                    'Stage': gainsight_data.get('Stage'),
                    'Parentcompany': parent_company,
                },
                'raw_api_response': gainsight_data,  # Store complete response for RAG
            }
        )
        
        # Update if already existed
        if not company_created:
            gainsight_company.customer = customer
            gainsight_company.company_name = company_name
            gainsight_company.status = status
            gainsight_company.stage = stage
            gainsight_company.csm_name = csm_name
            gainsight_company.csm_email = csm_email
            gainsight_company.customer_lifetime_in_months = lifetime_months
            gainsight_company.lifecycle_in_weeks = gainsight_data.get('LifecycleInWeeks')
            gainsight_company.employees = gainsight_data.get('Employees')
            gainsight_company.renewal_date = renewal_date
            gainsight_company.original_contract_date = self._parse_timestamp(
                gainsight_data.get('OriginalContractDate')
            )
            gainsight_company.parent_company_id = parent_company_id
            gainsight_company.parent_company_name = parent_company_name
            gainsight_company.raw_api_response = gainsight_data
            gainsight_company.save()
        
        return {
            'customer': customer,
            'gainsight_company': gainsight_company,
            'created': customer_created or company_created
        }
    
    def sync_all_companies(self):
        """
        Sync all companies from Gainsight API
        """
        companies = self.fetch_companies()
        results = []
        
        for company_data in companies:
            result = self.sync_company(company_data)
            if result:
                results.append(result)
        
        return results

