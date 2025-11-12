"""
Django signals for automatic vector database synchronization
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from customers.models import Customer, CustomerMetrics, Feedback, Meeting
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Customer)
def customer_post_save(sender, instance, created, **kwargs):
    """
    Automatically sync customer to vector database when created or updated
    """
    try:
        # Import here to avoid circular imports
        from customers.tasks import add_customer_to_vectors, update_customer_vectors
        
        if created:
            # New customer - add to vectors
            add_customer_to_vectors.delay(instance.id)
            logger.info(f"Queued vector creation for new customer: {instance.name}")
        else:
            # Existing customer - update vectors
            update_customer_vectors.delay(instance.id)
            logger.info(f"Queued vector update for customer: {instance.name}")
            
    except Exception as e:
        logger.error(f"Error queuing vector sync for customer {instance.id}: {e}")

@receiver(post_delete, sender=Customer)
def customer_post_delete(sender, instance, **kwargs):
    """
    Remove customer from vector database when deleted
    """
    try:
        from customers.tasks import remove_customer_vectors
        
        remove_customer_vectors.delay(instance.id)
        logger.info(f"Queued vector removal for deleted customer: {instance.name}")
        
    except Exception as e:
        logger.error(f"Error queuing vector removal for customer {instance.id}: {e}")

@receiver(post_save, sender=CustomerMetrics)
def customer_metrics_post_save(sender, instance, created, **kwargs):
    """
    Update customer vectors when metrics change
    """
    try:
        from customers.tasks import update_customer_vectors
        
        update_customer_vectors.delay(instance.customer.id)
        logger.info(f"Queued vector update for customer metrics: {instance.customer.name}")
        
    except Exception as e:
        logger.error(f"Error queuing vector update for metrics {instance.id}: {e}")

@receiver(post_save, sender=Feedback)
def feedback_post_save(sender, instance, created, **kwargs):
    """
    Update customer vectors when feedback is added/updated
    """
    try:
        from customers.tasks import update_customer_vectors
        
        update_customer_vectors.delay(instance.customer.id)
        logger.info(f"Queued vector update for customer feedback: {instance.customer.name}")
        
    except Exception as e:
        logger.error(f"Error queuing vector update for feedback {instance.id}: {e}")

@receiver(post_save, sender=Meeting)
def meeting_post_save(sender, instance, created, **kwargs):
    """
    Update customer vectors when meetings are added/updated
    """
    try:
        from customers.tasks import update_customer_vectors
        
        update_customer_vectors.delay(instance.customer.id)
        logger.info(f"Queued vector update for customer meeting: {instance.customer.name}")
        
    except Exception as e:
        logger.error(f"Error queuing vector update for meeting {instance.id}: {e}")