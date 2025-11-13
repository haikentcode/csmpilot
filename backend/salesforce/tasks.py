"""
Celery tasks for Salesforce synchronization
"""

from celery import shared_task
from django.utils import timezone
from .sync_service import SalesforceSyncService
import logging

logger = logging.getLogger(__name__)


@shared_task(name='salesforce.sync_all_opportunities')
def sync_all_opportunities():
    """
    Periodic task to sync all opportunities from Salesforce API
    Runs every hour (configurable via django-celery-beat)
    """
    logger.info("Starting Salesforce sync task...")
    
    try:
        sync_service = SalesforceSyncService(api_base_url='http://localhost:3001/mock-apis/salesforce')
        results = sync_service.sync_all_opportunities()
        
        logger.info(f"Salesforce sync completed. Synced {len(results)} opportunities.")
        return {
            'status': 'success',
            'synced_count': len(results),
            'timestamp': timezone.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Salesforce sync failed: {str(e)}", exc_info=True)
        return {
            'status': 'error',
            'error': str(e),
            'timestamp': timezone.now().isoformat()
        }


@shared_task(name='salesforce.sync_single_opportunity')
def sync_single_opportunity(opportunity_id):
    """
    Task to sync a single opportunity by ID
    """
    logger.info(f"Syncing single opportunity: {opportunity_id}")
    
    try:
        sync_service = SalesforceSyncService(api_base_url='http://localhost:3001/mock-apis/salesforce')
        opportunity_data = sync_service.fetch_opportunity(opportunity_id)
        
        if opportunity_data:
            result = sync_service.sync_opportunity(opportunity_data)
            logger.info(f"Successfully synced opportunity {opportunity_id}")
            return {
                'status': 'success',
                'opportunity_id': opportunity_id,
                'customer_id': result['customer'].id if result else None,
                'timestamp': timezone.now().isoformat()
            }
        else:
            logger.warning(f"Opportunity {opportunity_id} not found")
            return {
                'status': 'not_found',
                'opportunity_id': opportunity_id,
                'timestamp': timezone.now().isoformat()
            }
    except Exception as e:
        logger.error(f"Failed to sync opportunity {opportunity_id}: {str(e)}", exc_info=True)
        return {
            'status': 'error',
            'opportunity_id': opportunity_id,
            'error': str(e),
            'timestamp': timezone.now().isoformat()
        }

