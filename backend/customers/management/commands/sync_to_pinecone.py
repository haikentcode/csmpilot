from django.core.management.base import BaseCommand
from customers.models import Customer
from csmpilot.pinecone_config import PineconeManager
import time

class Command(BaseCommand):
    help = 'Sync all customer data to Pinecone vector database'

    def handle(self, *args, **options):
        self.stdout.write('Starting Pinecone sync...')
        
        pm = PineconeManager()
        customers = Customer.objects.all()
        
        for customer in customers:
            try:
                # Create customer text representation
                customer_text = f"Company: {customer.name}, Industry: {customer.industry}, ARR: {customer.arr}, Health: {customer.health_score}"
                
                # Generate embedding
                embedding = pm.generate_embedding(customer_text)
                
                # Upsert to Pinecone
                pm.index.upsert([{
                    'id': f'customer_{customer.id}',
                    'values': embedding,
                    'metadata': {
                        'customer_id': customer.id,
                        'name': customer.name,
                        'industry': customer.industry,
                        'arr': float(customer.arr),
                        'health_score': customer.health_score,
                        'text': customer_text
                    }
                }])
                
                self.stdout.write(f'✅ Synced customer {customer.name}')
                time.sleep(0.1)  # Small delay to avoid rate limits
                
            except Exception as e:
                self.stdout.write(f'❌ Failed to sync {customer.name}: {e}')
        
        self.stdout.write(self.style.SUCCESS('Pinecone sync completed!'))