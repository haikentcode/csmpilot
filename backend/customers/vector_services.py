"""
Vector Services for Customer Data in CSM Copilot
Handles embedding generation and vector operations for customer similarity search
"""
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from django.conf import settings
from customers.models import Customer, CustomerMetrics, Feedback, Meeting

# Conditional imports to handle missing packages during development
try:
    from csmpilot.pinecone_config import get_pinecone_manager
    PINECONE_AVAILABLE = True
except ImportError:
    PINECONE_AVAILABLE = False
    print("Pinecone not available - install requirements to enable vector operations")

logger = logging.getLogger(__name__)

class CustomerVectorService:
    """Service for handling customer data vectorization and similarity search"""
    
    def __init__(self):
        self.pinecone_manager = None
        if PINECONE_AVAILABLE:
            try:
                self.pinecone_manager = get_pinecone_manager()
            except Exception as e:
                logger.error(f"Failed to initialize Pinecone: {e}")
    
    def create_customer_text_representation(self, customer: Customer) -> str:
        """
        Create a comprehensive text representation of a customer for embedding
        """
        try:
            # Basic customer info
            text_parts = [
                f"Company: {customer.name}",
                f"Industry: {customer.industry}",
                f"Annual Recurring Revenue: ${customer.arr}",
                f"Health Score: {customer.health_score}",
                f"Renewal Date: {customer.renewal_date}",
            ]
            
            # Add metrics if available
            if hasattr(customer, 'metrics'):
                metrics = customer.metrics
                text_parts.extend([
                    f"Net Promoter Score: {metrics.nps}",
                    f"Usage Trend: {metrics.usage_trend}",
                    f"Active Users: {metrics.active_users}",
                    f"Renewal Rate: {metrics.renewal_rate}%",
                    f"Seat Utilization: {metrics.seat_utilization}%",
                    f"Response Usage: {metrics.response_usage_percentage:.1f}%"
                ])
            
            # Add recent feedback themes
            recent_feedback = customer.feedback.all()[:3]
            if recent_feedback:
                feedback_texts = [f.title for f in recent_feedback]
                text_parts.append(f"Recent Feedback: {', '.join(feedback_texts)}")
            
            # Add recent meeting insights
            recent_meetings = customer.meetings.all()[:2]
            if recent_meetings:
                meeting_summaries = [m.summary[:100] for m in recent_meetings]
                text_parts.append(f"Recent Meetings: {'; '.join(meeting_summaries)}")
            
            return " | ".join(text_parts)
            
        except Exception as e:
            logger.error(f"Error creating text representation for customer {customer.id}: {e}")
            return f"Company: {customer.name} | Industry: {customer.industry}"
    
    def generate_customer_metadata(self, customer: Customer) -> Dict[str, Any]:
        """Generate metadata for the customer vector"""
        metadata = {
            'customer_id': customer.id,
            'name': customer.name,
            'industry': customer.industry,
            'arr': float(customer.arr),
            'health_score': customer.health_score,
            'renewal_date': customer.renewal_date.isoformat(),
            'last_updated': customer.last_updated.isoformat(),
            'created_at': customer.created_at.isoformat(),
        }
        
        # Add metrics if available
        if hasattr(customer, 'metrics'):
            metrics = customer.metrics
            metadata.update({
                'nps': metrics.nps,
                'usage_trend': metrics.usage_trend,
                'active_users': metrics.active_users,
                'renewal_rate': float(metrics.renewal_rate),
                'seat_utilization': float(metrics.seat_utilization),
            })
        
        return metadata
    
    def add_customer_to_vector_db(self, customer: Customer) -> bool:
        """Add or update a customer in the vector database"""
        if not self.pinecone_manager or not self.pinecone_manager.index:
            logger.warning("Pinecone index not available - skipping vector operation")
            return False
        
        try:
            # Create text representation
            text = self.create_customer_text_representation(customer)
            
            # Generate embedding
            embedding = self.pinecone_manager.generate_embedding(text)
            if not embedding:
                logger.error(f"Failed to generate embedding for customer {customer.id}")
                return False
            
            # Create metadata
            metadata = self.generate_customer_metadata(customer)
            
            # Upsert to Pinecone
            vector_id = f"customer_{customer.id}"
            vectors = [{
                'id': vector_id,
                'values': embedding,
                'metadata': metadata
            }]
            
            response = self.pinecone_manager.upsert_vectors(vectors)
            if response:
                logger.info(f"Successfully added customer {customer.id} to vector database")
                return True
            else:
                logger.error(f"Failed to upsert customer {customer.id} to vector database")
                return False
                
        except Exception as e:
            logger.error(f"Error adding customer {customer.id} to vector database: {e}")
            return False
    
    def find_similar_customers(self, customer: Customer, top_k: int = 10, 
                             filter_criteria: Dict = None) -> List[Dict[str, Any]]:
        """Find similar customers based on vector similarity"""
        if not self.pinecone_manager or not self.pinecone_manager.index:
            logger.warning("Pinecone index not available - returning empty results")
            return []
        
        try:
            # Create text representation and embedding
            text = self.create_customer_text_representation(customer)
            query_embedding = self.pinecone_manager.generate_embedding(text)
            
            if not query_embedding:
                logger.error(f"Failed to generate query embedding for customer {customer.id}")
                return []
            
            # Build filter
            filter_dict = filter_criteria or {}
            # Exclude the customer itself
            filter_dict['customer_id'] = {'$ne': customer.id}
            
            # Query similar vectors
            response = self.pinecone_manager.query_vectors(
                query_vector=query_embedding,
                top_k=top_k,
                filter_dict=filter_dict
            )
            
            if not response or not response.matches:
                return []
            
            # Format results
            similar_customers = []
            for match in response.matches:
                similar_customers.append({
                    'customer_id': match.metadata.get('customer_id'),
                    'name': match.metadata.get('name'),
                    'industry': match.metadata.get('industry'),
                    'arr': match.metadata.get('arr'),
                    'health_score': match.metadata.get('health_score'),
                    'similarity_score': match.score,
                    'metadata': match.metadata
                })
            
            return similar_customers
            
        except Exception as e:
            logger.error(f"Error finding similar customers for {customer.id}: {e}")
            return []
    
    def bulk_add_customers(self, batch_size: int = 100) -> Dict[str, int]:
        """Add all customers to vector database in batches"""
        if not self.pinecone_manager:
            logger.warning("Pinecone not available - skipping bulk operation")
            return {'success': 0, 'failed': 0}
        
        success_count = 0
        failed_count = 0
        
        try:
            customers = Customer.objects.select_related('metrics').prefetch_related(
                'feedback', 'meetings'
            ).all()
            
            total_customers = customers.count()
            logger.info(f"Starting bulk add of {total_customers} customers")
            
            # Process in batches
            batch = []
            for customer in customers:
                try:
                    text = self.create_customer_text_representation(customer)
                    embedding = self.pinecone_manager.generate_embedding(text)
                    
                    if embedding:
                        metadata = self.generate_customer_metadata(customer)
                        vector_id = f"customer_{customer.id}"
                        
                        batch.append({
                            'id': vector_id,
                            'values': embedding,
                            'metadata': metadata
                        })
                    
                    # Upsert batch when it reaches batch_size
                    if len(batch) >= batch_size:
                        response = self.pinecone_manager.upsert_vectors(batch)
                        if response:
                            success_count += len(batch)
                        else:
                            failed_count += len(batch)
                        batch = []
                        
                except Exception as e:
                    logger.error(f"Error processing customer {customer.id}: {e}")
                    failed_count += 1
            
            # Upsert remaining batch
            if batch:
                response = self.pinecone_manager.upsert_vectors(batch)
                if response:
                    success_count += len(batch)
                else:
                    failed_count += len(batch)
            
            logger.info(f"Bulk add completed: {success_count} success, {failed_count} failed")
            return {'success': success_count, 'failed': failed_count}
            
        except Exception as e:
            logger.error(f"Error in bulk add customers: {e}")
            return {'success': success_count, 'failed': failed_count}
    
    def remove_customer_from_vector_db(self, customer_id: int) -> bool:
        """Remove a customer from the vector database"""
        if not self.pinecone_manager:
            logger.warning("Pinecone not available - skipping delete operation")
            return False
        
        try:
            vector_id = f"customer_{customer_id}"
            response = self.pinecone_manager.delete_vectors([vector_id])
            
            if response:
                logger.info(f"Successfully removed customer {customer_id} from vector database")
                return True
            else:
                logger.error(f"Failed to remove customer {customer_id} from vector database")
                return False
                
        except Exception as e:
            logger.error(f"Error removing customer {customer_id} from vector database: {e}")
            return False

# Global service instance
customer_vector_service = CustomerVectorService()

def get_customer_vector_service():
    """Get the global customer vector service instance"""
    return customer_vector_service