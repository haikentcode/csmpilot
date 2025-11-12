"""
Django management command to sync customers to Pinecone vector database
"""
from django.core.management.base import BaseCommand, CommandError
from customers.models import Customer
from customers.vector_services import get_customer_vector_service
from customers.tasks import bulk_populate_vectors, add_customer_to_vectors
import time


class Command(BaseCommand):
    help = 'Sync customer data to Pinecone vector database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--customer-id',
            type=int,
            help='Sync specific customer by ID',
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=100,
            help='Batch size for bulk operations (default: 100)',
        )
        parser.add_argument(
            '--async',
            action='store_true',
            help='Use async tasks (requires Celery worker)',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force sync even if vectors exist',
        )

    def handle(self, *args, **options):
        customer_id = options.get('customer_id')
        batch_size = options.get('batch_size')
        use_async = options.get('async')
        force = options.get('force')

        try:
            vector_service = get_customer_vector_service()
            
            if not vector_service.pinecone_manager:
                raise CommandError('Pinecone not available. Check configuration.')

            if customer_id:
                # Sync specific customer
                self.sync_single_customer(customer_id, use_async, vector_service)
            else:
                # Bulk sync all customers
                self.sync_all_customers(batch_size, use_async, vector_service)

        except Exception as e:
            raise CommandError(f'Error syncing to vectors: {e}')

    def sync_single_customer(self, customer_id, use_async, vector_service):
        """Sync a single customer"""
        try:
            customer = Customer.objects.get(id=customer_id)
            self.stdout.write(
                self.style.SUCCESS(f'Syncing customer: {customer.name}')
            )
            
            if use_async:
                task = add_customer_to_vectors.delay(customer_id)
                self.stdout.write(
                    self.style.SUCCESS(f'Async task queued: {task.id}')
                )
            else:
                success = vector_service.add_customer_to_vector_db(customer)
                if success:
                    self.stdout.write(
                        self.style.SUCCESS(f'Successfully synced customer {customer.name}')
                    )
                else:
                    self.stdout.write(
                        self.style.ERROR(f'Failed to sync customer {customer.name}')
                    )
                    
        except Customer.DoesNotExist:
            raise CommandError(f'Customer with ID {customer_id} does not exist')

    def sync_all_customers(self, batch_size, use_async, vector_service):
        """Sync all customers"""
        total_customers = Customer.objects.count()
        self.stdout.write(
            self.style.SUCCESS(f'Starting bulk sync of {total_customers} customers')
        )
        
        if use_async:
            task = bulk_populate_vectors.delay(batch_size=batch_size)
            self.stdout.write(
                self.style.SUCCESS(f'Bulk async task queued: {task.id}')
            )
        else:
            start_time = time.time()
            result = vector_service.bulk_add_customers(batch_size=batch_size)
            end_time = time.time()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Bulk sync completed in {end_time - start_time:.2f} seconds:'
                )
            )
            self.stdout.write(
                self.style.SUCCESS(f'  - Success: {result["success"]}')
            )
            self.stdout.write(
                self.style.WARNING(f'  - Failed: {result["failed"]}')
            )