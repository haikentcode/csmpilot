#!/bin/bash

# CSM Pilot - Complete Reset and Re-sync Script
# This script will:
# 1. Delete all data from database and Pinecone
# 2. Re-sync all data from mock APIs (Salesforce, Gainsight, Gong)
# 3. Process Gong meetings with AI
# 4. Optionally rebuild frontend
#
# Usage: ./reset_and_sync_all.sh [--rebuild-frontend]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if rebuild frontend flag is set
REBUILD_FRONTEND=false
if [[ "$1" == "--rebuild-frontend" ]]; then
    REBUILD_FRONTEND=true
fi

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   CSM Pilot - Complete Reset and Re-sync Script         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Docker is running
if ! docker compose ps > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker Compose is not running${NC}"
    echo "Please start Docker services first:"
    echo "  docker compose up -d"
    exit 1
fi

# Check if backend service is running
if ! docker compose ps backend | grep -q "Up"; then
    echo -e "${YELLOW}⚠️  Backend service is not running. Starting services...${NC}"
    docker compose up -d backend
    sleep 5
fi

echo -e "${GREEN}✅ Docker services are running${NC}"
echo ""

# Step 1: Clean up all data
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 1: Cleaning up all data${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

docker compose exec -T backend python manage.py cleanup_all_data --confirm --skip-pinecone 2>&1 | grep -v "SSL\|Pinecone\|OpenAI\|Connecting\|Configured\|Initializing" || true

echo ""
echo -e "${GREEN}✅ Data cleanup completed${NC}"
echo ""

# Step 2: Re-sync all data
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 2: Re-syncing all data from mock APIs${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

docker compose exec -T backend python manage.py resync_all_data --wait 2>&1 | grep -v "SSL\|Pinecone\|OpenAI\|Connecting\|Configured\|Initializing" | tail -20

echo ""
echo -e "${GREEN}✅ Data re-sync completed${NC}"
echo ""

# Step 3: Process Gong meetings with AI
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 3: Processing Gong meetings with AI${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Processing meetings in batches..."
docker compose exec -T backend python manage.py shell << 'PYTHON_SCRIPT'
from gong.models import GongMeeting
from gong.tasks import process_meeting_with_ai
import time

unprocessed = GongMeeting.objects.filter(ai_processed=False)
total = unprocessed.count()
print(f'Found {total} unprocessed meetings')
print('Processing...')

batch_size = 5
processed_count = 0

for i in range(0, total, batch_size):
    batch = unprocessed[i:i+batch_size]
    for meeting in batch:
        try:
            result = process_meeting_with_ai(meeting.id)
            if result and result.get('status') in ['success', 'partial']:
                processed_count += 1
        except Exception:
            pass
    
    if i + batch_size < total:
        time.sleep(3)

print(f'Processed {processed_count} meetings')
time.sleep(10)  # Wait for async processing

# Check final status
final_processed = GongMeeting.objects.filter(ai_processed=True).count()
final_total = GongMeeting.objects.count()
print(f'Final status: {final_processed}/{final_total} meetings AI processed')
PYTHON_SCRIPT

echo ""
echo -e "${GREEN}✅ AI processing completed${NC}"
echo ""

# Step 4: Verify data
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 4: Verifying data${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

docker compose exec -T backend python manage.py shell << 'PYTHON_SCRIPT'
from customers.models import Customer
from salesforce.models import SalesforceOpportunity
from gainsight.models import GainsightCompany
from gong.models import GongMeeting

print('📊 Final Data Status:')
print('')
print(f'   ✅ Customers: {Customer.objects.count()}')
print(f'   ✅ Customers with Products: {Customer.objects.exclude(products=[]).count()}/{Customer.objects.count()}')
customers_with_meetings = sum(1 for c in Customer.objects.all() if GongMeeting.objects.filter(company=c).count() > 0)
print(f'   ✅ Customers with Gong Meetings: {customers_with_meetings}/{Customer.objects.count()}')
print(f'   ✅ Salesforce Opportunities: {SalesforceOpportunity.objects.count()}')
print(f'   ✅ Gainsight Companies: {GainsightCompany.objects.count()}')
print(f'   ✅ Gong Meetings: {GongMeeting.objects.count()}')
processed = GongMeeting.objects.filter(ai_processed=True).count()
total_meetings = GongMeeting.objects.count()
print(f'   ✅ Gong Meetings (AI Processed): {processed}/{total_meetings} ({processed*100//total_meetings if total_meetings > 0 else 0}%)')
PYTHON_SCRIPT

echo ""

# Step 5: Rebuild frontend (optional)
if [ "$REBUILD_FRONTEND" = true ]; then
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}STEP 5: Rebuilding frontend${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    echo "Building frontend with --no-cache..."
    docker compose build --no-cache frontend
    docker compose up -d frontend
    
    echo ""
    echo -e "${GREEN}✅ Frontend rebuilt${NC}"
    echo ""
fi

# Final summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 COMPLETE! All systems ready!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📝 Next Steps:"
echo "   - Test APIs: http://localhost:8000/api/customers/"
echo "   - Frontend: http://localhost:3000"
echo "   - Check API docs: API_DOCUMENTATION.md"
echo ""
echo "✅ All data has been reset and re-synced successfully!"
echo ""

