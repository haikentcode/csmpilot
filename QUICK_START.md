# Quick Start Guide - Reset and Re-sync Everything

## One-Command Reset Script

Use this script to completely reset and re-sync all data:

```bash
./reset_and_sync_all.sh
```

## What It Does

1. ✅ **Deletes all data** from database (customers, opportunities, meetings, etc.)
2. ✅ **Re-syncs all data** from mock APIs:
   - Salesforce opportunities (with products)
   - Gainsight companies (with products)
   - Gong meetings
3. ✅ **Processes Gong meetings** with AI (sentiment analysis, insights)
4. ✅ **Verifies everything** is synced correctly
5. ✅ **Optionally rebuilds frontend** (if `--rebuild-frontend` flag is used)

## Usage

### Basic Usage (Reset and Re-sync)
```bash
./reset_and_sync_all.sh
```

### With Frontend Rebuild
```bash
./reset_and_sync_all.sh --rebuild-frontend
```

## Prerequisites

- Docker and Docker Compose must be running
- Backend service must be accessible
- Mock API service must be running

## What Gets Reset

- ✅ All Customer records
- ✅ All SalesforceOpportunity records
- ✅ All GainsightCompany records
- ✅ All GongMeeting records
- ✅ All Feedback records
- ✅ All Meeting records
- ✅ All CustomerMetrics records

## What Gets Re-synced

- ✅ **18 Customers** from Salesforce and Gainsight
- ✅ **14 Salesforce Opportunities** (all with products)
- ✅ **7 Gainsight Companies** (all with products)
- ✅ **29 Gong Meetings** (all AI processed)
- ✅ **Products** extracted and stored for all customers

## Expected Output

```
╔════════════════════════════════════════════════════════════╗
║   CSM Pilot - Complete Reset and Re-sync Script         ║
╚════════════════════════════════════════════════════════════╝

✅ Docker services are running

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1: Cleaning up all data
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Data cleanup completed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2: Re-syncing all data from mock APIs
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Salesforce sync completed: 14 opportunities synced
✅ Gainsight sync completed: 18 companies synced
✅ Gong sync completed: 29 meetings synced

✅ Data re-sync completed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3: Processing Gong meetings with AI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ AI processing completed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4: Verifying data
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Final Data Status:
   ✅ Customers: 18
   ✅ Customers with Products: 18/18
   ✅ Customers with Gong Meetings: 18/18
   ✅ Salesforce Opportunities: 14
   ✅ Gainsight Companies: 7
   ✅ Gong Meetings: 29
   ✅ Gong Meetings (AI Processed): 29/29 (100%)

🎉 COMPLETE! All systems ready!
```

## Troubleshooting

### Script fails with "Docker Compose is not running"
```bash
# Start Docker services first
docker compose up -d
```

### Script fails with "Backend service is not running"
```bash
# Start backend service
docker compose up -d backend
# Wait a few seconds, then run script again
```

### Data not syncing
```bash
# Check mock API service is running
docker compose ps mock-api

# Check logs
docker compose logs mock-api
docker compose logs celery
```

### Products not appearing
- Verify JSON files have `Products__c` or `Products` field
- Check sync logs: `docker compose logs celery | grep -i product`

## Manual Steps (if script fails)

If the script fails, you can run steps manually:

```bash
# 1. Clean up data
docker compose exec backend python manage.py cleanup_all_data --confirm

# 2. Re-sync data
docker compose exec backend python manage.py resync_all_data --wait

# 3. Process AI (optional, runs automatically via Celery)
docker compose exec backend python manage.py shell
>>> from gong.models import GongMeeting
>>> from gong.tasks import process_meeting_with_ai
>>> for meeting in GongMeeting.objects.filter(ai_processed=False):
...     process_meeting_with_ai(meeting.id)
```

## Verification

After running the script, verify everything:

```bash
# Check customers have products
docker compose exec backend python manage.py shell -c "
from customers.models import Customer
print(f'Customers with products: {Customer.objects.exclude(products=[]).count()}/{Customer.objects.count()}')
"

# Test APIs
curl http://localhost:8000/api/customers/50/
curl http://localhost:8000/api/customers/50/use_cases/
curl http://localhost:8000/api/customers/50/upsell_opportunities/
```

## Notes

- ⏱️ Script takes approximately 2-3 minutes to complete
- 🔄 AI processing happens in background (may take additional time)
- 📊 All data is verified at the end
- ✅ Script is idempotent (safe to run multiple times)

---

**Ready to use!** Just run `./reset_and_sync_all.sh` and everything will be reset and re-synced.

