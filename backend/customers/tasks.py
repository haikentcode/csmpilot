"""
Celery tasks for asynchronous vector operations
"""
import logging
from celery import shared_task
from typing import Dict, Any
from customers.models import Customer
from customers.vector_services import get_customer_vector_service

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def add_customer_to_vectors(self, customer_id: int) -> Dict[str, Any]:
    """
    Async task to add a customer to the vector database
    """
    try:
        customer = Customer.objects.select_related('metrics').prefetch_related(
            'feedback', 'meetings'
        ).get(id=customer_id)
        
        vector_service = get_customer_vector_service()
        success = vector_service.add_customer_to_vector_db(customer)
        
        if success:
            return {
                'status': 'success',
                'customer_id': customer_id,
                'message': f'Customer {customer.name} added to vector database'
            }
        else:
            return {
                'status': 'failed',
                'customer_id': customer_id,
                'message': f'Failed to add customer {customer.name} to vector database'
            }
            
    except Customer.DoesNotExist:
        logger.error(f"Customer {customer_id} not found")
        return {
            'status': 'error',
            'customer_id': customer_id,
            'message': f'Customer {customer_id} not found'
        }
    except Exception as e:
        logger.error(f"Error in add_customer_to_vectors task: {e}")
        if self.request.retries < self.max_retries:
            logger.info(f"Retrying add_customer_to_vectors for customer {customer_id}")
            raise self.retry(countdown=60 * (self.request.retries + 1))
        
        return {
            'status': 'error',
            'customer_id': customer_id,
            'message': f'Error adding customer to vectors: {str(e)}'
        }

@shared_task(bind=True, max_retries=2)
def update_customer_vectors(self, customer_id: int) -> Dict[str, Any]:
    """
    Async task to update a customer's vector representation
    """
    try:
        customer = Customer.objects.select_related('metrics').prefetch_related(
            'feedback', 'meetings'
        ).get(id=customer_id)
        
        vector_service = get_customer_vector_service()
        
        # Update is same as add (upsert operation)
        success = vector_service.add_customer_to_vector_db(customer)
        
        if success:
            return {
                'status': 'success',
                'customer_id': customer_id,
                'message': f'Customer {customer.name} vectors updated'
            }
        else:
            return {
                'status': 'failed',
                'customer_id': customer_id,
                'message': f'Failed to update vectors for customer {customer.name}'
            }
            
    except Customer.DoesNotExist:
        logger.error(f"Customer {customer_id} not found")
        return {
            'status': 'error',
            'customer_id': customer_id,
            'message': f'Customer {customer_id} not found'
        }
    except Exception as e:
        logger.error(f"Error in update_customer_vectors task: {e}")
        if self.request.retries < self.max_retries:
            logger.info(f"Retrying update_customer_vectors for customer {customer_id}")
            raise self.retry(countdown=60 * (self.request.retries + 1))
        
        return {
            'status': 'error',
            'customer_id': customer_id,
            'message': f'Error updating customer vectors: {str(e)}'
        }

@shared_task(bind=True, max_retries=1)
def remove_customer_vectors(self, customer_id: int) -> Dict[str, Any]:
    """
    Async task to remove a customer from the vector database
    """
    try:
        vector_service = get_customer_vector_service()
        success = vector_service.remove_customer_from_vector_db(customer_id)
        
        if success:
            return {
                'status': 'success',
                'customer_id': customer_id,
                'message': f'Customer {customer_id} removed from vector database'
            }
        else:
            return {
                'status': 'failed',
                'customer_id': customer_id,
                'message': f'Failed to remove customer {customer_id} from vector database'
            }
            
    except Exception as e:
        logger.error(f"Error in remove_customer_vectors task: {e}")
        if self.request.retries < self.max_retries:
            logger.info(f"Retrying remove_customer_vectors for customer {customer_id}")
            raise self.retry(countdown=30)
        
        return {
            'status': 'error',
            'customer_id': customer_id,
            'message': f'Error removing customer vectors: {str(e)}'
        }

@shared_task(bind=True, max_retries=1)
def bulk_populate_vectors(self, batch_size: int = 100) -> Dict[str, Any]:
    """
    Async task to populate all customers into vector database
    """
    try:
        vector_service = get_customer_vector_service()
        result = vector_service.bulk_add_customers(batch_size=batch_size)
        
        return {
            'status': 'completed',
            'success_count': result['success'],
            'failed_count': result['failed'],
            'message': f"Bulk population completed: {result['success']} success, {result['failed']} failed"
        }
        
    except Exception as e:
        logger.error(f"Error in bulk_populate_vectors task: {e}")
        if self.request.retries < self.max_retries:
            logger.info("Retrying bulk_populate_vectors")
            raise self.retry(countdown=300)  # 5 minute delay
        
        return {
            'status': 'error',
            'message': f'Error in bulk population: {str(e)}'
        }