# 🐳 CSM Copilot Docker Setup

This Docker configuration provides a complete development and production environment for CSM Copilot with Pinecone integration.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- Your Pinecone API key

### 1. Setup Environment Variables

Copy the Docker environment template:
```bash
cp .env.docker .env
```

Edit `.env` file with your actual values:
```bash
# Required: Add your Pinecone API key
PINECONE_API_KEY=your-actual-pinecone-api-key-here
PINECONE_INDEX_HOST=https://csm-pilot-w9uksjc.svc.aped-4627-b74a.pinecone.io

# Optional: Change other settings as needed
DJANGO_SECRET_KEY=your-super-secret-key-here
```

### 2. Start the Application

Run the setup script:
```bash
./setup-docker.sh
```

Or manually:
```bash
docker-compose up -d
```

### 3. Access the Application

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/api/docs/
- **Admin Panel**: http://localhost:8000/admin/

## 📦 Services Included

| Service | Port | Description |
|---------|------|-------------|
| Frontend (Next.js) | 3001 | React frontend with Tailwind CSS |
| Backend (Django) | 8000 | REST API with DRF |
| PostgreSQL | 5432 | Primary database |
| Redis | 6380 | Cache & Celery broker |
| Celery Worker | - | Async task processing |
| Celery Beat | - | Scheduled tasks |

## 🔧 Common Commands

### Development
```bash
# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f celery

# Restart services
docker-compose restart

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

### Database Operations
```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Load sample data
docker-compose exec backend python manage.py load_sample_data

# Sync vectors with Pinecone
docker-compose exec backend python manage.py sync_vectors
```

### Backend Shell Access
```bash
# Django shell
docker-compose exec backend python manage.py shell

# System shell
docker-compose exec backend bash

# Database shell
docker-compose exec db psql -U csmpilot_user -d csmpilot
```

## 🎯 Production Deployment

### Using PostgreSQL (Recommended)
The default configuration uses PostgreSQL. Make sure to update:
- `DJANGO_SECRET_KEY` with a secure random key
- Database passwords in production
- Set `DEBUG=False` for production

### Using SQLite (Simpler)
For simpler deployment, use the SQLite configuration:
```bash
docker-compose -f docker-compose.sqlite.yml up -d
```

### Environment Variables for Production
```bash
# Security
DEBUG=False
DJANGO_SECRET_KEY=your-super-secure-production-key
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database (if using external PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database

# Pinecone (your actual configuration)
PINECONE_API_KEY=your-production-api-key
PINECONE_INDEX_HOST=your-production-index-host
```

## 🔍 Troubleshooting

### SSL Certificate Issues
✅ **SOLVED!** Docker automatically handles SSL certificates properly on Linux containers.

### Service Health Checks
```bash
# Check all services
docker-compose ps

# Check specific service health
docker-compose exec backend python manage.py check
docker-compose exec redis redis-cli ping
```

### Common Issues

1. **Port already in use**
   ```bash
   # Change ports in docker-compose.yml or stop conflicting services
   lsof -ti:3000 | xargs kill -9  # Kill process on port 3000
   ```

2. **Database connection issues**
   ```bash
   # Reset database
   docker-compose down -v
   docker-compose up -d
   ```

3. **Pinecone connection issues**
   - Verify your API key in `.env`
   - Check your index host URL
   - View logs: `docker-compose logs -f backend`

## 🎉 Features Working in Docker

✅ **All SSL issues resolved**  
✅ **Full Pinecone integration**  
✅ **Vector similarity search**  
✅ **Async task processing**  
✅ **Database migrations**  
✅ **Static file serving**  
✅ **Hot reloading (development)**  

## 📊 Testing the Integration

Once services are running:

1. **Load sample data**:
   ```bash
   docker-compose exec backend python manage.py load_sample_data
   ```

2. **Sync vectors**:
   ```bash
   docker-compose exec backend python manage.py sync_vectors
   ```

3. **Test similarity search**:
   ```bash
   curl http://localhost:8000/api/customers/1/similar/
   ```

4. **Access frontend**: http://localhost:3000

## 🔧 Development Workflow

1. Make code changes in `./backend/` or `./frontend/`
2. Changes are automatically reflected (hot reload)
3. For new dependencies:
   ```bash
   # Backend
   docker-compose exec backend pip install new-package
   docker-compose exec backend pip freeze > requirements.txt
   
   # Frontend  
   docker-compose exec frontend npm install new-package
   ```
4. Rebuild if needed: `docker-compose up -d --build`

---

**🎯 Your CSM Copilot is now fully Dockerized with complete Pinecone integration!**

The SSL certificate issues are completely resolved in the Docker environment, and all vector similarity features work perfectly.