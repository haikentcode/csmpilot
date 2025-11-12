"""
Celery tasks for Gainsight data synchronization
"""

from celery import shared_task
from django.conf import settings
from django.utils import timezone
from .sync_service import GainsightSyncService
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, default_retry_delay=300, max_retries=5)
def sync_all_gainsight_companies(self):
    """
    Celery task to fetch and sync all Gainsight companies.
    """
    logger.info("Starting Gainsight company sync task...")
    api_url = getattr(settings, 'GAINSIGHT_MOCK_API_URL', 'http://localhost:3001/mock-apis/gainsight')
    sync_service = GainsightSyncService(api_base_url=api_url)
    
    try:
        companies_data = sync_service.fetch_companies()
        if not companies_data:
            logger.warning("No companies fetched from Gainsight mock API.")
            return {
                'status': 'success',
                'synced_count': 0,
                'message': 'No companies to sync',
                'timestamp': timezone.now().isoformat()
            }
        
        synced_count = 0
        for company_data in companies_data:
            try:
                sync_service.sync_company(company_data)
                synced_count += 1
            except Exception as e:
                logger.error(f"Error syncing company {company_data.get('Name', 'Unknown')}: {e}", exc_info=True)
                continue
        
        logger.info(f"Successfully synced {synced_count} Gainsight companies.")
        return {
            'status': 'success',
            'synced_count': synced_count,
            'message': f'Successfully synced {synced_count} Gainsight companies',
            'timestamp': timezone.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error during Gainsight sync: {e}", exc_info=True)
        self.retry(exc=e)

