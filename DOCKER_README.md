# 🐳 CSM Copilot Docker Setup

Complete Docker containerization for CSM Copilot with frontend, backend, database, Redis, and Celery workers.

## 🚀 Quick Start

1. **Clone and setup environment:**
   ```bash
   cd /Users/hregar/Developer/experiments/csmpilot
   cp .env.docker .env
   ```

2. **Edit your `.env` file with your Pinecone credentials:**
   ```bash
   PINECONE_API_KEY=your-actual-pinecone-api-key
   PINECONE_INDEX_HOST=https://csm-pilot-w9uksjc.svc.aped-4627-b74a.pinecone.io
   ```

3. **Run the setup script:**
   ```bash
   ./setup-docker.sh
   ```

## 📦 Services Included

| Service | Port | Description |
|---------|------|-------------|
| **Frontend** | 3000 | Next.js React application |
| **Backend** | 8000 | Django REST API |
| **Database** | 5432 | PostgreSQL database |
| **Redis** | 6379 | Cache and message broker |
| **Celery Worker** | - | Async task processing |
| **Celery Beat** | - | Scheduled tasks |

## 🌐 Access Points

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000/api/
- **API Documentation:** http://localhost:8000/api/docs/
- **Admin Panel:** http://localhost:8000/admin/

## 🔧 Docker Commands

### Basic Operations
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Restart services
docker-compose restart

# Rebuild containers
docker-compose build --no-cache
```

### Service-Specific Commands
```bash
# Backend shell
docker-compose exec backend bash

# Frontend shell
docker-compose exec frontend sh

# Database shell
docker-compose exec db psql -U csmpilot_user -d csmpilot

# Redis shell
docker-compose exec redis redis-cli
```

### Django Management Commands
```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Load sample data
docker-compose exec backend python manage.py load_sample_data

# Sync vectors with Pinecone
docker-compose exec backend python manage.py sync_vectors

# Collect static files
docker-compose exec backend python manage.py collectstatic
```

## 🎯 Key Features Solved by Docker

### ✅ **SSL Certificate Issues Fixed**
- Docker Linux containers handle SSL certificates properly
- No more macOS certificate verification errors
- Pinecone connections work seamlessly

### ✅ **Complete Development Environment**
- All services containerized and orchestrated
- Consistent environment across different machines
- Easy scaling and deployment

### ✅ **Database Upgrade**
- PostgreSQL instead of SQLite for better performance
- Persistent data storage with Docker volumes
- Easy database management and backups

### ✅ **Async Processing**
- Celery workers for background tasks
- Redis message broker
- Scalable task processing

## 🔄 Development Workflow

1. **Start development:**
   ```bash
   ./setup-docker.sh
   ```

2. **Make code changes:**
   - Frontend: Changes auto-reload in development mode
   - Backend: Changes auto-reload with volume mounting

3. **Run tests:**
   ```bash
   docker-compose exec backend python test_final_integration.py
   ```

4. **Check logs:**
   ```bash
   docker-compose logs -f backend
   docker-compose logs -f celery
   ```

## 📊 Production Deployment

### Environment Configuration
```bash
# Update .env for production
DEBUG=False
DJANGO_SECRET_KEY=your-super-secure-production-key
POSTGRES_PASSWORD=strong-production-password
```

### With Nginx (Optional)
```bash
# Start with nginx reverse proxy
docker-compose --profile production up -d
```

## 🧪 Testing Vector Integration

```bash
# Test Pinecone connection
docker-compose exec backend python test_ssl_fix.py

# Test complete integration
docker-compose exec backend python test_final_integration.py

# Manual vector sync
docker-compose exec backend python manage.py sync_vectors
```

## 🎉 Expected Results

After setup, you should see:
- ✅ Frontend running at http://localhost:3000
- ✅ Backend API responding at http://localhost:8000/api/
- ✅ Pinecone vectors syncing without SSL errors
- ✅ Celery processing async tasks
- ✅ Complete AI-powered customer similarity matching

## 🚨 Troubleshooting

### Services won't start
```bash
# Check Docker is running
docker info

# Check logs for errors
docker-compose logs

# Rebuild containers
docker-compose build --no-cache
```

### Database connection issues
```bash
# Check database health
docker-compose exec db pg_isready -U csmpilot_user -d csmpilot

# Reset database
docker-compose down -v
docker-compose up -d
```

### Pinecone connection issues
```bash
# Verify environment variables
docker-compose exec backend env | grep PINECONE

# Test connection
docker-compose exec backend python test_ssl_fix.py
```

## 📝 Notes

- **SSL Issues:** Completely resolved in Docker Linux containers
- **Performance:** Better than local development with optimized containers
- **Scalability:** Easy to scale individual services
- **Deployment:** Production-ready with minimal configuration changes

Your CSM Copilot is now fully containerized and production-ready! 🎉