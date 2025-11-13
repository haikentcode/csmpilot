"""
Celery tasks for Gong data synchronization and AI processing
"""

from celery import shared_task
from django.conf import settings
from django.utils import timezone
from .sync_service import GongSyncService
from .ai_service import GongAIService
from .models import GongMeeting
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, default_retry_delay=300, max_retries=5)
def sync_all_gong_meetings(self, account_id=None):
    """
    Celery task to fetch and sync all Gong meetings.
    
    Args:
        account_id: Optional account ID to filter meetings
    """
    logger.info("Starting Gong meetings sync task...")
    api_url = getattr(settings, 'GONG_MOCK_API_URL', 'http://localhost:3001/mock-apis/gong')
    sync_service = GongSyncService(api_base_url=api_url)
    
    try:
        results = sync_service.sync_all_meetings(account_id=account_id)
        
        if not results:
            logger.warning("No meetings synced from Gong mock API.")
            return {
                'status': 'success',
                'synced_count': 0,
                'message': 'No meetings to sync',
                'timestamp': timezone.now().isoformat()
            }
        
        synced_count = len(results)
        logger.info(f"Successfully synced {synced_count} Gong meetings.")
        
        return {
            'status': 'success',
            'synced_count': synced_count,
            'message': f'Successfully synced {synced_count} Gong meetings',
            'timestamp': timezone.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error during Gong sync: {e}", exc_info=True)
        self.retry(exc=e)


@shared_task(bind=True, default_retry_delay=60, max_retries=3)
def process_meeting_with_ai(self, meeting_id):
    """
    Celery task to process a single meeting through OpenAI.
    
    Args:
        meeting_id: GongMeeting ID
    """
    logger.info(f"Processing meeting {meeting_id} with AI...")
    
    try:
        meeting = GongMeeting.objects.get(id=meeting_id)
        
        ai_service = GongAIService()
        success = ai_service.process_and_save_insights(meeting)
        
        if success:
            insights_count = len(meeting.ai_insights.get('insights', []))
            logger.info(f"Successfully processed meeting {meeting_id}. Found {insights_count} insights.")
            return {
                'status': 'success',
                'meeting_id': meeting_id,
                'insights_count': insights_count,
                'timestamp': timezone.now().isoformat()
            }
        else:
            logger.warning(f"AI processing completed but may have errors for meeting {meeting_id}")
            return {
                'status': 'partial',
                'meeting_id': meeting_id,
                'timestamp': timezone.now().isoformat()
            }
    except GongMeeting.DoesNotExist:
        logger.error(f"Meeting {meeting_id} not found")
        return {
            'status': 'error',
            'error': 'Meeting not found',
            'timestamp': timezone.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error processing meeting {meeting_id}: {e}", exc_info=True)
        self.retry(exc=e)


@shared_task(bind=True, default_retry_delay=300, max_retries=5)
def sync_and_process_gong_meetings(self, account_id=None):
    """
    Combined task: Sync meetings and process them with AI.
    
    Args:
        account_id: Optional account ID to filter meetings
    """
    logger.info("Starting Gong sync and AI processing task...")
    
    # Step 1: Sync meetings
    sync_result = sync_all_gong_meetings(account_id=account_id)
    
    if sync_result['status'] != 'success':
        return sync_result
    
    # Step 2: Process unprocessed meetings with AI
    unprocessed_meetings = GongMeeting.objects.filter(ai_processed=False)
    
    processed_count = 0
    for meeting in unprocessed_meetings:
        try:
            process_meeting_with_ai.delay(meeting.id)  # Queue for async processing
            processed_count += 1
        except Exception as e:
            logger.error(f"Error queuing meeting {meeting.id} for AI processing: {e}")
    
    logger.info(f"Queued {processed_count} meetings for AI processing.")
    
    return {
        'status': 'success',
        'synced_count': sync_result.get('synced_count', 0),
        'queued_for_ai': processed_count,
        'message': f'Synced {sync_result.get("synced_count", 0)} meetings, queued {processed_count} for AI processing',
        'timestamp': timezone.now().isoformat()
    }

