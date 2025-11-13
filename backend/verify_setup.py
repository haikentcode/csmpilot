#!/usr/bin/env python
"""
Comprehensive Setup Verification Script
Checks all components of the CSM Pilot system
"""

import os
import sys
import django
import requests
import json
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'csmpilot.settings')
django.setup()

from django.db import connection
from customers.models import Customer
from salesforce.models import SalesforceOpportunity
from gainsight.models import GainsightCompany
from gong.models import GongMeeting
from integrations.models import IntegrationMetadata
from django_celery_beat.models import PeriodicTask, IntervalSchedule

print("=" * 80)
print("🔍 CSM PILOT SETUP VERIFICATION")
print("=" * 80)
print()

# Track overall status
all_checks_passed = True

# ============================================================================
# 1. Check Mock API Service
# ============================================================================
print("📡 1. CHECKING MOCK API SERVICE")
print("-" * 80)

try:
    response = requests.get('http://localhost:3001/health', timeout=5)
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Mock API Service is running")
        print(f"   Status: {data.get('status')}")
        print(f"   Integrations: {', '.join(data.get('integrations', []))}")
    else:
        print(f"❌ Mock API Service returned status {response.status_code}")
        all_checks_passed = False
except requests.exceptions.ConnectionError:
    print("❌ Mock API Service is NOT running")
    print("   Start it with: cd mock-api-service && node server.js")
    all_checks_passed = False
except Exception as e:
    print(f"❌ Error checking Mock API Service: {e}")
    all_checks_passed = False

print()

# ============================================================================
# 2. Check Database Migrations
# ============================================================================
print("🗄️  2. CHECKING DATABASE MIGRATIONS")
print("-" * 80)

try:
    with connection.cursor() as cursor:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
        tables = [row[0] for row in cursor.fetchall()]
    
    required_tables = [
        'customers_customer',
        'salesforce_salesforceopportunity',
        'gainsight_gainsightcompany',
        'gong_gongmeeting',
        'integrations_integrationmetadata',
        'django_celery_beat_periodictask',
        'django_celery_beat_intervalschedule',
    ]
    
    missing_tables = [t for t in required_tables if t not in tables]
    
    if not missing_tables:
        print("✅ All required database tables exist")
        for table in required_tables:
            print(f"   ✓ {table}")
    else:
        print("❌ Missing database tables:")
        for table in missing_tables:
            print(f"   ✗ {table}")
        print("   Run: python manage.py migrate")
        all_checks_passed = False
except Exception as e:
    print(f"❌ Error checking database: {e}")
    all_checks_passed = False

print()

# ============================================================================
# 3. Check Celery Beat Periodic Tasks
# ============================================================================
print("⏰ 3. CHECKING CELERY BEAT PERIODIC TASKS")
print("-" * 80)

try:
    tasks = PeriodicTask.objects.all()
    
    required_tasks = [
        'Sync Salesforce Opportunities',
        'Sync Gainsight Companies',
        'Sync Gong Meetings',
    ]
    
    existing_task_names = [task.name for task in tasks]
    missing_tasks = [t for t in required_tasks if t not in existing_task_names]
    
    if not missing_tasks:
        print("✅ All periodic tasks are configured")
        for task in tasks:
            status = "🟢 Enabled" if task.enabled else "🔴 Disabled"
            schedule_info = f"every {task.interval.every} {task.interval.period}" if task.interval else "N/A"
            print(f"   {status} {task.name}")
            print(f"      Task: {task.task}")
            print(f"      Schedule: {schedule_info}")
    else:
        print("⚠️  Missing periodic tasks:")
        for task_name in missing_tasks:
            print(f"   ✗ {task_name}")
        print("   Run: python manage.py shell < setup_celery_tasks.py")
        all_checks_passed = False
except Exception as e:
    print(f"❌ Error checking periodic tasks: {e}")
    all_checks_passed = False

print()

# ============================================================================
# 4. Check Data in Database
# ============================================================================
print("📊 4. CHECKING DATABASE DATA")
print("-" * 80)

try:
    customer_count = Customer.objects.count()
    salesforce_count = SalesforceOpportunity.objects.count()
    gainsight_count = GainsightCompany.objects.count()
    gong_count = GongMeeting.objects.count()
    
    print(f"   Customers: {customer_count}")
    print(f"   Salesforce Opportunities: {salesforce_count}")
    print(f"   Gainsight Companies: {gainsight_count}")
    print(f"   Gong Meetings: {gong_count}")
    
    if customer_count == 0:
        print("⚠️  No customer data found")
        print("   Data will be synced when Celery tasks run")
    else:
        print("✅ Customer data exists")
        
except Exception as e:
    print(f"❌ Error checking database data: {e}")
    all_checks_passed = False

print()

# ============================================================================
# 5. Test Mock API Endpoints
# ============================================================================
print("🧪 5. TESTING MOCK API ENDPOINTS")
print("-" * 80)

endpoints_to_test = [
    {
        'name': 'Salesforce Opportunities',
        'url': 'http://localhost:3001/mock-apis/salesforce/services/data/v58.0/sobjects/Opportunity',
        'method': 'GET'
    },
    {
        'name': 'Gainsight Companies',
        'url': 'http://localhost:3001/mock-apis/gainsight/v1/data/objects/query/Company',
        'method': 'POST',
        'headers': {'Accesskey': 'test-key'},
        'json': {}
    },
    {
        'name': 'Gong Meetings',
        'url': 'http://localhost:3001/mock-apis/gong/v2/calls',
        'method': 'GET'
    },
]

for endpoint in endpoints_to_test:
    try:
        if endpoint['method'] == 'GET':
            response = requests.get(endpoint['url'], timeout=5)
        else:
            response = requests.post(
                endpoint['url'],
                headers=endpoint.get('headers', {}),
                json=endpoint.get('json', {}),
                timeout=5
            )
        
        if response.status_code == 200:
            data = response.json()
            
            # Count records based on endpoint structure
            if 'records' in data:
                count = len(data['records'])
            elif 'data' in data:
                count = len(data['data']) if isinstance(data['data'], list) else 1
            elif 'calls' in data:
                count = len(data['calls'])
            else:
                count = "Unknown"
            
            print(f"✅ {endpoint['name']}: {count} records")
        else:
            print(f"❌ {endpoint['name']}: HTTP {response.status_code}")
            all_checks_passed = False
    except requests.exceptions.ConnectionError:
        print(f"❌ {endpoint['name']}: Connection failed (Mock API not running)")
        all_checks_passed = False
    except Exception as e:
        print(f"❌ {endpoint['name']}: {str(e)}")
        all_checks_passed = False

print()

# ============================================================================
# 6. Check Celery Configuration
# ============================================================================
print("🔧 6. CHECKING CELERY CONFIGURATION")
print("-" * 80)

try:
    from csmpilot import celery
    from celery import current_app
    
    print(f"✅ Celery app configured: {current_app.main}")
    print(f"   Broker: {current_app.conf.broker_url}")
    print(f"   Result backend: {current_app.conf.result_backend}")
    
    # Check if tasks are registered
    registered_tasks = list(current_app.tasks.keys())
    sync_tasks = [t for t in registered_tasks if 'sync' in t.lower()]
    
    if sync_tasks:
        print(f"   Registered sync tasks: {len(sync_tasks)}")
        for task in sync_tasks:
            print(f"      • {task}")
    else:
        print("⚠️  No sync tasks registered")
        all_checks_passed = False
        
except Exception as e:
    print(f"❌ Error checking Celery configuration: {e}")
    all_checks_passed = False

print()

# ============================================================================
# 7. Check Environment Variables
# ============================================================================
print("🔐 7. CHECKING ENVIRONMENT VARIABLES")
print("-" * 80)

env_vars_to_check = [
    ('OPENAI_API_KEY', 'OpenAI API Key'),
    ('PINECONE_API_KEY', 'Pinecone API Key'),
    ('PINECONE_INDEX_NAME', 'Pinecone Index Name'),
]

for var_name, description in env_vars_to_check:
    value = os.getenv(var_name)
    if value:
        masked_value = value[:8] + '...' if len(value) > 8 else '***'
        print(f"✅ {description}: {masked_value}")
    else:
        print(f"⚠️  {description}: Not set")

print()

# ============================================================================
# SUMMARY
# ============================================================================
print("=" * 80)
if all_checks_passed:
    print("✅ ALL CHECKS PASSED!")
    print()
    print("🚀 Your system is ready. Next steps:")
    print()
    print("1. Start Mock API Service (if not running):")
    print("   cd mock-api-service && node server.js")
    print()
    print("2. Start Django Backend:")
    print("   python manage.py runserver")
    print()
    print("3. Start Celery Worker:")
    print("   celery -A csmpilot worker --loglevel=info")
    print()
    print("4. Start Celery Beat (scheduler):")
    print("   celery -A csmpilot beat --loglevel=info")
    print()
    print("5. Start Frontend:")
    print("   cd frontend && npm run dev")
    print()
    print("📝 To manually trigger a sync:")
    print("   python manage.py shell")
    print("   >>> from salesforce.tasks import sync_all_opportunities")
    print("   >>> sync_all_opportunities.delay()")
else:
    print("❌ SOME CHECKS FAILED")
    print()
    print("Please review the errors above and fix them before proceeding.")
    print()

print("=" * 80)
print(f"Verification completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("=" * 80)

sys.exit(0 if all_checks_passed else 1)

