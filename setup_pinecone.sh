#!/bin/bash

# CSM Copilot Pinecone Integration Setup Script
# This script sets up the complete Pinecone integration for your project

set -e  # Exit on any error

echo "🚀 Setting up Pinecone Integration for CSM Copilot..."

# Check if we're in the right directory
if [ ! -f "requirements.txt" ]; then
    echo "❌ Error: Please run this script from the backend directory"
    exit 1
fi

# Step 1: Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Step 2: Set up environment variables
echo "🔧 Setting up environment configuration..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Created .env file from .env.example"
    echo "⚠️  Please update .env with your actual Pinecone API key and other settings"
else
    echo "✅ .env file already exists"
fi

# Step 3: Run Django migrations
echo "🗄️ Running Django migrations..."
python manage.py makemigrations
python manage.py migrate

# Step 4: Check if Redis is running (for Celery)
echo "🔍 Checking Redis connection..."
if command -v redis-cli &> /dev/null; then
    if redis-cli ping > /dev/null 2>&1; then
        echo "✅ Redis is running"
    else
        echo "⚠️  Redis is not running. Starting Redis..."
        if command -v redis-server &> /dev/null; then
            redis-server --daemonize yes
            echo "✅ Redis started"
        else
            echo "❌ Redis not found. Please install Redis:"
            echo "   macOS: brew install redis"
            echo "   Ubuntu: sudo apt-get install redis-server"
            echo "   Then run: redis-server --daemonize yes"
        fi
    fi
else
    echo "❌ Redis CLI not found. Please install Redis first."
fi

# Step 5: Test Pinecone connection (if API key is set)
echo "🔌 Testing Pinecone connection..."
python -c "
import os
from django.conf import settings
import django
django.setup()

try:
    from csmpilot.pinecone_config import get_pinecone_manager
    if os.getenv('PINECONE_API_KEY'):
        manager = get_pinecone_manager()
        print('✅ Pinecone connection successful')
    else:
        print('⚠️  PINECONE_API_KEY not set in environment')
except Exception as e:
    print(f'❌ Pinecone connection failed: {e}')
    print('   Please check your PINECONE_API_KEY and settings')
"

echo ""
echo "🎉 Pinecone integration setup complete!"
echo ""
echo "Next steps:"
echo "1. Update your .env file with actual Pinecone API key"
echo "2. Start Celery worker: celery -A csmpilot worker --loglevel=info"
echo "3. Run the Django server: python manage.py runserver"
echo "4. Sync existing customers: python manage.py sync_vectors"
echo ""
echo "API endpoints available:"
echo "  - GET /api/customers/{id}/similar/ - Find similar customers"
echo "  - POST /api/customers/{id}/sync-vectors/ - Sync single customer"
echo "  - POST /api/customers/bulk-sync-vectors/ - Sync all customers"
echo ""
echo "For more help, see the documentation or run:"
echo "  python manage.py help sync_vectors"