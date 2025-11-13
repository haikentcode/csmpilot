"""
Management command to trigger re-sync of all data from mock APIs.

This will:
1. Trigger Salesforce sync
2. Trigger Gainsight sync
3. Trigger Gong sync
4. Wait for completion (optional)
5. Show summary

Usage:
    python manage.py resync_all_data
    python manage.py resync_all_data --wait
    python manage.py resync_all_data --salesforce-only
"""

from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils import timezone
from salesforce.sync_service import SalesforceSyncService
from gainsight.sync_service import GainsightSyncService
from gong.sync_service import GongSyncService
from customers.models import Customer
from salesforce.models import SalesforceOpportunity
from gainsight.models import GainsightCompany
from gong.models import GongMeeting
import time

class Command(BaseCommand):
    help = 'Trigger re-sync of all data from mock APIs'

    def add_arguments(self, parser):
        parser.add_argument(
            '--wait',
            action='store_true',
            help='Wait for sync tasks to complete',
        )
        parser.add_argument(
            '--salesforce-only',
            action='store_true',
            help='Only sync Salesforce data',
        )
        parser.add_argument(
            '--gainsight-only',
            action='store_true',
            help='Only sync Gainsight data',
        )
        parser.add_argument(
            '--gong-only',
            action='store_true',
            help='Only sync Gong data',
        )

    def handle(self, *args, **options):
        wait = options['wait']
        salesforce_only = options['salesforce_only']
        gainsight_only = options['gainsight_only']
        gong_only = options['gong_only']

        self.stdout.write('🔄 Starting data re-sync...')
        self.stdout.write('')

        # Count before sync
        before_counts = {
            'customers': Customer.objects.count(),
            'salesforce_opportunities': SalesforceOpportunity.objects.count(),
            'gainsight_companies': GainsightCompany.objects.count(),
            'gong_meetings': GongMeeting.objects.count(),
        }

        self.stdout.write('📊 Data counts before sync:')
        for model_name, count in before_counts.items():
            self.stdout.write(f'   {model_name}: {count}')
        self.stdout.write('')

        tasks = {}

        # Get API URLs from settings
        salesforce_url = getattr(settings, 'SALESFORCE_MOCK_API_URL', 'http://mock-api:3001/mock-apis/salesforce')
        gainsight_url = getattr(settings, 'GAINSIGHT_MOCK_API_URL', 'http://mock-api:3001/mock-apis/gainsight')
        gong_url = getattr(settings, 'GONG_MOCK_API_URL', 'http://mock-api:3001/mock-apis/gong')

        # Trigger sync tasks
        if not gainsight_only and not gong_only:
            self.stdout.write('🔄 Triggering Salesforce sync...')
            try:
                sync_service = SalesforceSyncService(api_base_url=salesforce_url)
                results = sync_service.sync_all_opportunities()
                synced_count = len(results)
                tasks['salesforce'] = {'status': 'success', 'synced_count': synced_count}
                self.stdout.write(self.style.SUCCESS(
                    f'   ✅ Salesforce sync completed: {synced_count} opportunities synced'
                ))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'   ❌ Salesforce sync failed: {e}'))
                tasks['salesforce'] = {'status': 'error', 'error': str(e)}
            self.stdout.write('')

        if not salesforce_only and not gong_only:
            self.stdout.write('🔄 Triggering Gainsight sync...')
            try:
                sync_service = GainsightSyncService(api_base_url=gainsight_url)
                companies_data = sync_service.fetch_companies()
                if not companies_data:
                    self.stdout.write(self.style.WARNING('   ⚠️  No companies fetched from Gainsight mock API.'))
                    tasks['gainsight'] = {'status': 'success', 'synced_count': 0}
                else:
                    synced_count = 0
                    for company_data in companies_data:
                        try:
                            sync_service.sync_company(company_data)
                            synced_count += 1
                        except Exception as e:
                            self.stdout.write(self.style.WARNING(f'   ⚠️  Error syncing company: {e}'))
                            continue
                    tasks['gainsight'] = {'status': 'success', 'synced_count': synced_count}
                    self.stdout.write(self.style.SUCCESS(
                        f'   ✅ Gainsight sync completed: {synced_count} companies synced'
                    ))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'   ❌ Gainsight sync failed: {e}'))
                tasks['gainsight'] = {'status': 'error', 'error': str(e)}
            self.stdout.write('')

        if not salesforce_only and not gainsight_only:
            self.stdout.write('🔄 Triggering Gong sync...')
            try:
                sync_service = GongSyncService(api_base_url=gong_url)
                results = sync_service.sync_all_meetings()
                synced_count = len(results) if results else 0
                tasks['gong'] = {'status': 'success', 'synced_count': synced_count}
                self.stdout.write(self.style.SUCCESS(
                    f'   ✅ Gong sync completed: {synced_count} meetings synced'
                ))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'   ❌ Gong sync failed: {e}'))
                tasks['gong'] = {'status': 'error', 'error': str(e)}
            self.stdout.write('')

        # Wait for tasks if requested
        if wait and not salesforce_only and not gainsight_only and not gong_only:
            self.stdout.write('⏳ Waiting for all syncs to complete...')
            time.sleep(5)  # Give tasks time to start
            self.stdout.write('')

        # Count after sync (if waited)
        if wait:
            time.sleep(2)  # Small delay for database to update
            after_counts = {
                'customers': Customer.objects.count(),
                'salesforce_opportunities': SalesforceOpportunity.objects.count(),
                'gainsight_companies': GainsightCompany.objects.count(),
                'gong_meetings': GongMeeting.objects.count(),
            }

            self.stdout.write('📊 Data counts after sync:')
            for model_name, count in after_counts.items():
                before = before_counts.get(model_name, 0)
                diff = count - before
                if diff > 0:
                    self.stdout.write(self.style.SUCCESS(
                        f'   {model_name}: {count} (+{diff})'
                    ))
                elif diff < 0:
                    self.stdout.write(self.style.WARNING(
                        f'   {model_name}: {count} ({diff})'
                    ))
                else:
                    self.stdout.write(f'   {model_name}: {count} (no change)')
            self.stdout.write('')

        # Summary
        self.stdout.write(self.style.SUCCESS('🎉 Re-sync completed!'))
        self.stdout.write('')
        self.stdout.write('📝 Summary:')
        for service, result in tasks.items():
            if result.get('status') == 'queued':
                self.stdout.write(f'   {service}: Queued (Task ID: {result.get("task_id")})')
            elif result.get('status') == 'error':
                self.stdout.write(self.style.ERROR(
                    f'   {service}: Error - {result.get("error")}'
                ))
            else:
                synced = result.get('synced_count', 0)
                self.stdout.write(f'   {service}: {synced} records synced')

        self.stdout.write('')
        self.stdout.write('💡 Tip: Check Celery logs to see detailed sync progress')
        self.stdout.write('   docker compose logs -f celery')

