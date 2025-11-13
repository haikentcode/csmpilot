"""
Salesforce Sync Service
Handles syncing data from mock Salesforce API to Django models.
Maps Salesforce Opportunity response to Customer and SalesforceOpportunity models.
"""

import requests
from datetime import datetime
from django.utils import timezone
from django.db import transaction
from customers.models import Customer
from .models import SalesforceOpportunity


class SalesforceSyncService:
    """
    Service to sync Salesforce Opportunity data to Django models.
    Maps primary data to Customer table, metadata to SalesforceOpportunity table.
    """
    
    def __init__(self, api_base_url='http://localhost:3001/mock-apis/salesforce'):
        self.api_base_url = api_base_url.rstrip('/')
    
    def fetch_opportunity(self, opportunity_id):
        """
        Fetch opportunity from mock Salesforce API
        """
        url = f"{self.api_base_url}/services/data/v58.0/sobjects/Opportunity/{opportunity_id}"
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"Error fetching opportunity {opportunity_id}: {e}")
            return None
    
    def fetch_all_opportunities(self):
        """
        Fetch all opportunities from mock Salesforce API
        """
        url = f"{self.api_base_url}/services/data/v58.0/sobjects/Opportunity"
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            data = response.json()
            return data.get('records', [])
        except requests.RequestException as e:
            print(f"Error fetching opportunities: {e}")
            return []
    
    def map_stage_to_internal(self, salesforce_stage):
        """
        Map Salesforce stage names to internal stage choices
        """
        stage_mapping = {
            'Qualified': 'qualified',
            'Development': 'development',
            'Proposal': 'proposal',
            'Negotiating': 'negotiating',
            'Contracting': 'contracting',
            'Ready to Close': 'ready_to_close',
            'Closed Won': 'closed_won',
            'Closed Lost': 'closed_lost',
        }
        return stage_mapping.get(salesforce_stage, 'qualified')
    
    def map_renewal_category(self, salesforce_category):
        """
        Map Salesforce renewal category to internal choice
        """
        category_mapping = {
            'Verbal Commit (95%)': 'verbal_commit',
            'Leaning our Way (65%)': 'leaning_our_way',
            'Neutral (50%)': 'neutral',
            'Leaning Away (35%)': 'leaning_away',
            'At Risk (20%)': 'at_risk',
        }
        return category_mapping.get(salesforce_category, '')
    
    def map_type_to_internal(self, salesforce_type):
        """
        Map Salesforce type to internal choice
        """
        type_mapping = {
            'New Business': 'new_business',
            'Renewal': 'renewal',
            'Upsell': 'upsell',
            'Cross-Sell': 'cross_sell',
        }
        return type_mapping.get(salesforce_type, 'renewal')
    
    def calculate_health_score(self, probability, stage):
        """
        Calculate health score based on probability and stage
        """
        if stage in ['closed_won']:
            return 'healthy'
        elif stage in ['closed_lost']:
            return 'critical'
        elif probability >= 75:
            return 'healthy'
        elif probability >= 50:
            return 'at_risk'
        else:
            return 'critical'
    
    def map_industry_from_account(self, account_name):
        """
        Map account name to industry (simple heuristic, can be improved)
        """
        account_lower = account_name.lower()
        if any(word in account_lower for word in ['tech', 'software', 'it', 'digital']):
            return 'technology'
        elif any(word in account_lower for word in ['health', 'medical', 'hospital']):
            return 'healthcare'
        elif any(word in account_lower for word in ['bank', 'finance', 'financial']):
            return 'finance'
        elif any(word in account_lower for word in ['retail', 'shop', 'store']):
            return 'retail'
        elif any(word in account_lower for word in ['education', 'university', 'school', 'institute']):
            return 'education'
        elif any(word in account_lower for word in ['manufacturing', 'factory', 'production']):
            return 'manufacturing'
        return 'other'
    
    @transaction.atomic
    def sync_opportunity(self, salesforce_data):
        """
        Sync a single Salesforce Opportunity to Django models.
        Primary data goes to Customer, metadata goes to SalesforceOpportunity.
        """
        if not salesforce_data:
            return None
        
        # Extract core fields for Customer table
        account_name = salesforce_data.get('Account', {}).get('Name', '')
        account_id = salesforce_data.get('AccountId', '')
        amount = salesforce_data.get('Amount', 0) or salesforce_data.get('Amount_USD__c', 0)
        close_date_str = salesforce_data.get('CloseDate', '')
        probability = salesforce_data.get('Probability', 0) or 0
        stage = self.map_stage_to_internal(salesforce_data.get('StageName', ''))
        
        # Calculate health score
        health_score = self.calculate_health_score(probability, stage)
        
        # Parse close date
        try:
            close_date = datetime.strptime(close_date_str, '%Y-%m-%d').date()
        except (ValueError, TypeError):
            close_date = datetime.now().date()
        
        # Get or create Customer (primary data)
        customer, customer_created = Customer.objects.get_or_create(
            salesforce_account_id=account_id,
            defaults={
                'name': account_name,
                'industry': self.map_industry_from_account(account_name),
                'arr': amount,
                'health_score': health_score,
                'renewal_date': close_date,
                'salesforce_synced': True,
                'last_salesforce_sync': timezone.now(),
            }
        )
        
        # Update customer if it already existed
        if not customer_created:
            customer.name = account_name
            customer.arr = amount
            customer.health_score = health_score
            customer.renewal_date = close_date
            customer.salesforce_synced = True
            customer.last_salesforce_sync = timezone.now()
            # Update products if provided in Salesforce data
            if 'Products__c' in salesforce_data and salesforce_data.get('Products__c'):
                customer.products = salesforce_data.get('Products__c')
            customer.save()
        else:
            # Set products for newly created customer
            if 'Products__c' in salesforce_data and salesforce_data.get('Products__c'):
                customer.products = salesforce_data.get('Products__c')
                customer.save()
        
        # Extract all Salesforce-specific data for SalesforceOpportunity table
        opportunity_id = salesforce_data.get('Id')
        
        # Get or create SalesforceOpportunity (metadata)
        salesforce_opp, opp_created = SalesforceOpportunity.objects.get_or_create(
            salesforce_id=opportunity_id,
            defaults={
                'customer': customer,
                'opportunity_name': salesforce_data.get('Name', ''),
                'account_name': account_name,
                'stage': stage,
                'probability': probability,
                'close_date': close_date,
                'amount': salesforce_data.get('Amount', 0) or 0,
                'currency_code': salesforce_data.get('CurrencyIsoCode', 'USD'),
                'amount_usd': salesforce_data.get('Amount_USD__c'),
                'opportunity_csm': salesforce_data.get('Opportunity_CSM__c', ''),
                'renewal_categories': self.map_renewal_category(
                    salesforce_data.get('Renewal_Categories__c', '')
                ),
                'opportunity_type': self.map_type_to_internal(
                    salesforce_data.get('Type', 'Renewal')
                ),
                'opportunity_owner': salesforce_data.get('Owner', {}).get('Name', ''),
                'lead_source': salesforce_data.get('LeadSource', ''),
                'closed_reason': salesforce_data.get('ClosedReason', ''),
                'custom_agreement': salesforce_data.get('Custom_Agreement__c', False),
                'cpq_auto_renew': salesforce_data.get('CPQ_Auto_Renew__c', False),
                'send_survey_to_buying_contact': salesforce_data.get('Send_Survey_to_Buying_Contact__c', False),
                'billing_survey_sent_time': self._parse_datetime(
                    salesforce_data.get('Billing_Survey_Sent_Time__c')
                ),
                'executive_influencers': salesforce_data.get('Executive_Influencers__c', ''),
                'gr_number': salesforce_data.get('GR_Number__c', ''),
                'feature_request': salesforce_data.get('Feature_Request__c', ''),
                'furthest_stage': salesforce_data.get('Furthest_Stage__c', ''),
                'was_lost_without_advancement': salesforce_data.get('Was_Lost_Without_Advancement__c', False),
                'verbal_award': salesforce_data.get('Verbal_Award__c', False),
                'security_review_completed': salesforce_data.get('Security_Review_Completed__c', False),
                'mutually_agreed_sign_date': salesforce_data.get('Mutually_Agreed_Sign_Date__c', False),
                'financial_terms_agreed': salesforce_data.get('Financial_Terms_Agreed__c', False),
                'legal_completed': salesforce_data.get('Legal_Completed__c', False),
                'next_step': salesforce_data.get('Next_Step__c', ''),
                'support_needed': salesforce_data.get('Support_Needed__c', ''),
                'salesforce_metadata': {
                    'attributes': salesforce_data.get('attributes', {}),
                    'Account': salesforce_data.get('Account', {}),
                    'Owner': salesforce_data.get('Owner', {}),
                },
                'raw_api_response': salesforce_data,  # Store complete response for RAG
            }
        )
        
        # Update if already existed
        if not opp_created:
            salesforce_opp.customer = customer
            salesforce_opp.opportunity_name = salesforce_data.get('Name', '')
            salesforce_opp.account_name = account_name
            salesforce_opp.stage = stage
            salesforce_opp.probability = probability
            salesforce_opp.close_date = close_date
            salesforce_opp.amount = salesforce_data.get('Amount', 0) or 0
            salesforce_opp.currency_code = salesforce_data.get('CurrencyIsoCode', 'USD')
            salesforce_opp.amount_usd = salesforce_data.get('Amount_USD__c')
            salesforce_opp.opportunity_csm = salesforce_data.get('Opportunity_CSM__c', '')
            salesforce_opp.renewal_categories = self.map_renewal_category(
                salesforce_data.get('Renewal_Categories__c', '')
            )
            salesforce_opp.opportunity_type = self.map_type_to_internal(
                salesforce_data.get('Type', 'Renewal')
            )
            salesforce_opp.opportunity_owner = salesforce_data.get('Owner', {}).get('Name', '')
            salesforce_opp.raw_api_response = salesforce_data
            salesforce_opp.save()
        
        return {
            'customer': customer,
            'salesforce_opportunity': salesforce_opp,
            'created': customer_created or opp_created
        }
    
    def _parse_datetime(self, datetime_str):
        """Parse Salesforce datetime string"""
        if not datetime_str:
            return None
        try:
            # Salesforce format: 2024-03-27T14:20:00.000+0000
            return datetime.strptime(datetime_str.split('.')[0], '%Y-%m-%dT%H:%M:%S')
        except (ValueError, AttributeError):
            return None
    
    def sync_all_opportunities(self):
        """
        Sync all opportunities from Salesforce API
        """
        opportunities = self.fetch_all_opportunities()
        results = []
        
        for opp_data in opportunities:
            result = self.sync_opportunity(opp_data)
            if result:
                results.append(result)
        
        return results

