"""
Management command to delete all synced data from database and Pinecone.

This will delete:
- All Customer records
- All SalesforceOpportunity records
- All GainsightCompany records
- All GongMeeting records
- All Feedback records
- All Meeting records
- All CustomerMetrics records
- All Pinecone vectors

Usage:
    python manage.py cleanup_all_data
    python manage.py cleanup_all_data --confirm
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from customers.models import Customer, Feedback, Meeting, CustomerMetrics
from salesforce.models import SalesforceOpportunity
from gainsight.models import GainsightCompany
from gong.models import GongMeeting
from customers.vector_services import get_customer_vector_service
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Delete all synced data from database and Pinecone vector database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm deletion (required to actually delete)',
        )
        parser.add_argument(
            '--skip-pinecone',
            action='store_true',
            help='Skip Pinecone vector deletion',
        )

    def handle(self, *args, **options):
        confirm = options['confirm']
        skip_pinecone = options['skip_pinecone']

        if not confirm:
            self.stdout.write(self.style.WARNING(
                '⚠️  This will delete ALL data from database and Pinecone!'
            ))
            self.stdout.write('')
            self.stdout.write('To proceed, run with --confirm flag:')
            self.stdout.write(self.style.SUCCESS('  python manage.py cleanup_all_data --confirm'))
            self.stdout.write('')
            self.stdout.write('To skip Pinecone deletion:')
            self.stdout.write(self.style.SUCCESS('  python manage.py cleanup_all_data --confirm --skip-pinecone'))
            return

        self.stdout.write(self.style.WARNING('🗑️  Starting data cleanup...'))
        self.stdout.write('')

        # Count records before deletion
        counts = {
            'customers': Customer.objects.count(),
            'salesforce_opportunities': SalesforceOpportunity.objects.count(),
            'gainsight_companies': GainsightCompany.objects.count(),
            'gong_meetings': GongMeeting.objects.count(),
            'feedback': Feedback.objects.count(),
            'meetings': Meeting.objects.count(),
            'customer_metrics': CustomerMetrics.objects.count(),
        }

        self.stdout.write('📊 Current data counts:')
        for model_name, count in counts.items():
            self.stdout.write(f'   {model_name}: {count}')
        self.stdout.write('')

        # Delete Pinecone vectors first
        if not skip_pinecone:
            try:
                self.stdout.write('🗑️  Deleting Pinecone vectors...')
                vector_service = get_customer_vector_service()
                if vector_service and vector_service.pinecone_manager:
                    # Get all customer IDs
                    customer_ids = list(Customer.objects.values_list('id', flat=True))
                    if customer_ids:
                        deleted_count = 0
                        for customer_id in customer_ids:
                            try:
                                vector_service.remove_customer_from_vector_db(customer_id)
                                deleted_count += 1
                            except Exception as e:
                                self.stdout.write(self.style.WARNING(
                                    f'   Warning: Could not delete vector for customer {customer_id}: {e}'
                                ))
                        self.stdout.write(self.style.SUCCESS(
                            f'   ✅ Deleted {deleted_count} vectors from Pinecone'
                        ))
                    else:
                        self.stdout.write('   ℹ️  No customers found, skipping Pinecone deletion')
                else:
                    self.stdout.write(self.style.WARNING(
                        '   ⚠️  Pinecone not configured, skipping vector deletion'
                    ))
            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f'   ❌ Error deleting Pinecone vectors: {e}'
                ))
                self.stdout.write('   Continuing with database cleanup...')
            self.stdout.write('')
        else:
            self.stdout.write('⏭️  Skipping Pinecone deletion (--skip-pinecone flag)')
            self.stdout.write('')

        # Delete database records
        try:
            with transaction.atomic():
                self.stdout.write('🗑️  Deleting database records...')

                # Delete in order (respecting foreign keys)
                deleted_counts = {}

                # Delete related records first
                deleted_counts['gong_meetings'] = GongMeeting.objects.all().delete()[0]
                self.stdout.write(f'   ✅ Deleted {deleted_counts["gong_meetings"]} GongMeeting records')

                deleted_counts['salesforce_opportunities'] = SalesforceOpportunity.objects.all().delete()[0]
                self.stdout.write(f'   ✅ Deleted {deleted_counts["salesforce_opportunities"]} SalesforceOpportunity records')

                deleted_counts['gainsight_companies'] = GainsightCompany.objects.all().delete()[0]
                self.stdout.write(f'   ✅ Deleted {deleted_counts["gainsight_companies"]} GainsightCompany records')

                deleted_counts['feedback'] = Feedback.objects.all().delete()[0]
                self.stdout.write(f'   ✅ Deleted {deleted_counts["feedback"]} Feedback records')

                deleted_counts['meetings'] = Meeting.objects.all().delete()[0]
                self.stdout.write(f'   ✅ Deleted {deleted_counts["meetings"]} Meeting records')

                deleted_counts['customer_metrics'] = CustomerMetrics.objects.all().delete()[0]
                self.stdout.write(f'   ✅ Deleted {deleted_counts["customer_metrics"]} CustomerMetrics records')

                # Delete customers last (they have foreign keys from above)
                deleted_counts['customers'] = Customer.objects.all().delete()[0]
                self.stdout.write(f'   ✅ Deleted {deleted_counts["customers"]} Customer records')

            self.stdout.write('')
            self.stdout.write(self.style.SUCCESS('✅ Database cleanup completed successfully!'))
            self.stdout.write('')

            # Summary
            self.stdout.write('📊 Deletion summary:')
            for model_name, deleted_count in deleted_counts.items():
                self.stdout.write(f'   {model_name}: {deleted_count} records deleted')

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Error during database cleanup: {e}'))
            raise

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('🎉 All data cleanup completed!'))
        self.stdout.write('')
        self.stdout.write('📝 Next steps:')
        self.stdout.write('   1. Update JSON files with products (if needed)')
        self.stdout.write('   2. Run sync tasks to re-populate data:')
        self.stdout.write('      python manage.py resync_all_data')
        self.stdout.write('   OR wait for Celery Beat to auto-sync (every 5 minutes)')

