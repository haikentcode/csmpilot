"""
Gong Sync Service
Handles syncing meeting data from mock Gong API to Django models.
"""

import requests
from datetime import datetime
from django.utils import timezone
from django.db import transaction
from customers.models import Customer
from .models import GongMeeting


class GongSyncService:
    """
    Service to sync Gong meeting data to Django models.
    """
    
    def __init__(self, api_base_url='http://localhost:3001/mock-apis/gong'):
        self.api_base_url = api_base_url.rstrip('/')
    
    def fetch_meetings(self, account_id=None):
        """
        Fetch meetings from mock Gong API.
        
        Args:
            account_id: Optional account ID to filter meetings
        
        Returns:
            List of meeting dictionaries
        """
        url = f"{self.api_base_url}/v2/calls"
        params = {}
        if account_id:
            params['accountId'] = account_id
        
        try:
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            return data.get('calls', [])
        except requests.RequestException as e:
            print(f"Error fetching meetings from Gong: {e}")
            return []
    
    def fetch_meeting_by_id(self, call_id):
        """
        Fetch a specific meeting by call ID.
        """
        url = f"{self.api_base_url}/v2/calls/{call_id}"
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"Error fetching meeting {call_id}: {e}")
            return None
    
    def match_meeting_to_customer(self, meeting_data):
        """
        Match Gong meeting to Customer by account name.
        Returns Customer instance or None.
        """
        account_name = meeting_data.get('account', {}).get('name', '')
        if not account_name:
            return None
        
        # Try exact match first
        try:
            customers = Customer.objects.filter(name=account_name)
            if customers.count() == 1:
                return customers.first()
            elif customers.count() > 1:
                # Multiple customers with same name - prefer customers without meetings
                from .models import GongMeeting
                customers_without_meetings = [c for c in customers if GongMeeting.objects.filter(company=c).count() == 0]
                if customers_without_meetings:
                    # Among customers without meetings, prefer healthcare, then most recent
                    healthcare_customer = [c for c in customers_without_meetings if c.industry == 'healthcare']
                    if healthcare_customer:
                        return healthcare_customer[0]
                    return max(customers_without_meetings, key=lambda c: c.last_updated)
                # All have meetings - prefer healthcare, then most recent
                healthcare_customer = customers.filter(industry='healthcare').first()
                if healthcare_customer:
                    return healthcare_customer
                # Otherwise return most recently updated
                return customers.order_by('-last_updated').first()
        except Customer.DoesNotExist:
            pass
        
        # Try partial match
        try:
            customer = Customer.objects.filter(name__icontains=account_name).first()
            if customer:
                return customer
        except:
            pass
        
        # Try matching by deal name
        deal_name = meeting_data.get('deal', {}).get('name', '')
        if deal_name:
            try:
                customer = Customer.objects.filter(name__icontains=deal_name).first()
                if customer:
                    return customer
            except:
                pass
        
        return None
    
    def _parse_datetime(self, datetime_str):
        """Parse Gong datetime string"""
        if not datetime_str:
            return None
        try:
            # Gong format: 2024-10-22T14:00:00Z
            return datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            return None
    
    @transaction.atomic
    def sync_meeting(self, meeting_data, customer=None):
        """
        Sync a single Gong meeting to Django model.
        
        Args:
            meeting_data: Meeting data from Gong API
            customer: Optional Customer instance (will try to match if not provided)
        
        Returns:
            tuple: (GongMeeting instance, created boolean)
        """
        if not meeting_data:
            return None, False
        
        # Match to customer if not provided
        if not customer:
            customer = self.match_meeting_to_customer(meeting_data)
            if not customer:
                print(f"Could not match meeting to customer: {meeting_data.get('title', 'Unknown')}")
                return None, False
        
        # Extract meeting identifiers
        gong_meeting_id = meeting_data.get('id') or meeting_data.get('callId', '')
        gong_call_id = meeting_data.get('callId', '')
        
        if not gong_meeting_id:
            print(f"Meeting missing ID: {meeting_data.get('title', 'Unknown')}")
            return None, False
        
        # Parse meeting date
        meeting_date = self._parse_datetime(meeting_data.get('startedAt'))
        if not meeting_date:
            meeting_date = timezone.now()
        
        # Extract deal information
        deal = meeting_data.get('deal', {})
        
        # Get or create GongMeeting
        meeting, created = GongMeeting.objects.get_or_create(
            gong_meeting_id=gong_meeting_id,
            defaults={
                'company': customer,
                'gong_call_id': gong_call_id,
                'meeting_title': meeting_data.get('title', 'Untitled Meeting'),
                'meeting_date': meeting_date,
                'duration_seconds': meeting_data.get('duration', 0),
                'direction': meeting_data.get('direction', 'outbound'),
                'participants': meeting_data.get('participants', []),
                'meeting_summary': meeting_data.get('summary', ''),
                'meeting_transcript': meeting_data.get('transcript', ''),
                'raw_meeting_data': meeting_data,
                'deal_name': deal.get('name', ''),
                'deal_value': deal.get('value'),
                'deal_stage': deal.get('stage', ''),
            }
        )
        
        # Update if already existed
        if not created:
            meeting.company = customer
            meeting.gong_call_id = gong_call_id
            meeting.meeting_title = meeting_data.get('title', 'Untitled Meeting')
            meeting.meeting_date = meeting_date
            meeting.duration_seconds = meeting_data.get('duration', 0)
            meeting.direction = meeting_data.get('direction', 'outbound')
            meeting.participants = meeting_data.get('participants', [])
            meeting.meeting_summary = meeting_data.get('summary', '')
            meeting.meeting_transcript = meeting_data.get('transcript', '')
            meeting.raw_meeting_data = meeting_data
            meeting.deal_name = deal.get('name', '')
            meeting.deal_value = deal.get('value')
            meeting.deal_stage = deal.get('stage', '')
            meeting.save()
        
        return meeting, created
    
    def sync_all_meetings(self, account_id=None):
        """
        Sync all meetings from Gong API.
        
        Args:
            account_id: Optional account ID to filter
        
        Returns:
            List of synced meeting results
        """
        meetings_data = self.fetch_meetings(account_id=account_id)
        results = []
        
        for meeting_data in meetings_data:
            meeting, created = self.sync_meeting(meeting_data)
            if meeting:
                results.append({
                    'meeting': meeting,
                    'created': created
                })
        
        return results

