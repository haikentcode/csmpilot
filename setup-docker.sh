#!/bin/bash

# CSM Copilot Docker Setup Script

set -e  # Exit on any error

echo "🐳 CSM Copilot Docker Setup"
echo "=========================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is running"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.docker .env
    
    # Try to copy existing backend .env values
    if [ -f backend/.env ]; then
        echo "🔄 Copying existing Pinecone settings from backend/.env..."
        
        # Extract Pinecone settings from backend .env
        PINECONE_API_KEY=$(grep -E '^PINECONE_API_KEY=' backend/.env | cut -d '=' -f2- | tr -d '"')
        PINECONE_INDEX_HOST=$(grep -E '^PINECONE_INDEX_HOST=' backend/.env | cut -d '=' -f2- | tr -d '"')
        
        if [ ! -z "$PINECONE_API_KEY" ]; then
            sed -i '' "s|PINECONE_API_KEY=.*|PINECONE_API_KEY=$PINECONE_API_KEY|" .env
            echo "✅ Copied PINECONE_API_KEY"
        fi
        
        if [ ! -z "$PINECONE_INDEX_HOST" ]; then
            sed -i '' "s|PINECONE_INDEX_HOST=.*|PINECONE_INDEX_HOST=$PINECONE_INDEX_HOST|" .env
            echo "✅ Copied PINECONE_INDEX_HOST"
        fi
    fi
    
    echo "⚠️  Please verify .env file has correct settings:"
    echo "   PINECONE_API_KEY=your-actual-api-key"
    echo "   PINECONE_INDEX_HOST=https://csm-pilot-w9uksjc.svc.aped-4627-b74a.pinecone.io"
else
    echo "✅ .env file exists"
fi

# Build and start services
echo ""
echo "🔨 Building Docker images..."
docker-compose build

echo ""
echo "🚀 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo ""
echo "🏥 Checking service health..."

# Check Redis
if docker-compose exec redis redis-cli ping | grep -q PONG; then
    echo "✅ Redis: Healthy"
else
    echo "❌ Redis: Not responding"
fi

# Check Database
if docker-compose exec db pg_isready -U csmpilot_user -d csmpilot > /dev/null 2>&1; then
    echo "✅ Database: Healthy"
else
    echo "❌ Database: Not responding"
fi

# Check Backend
if curl -f http://localhost:8000/api/customers/ > /dev/null 2>&1; then
    echo "✅ Backend: Healthy"
else
    echo "⚠️  Backend: Starting up (this may take a moment)"
fi

# Check Frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend: Healthy"
else
    echo "⚠️  Frontend: Starting up (this may take a moment)"
fi

echo ""
echo "🎉 CSM Copilot is starting up!"
echo ""
echo "📍 Services:"
echo "   🌐 Frontend:  http://localhost:3000"
echo "   🔧 Backend:   http://localhost:8000"
echo "   📊 API Docs:  http://localhost:8000/api/docs/"
echo "   🔄 Redis:     localhost:6379"
echo "   🗄️  Database: localhost:5432"
echo ""
echo "🔧 Useful commands:"
echo "   View logs:      docker-compose logs -f"
echo "   Stop services:  docker-compose down"
echo "   Restart:        docker-compose restart"
echo "   Shell access:   docker-compose exec backend bash"
echo ""
echo "🧪 To populate sample data:"
echo "   docker-compose exec backend python manage.py load_sample_data"
echo ""
echo "🎯 To sync vectors with Pinecone:"
echo "   docker-compose exec backend python manage.py sync_vectors"
echo ""
echo "✨ SSL certificate issues are automatically resolved in Docker!"