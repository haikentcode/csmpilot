#!/bin/bash

# CSM Copilot Docker Quick Start Script
# This script helps you start the entire stack with proper setup

set -e

echo "=========================================="
echo "CSM Copilot Docker Setup"
echo "=========================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating template..."
    cat > .env << EOF
# Pinecone Configuration
PINECONE_API_KEY=your-pinecone-api-key-here
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=csm-pilot
PINECONE_INDEX_HOST=

# OpenAI (for Gong AI processing)
OPENAI_API_KEY=your-openai-api-key-here

# Django
DJANGO_SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(50))')
DEBUG=True
EOF
    echo "✅ Created .env file. Please update with your API keys!"
    echo ""
fi

# Check Docker and Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Use docker compose (v2) if available, otherwise docker-compose (v1)
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

echo "📦 Building Docker images..."
$DOCKER_COMPOSE build

echo ""
echo "🚀 Starting services..."
$DOCKER_COMPOSE up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service health
echo ""
echo "🔍 Checking service health..."

# Check Mock API
if curl -s http://localhost:3002/health > /dev/null; then
    echo "✅ Mock API is healthy"
else
    echo "⚠️  Mock API health check failed (may still be starting)"
fi

# Check Django
if curl -s http://localhost:8000/api/customers/ > /dev/null 2>&1; then
    echo "✅ Django backend is responding"
else
    echo "⚠️  Django backend not ready yet (may still be starting)"
fi

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Services:"
echo "  📡 Mock API:      http://localhost:3002"
echo "  🔧 Django API:   http://localhost:8000"
echo "  🎨 Frontend:     http://localhost:3001"
echo "  📊 Admin Panel:  http://localhost:8000/admin"
echo ""
echo "Useful commands:"
echo "  View logs:        $DOCKER_COMPOSE logs -f"
echo "  Stop services:   $DOCKER_COMPOSE down"
echo "  Restart:          $DOCKER_COMPOSE restart"
echo ""
echo "📖 See DOCKER_SETUP_GUIDE.md for detailed documentation"
echo ""

