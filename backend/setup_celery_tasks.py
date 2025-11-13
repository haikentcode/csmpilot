"""
Script to set up Celery Beat periodic tasks for Salesforce and Gainsight syncing.
Run this once to configure automatic syncing.

Usage:
    python manage.py shell < setup_celery_tasks.py
    OR
    python manage.py shell
    >>> exec(open('setup_celery_tasks.py').read())
"""

from django_celery_beat.models import PeriodicTask, IntervalSchedule
from django.utils import timezone

# Create interval schedules
# All syncs: Every 5 minutes
#  (for testing/demo)
salesforce_schedule, _ = IntervalSchedule.objects.get_or_create(
    every=5,
    period=IntervalSchedule.MINUTES,
)

gainsight_schedule, _ = IntervalSchedule.objects.get_or_create(
    every=5,
    period=IntervalSchedule.MINUTES,
)

gong_schedule, _ = IntervalSchedule.objects.get_or_create(
    every=5,
    period=IntervalSchedule.MINUTES,
)

# Create or update Salesforce periodic task
salesforce_task, created = PeriodicTask.objects.get_or_create(
    name='Sync Salesforce Opportunities',
    defaults={
        'task': 'salesforce.sync_all_opportunities',
        'interval': salesforce_schedule,
        'enabled': True,
        'description': 'Periodically sync Salesforce opportunities to Customer and SalesforceOpportunity models',
    }
)

if created:
    print(f"✅ Created Salesforce periodic task: {salesforce_task.name}")
    print(f"   Runs every: {salesforce_schedule.every} {salesforce_schedule.period}")
else:
    print(f"✅ Salesforce periodic task already exists: {salesforce_task.name}")
    salesforce_task.enabled = True
    salesforce_task.interval = salesforce_schedule
    salesforce_task.save()
    print(f"   Updated to run every: {salesforce_schedule.every} {salesforce_schedule.period}")

# Create or update Gainsight periodic task
gainsight_task, created = PeriodicTask.objects.get_or_create(
    name='Sync Gainsight Companies',
    defaults={
        'task': 'gainsight.tasks.sync_all_gainsight_companies',
        'interval': gainsight_schedule,
        'enabled': True,
        'description': 'Periodically sync Gainsight companies to Customer and GainsightCompany models',
    }
)

if created:
    print(f"✅ Created Gainsight periodic task: {gainsight_task.name}")
    print(f"   Runs every: {gainsight_schedule.every} {gainsight_schedule.period}")
else:
    print(f"✅ Gainsight periodic task already exists: {gainsight_task.name}")
    gainsight_task.enabled = True
    gainsight_task.interval = gainsight_schedule
    gainsight_task.save()
    print(f"   Updated to run every: {gainsight_schedule.every} {gainsight_schedule.period}")

# Create or update Gong periodic task
gong_task, created = PeriodicTask.objects.get_or_create(
    name='Sync Gong Meetings',
    defaults={
        'task': 'gong.tasks.sync_all_gong_meetings',
        'interval': gong_schedule,
        'enabled': True,
        'description': 'Periodically sync Gong meetings to GongMeeting model and process with AI',
    }
)

if created:
    print(f"✅ Created Gong periodic task: {gong_task.name}")
    print(f"   Runs every: {gong_schedule.every} {gong_schedule.period}")
else:
    print(f"✅ Gong periodic task already exists: {gong_task.name}")
    gong_task.enabled = True
    gong_task.interval = gong_schedule
    gong_task.save()
    print(f"   Updated to run every: {gong_schedule.every} {gong_schedule.period}")

print("")
print("=" * 60)
print("✅ Periodic tasks configured!")
print("")
print("📋 Summary:")
print(f"   Salesforce: Syncs every {salesforce_schedule.every} {salesforce_schedule.period}")
print(f"   Gainsight: Syncs every {gainsight_schedule.every} {gainsight_schedule.period}")
print(f"   Gong: Syncs every {gong_schedule.every} {gong_schedule.period}")
print("")
print("⚠️  Make sure Celery Beat is running:")
print("   celery -A csmpilot beat --loglevel=info")
print("")
print("📝 You can manage these tasks in Django Admin:")
print("   http://localhost:8000/admin/django_celery_beat/periodictask/")

