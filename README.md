# CSM Copilot 🚀

An AI-powered Customer Success Management (CSM) platform that consolidates customer data, tracks health scores, and provides intelligent customer insights using advanced vector similarity search.

## 🎯 Project Overview

CSM Copilot is designed to solve the challenge of scattered customer success tools by providing a unified platform that:

- **Consolidates customer data** from multiple sources
- **Tracks customer health scores** with dynamic insights
- **Manages feedback and meetings** in one place
- **Provides AI-powered customer similarity search** using Pinecone vector database
- **Identifies similar customers** for strategic insights and best practices sharing
- **Delivers intelligent recommendations** based on comprehensive customer analysis
- **Enables real-time vector synchronization** when customer data changes

## 🏗️ Architecture

```
csmpilot/
├── backend/          # Django REST API with AI capabilities
│   ├── customers/    # Customer management with vector services
│   │   ├── vector_services.py    # AI-powered similarity search
│   │   ├── tasks.py             # Async vector processing
│   │   └── signals.py           # Real-time vector sync
│   ├── analytics/    # Analytics and reporting app
│   └── csmpilot/     # Main Django project + Pinecone config
│       └── pinecone_config.py   # Vector database setup
├── frontend/         # Next.js frontend with AI-powered features
├── mcp-server/       # Model Context Protocol server
└── docs/            # Documentation + integration guides
```

## 🤖 AI & Vector Database Features

### Intelligent Customer Similarity
- **Vector-based matching**: Find customers with similar business profiles
- **Multi-dimensional analysis**: Industry, ARR, health scores, usage patterns
- **Real-time recommendations**: Instant insights as data changes
- **Advanced filtering**: Search by specific criteria (industry, revenue, etc.)

### Powered by Pinecone
- **Scalable vector database**: Handle thousands of customer profiles
- **Lightning-fast search**: Sub-second similarity queries
- **Automatic synchronization**: Vector updates when customer data changes
- **Production-ready**: Error handling, monitoring, and fallback strategies

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- pyenv (recommended)
- Node.js 16+ (for frontend)
- **Pinecone account** for vector database (free tier available)
- **Redis** (for async task processing)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/haikentcode/csmpilot.git
   cd csmpilot/backend
   ```

2. **Set up Python environment**
   ```bash
   pyenv activate cmspilot
   # or create new environment: pyenv virtualenv 3.11 cmspilot
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up database**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

6. **Load sample data**
   ```bash
   python manage.py load_sample_data
   ```

7. **Configure AI features**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your credentials:
   # PINECONE_API_KEY=your-api-key
   # REDIS_URL=redis://localhost:6379/0
   ```

8. **Set up Pinecone vector database**
   ```bash
   # Create index in Pinecone Console:
   # - Name: csm-pilot
   # - Dimensions: 1024
   # - Metric: cosine
   # See PINECONE_MANUAL_SETUP.md for details
   ```

9. **Test AI integration**
   ```bash
   python test_local_functionality.py
   ```

10. **Sync customers to vector database**
    ```bash
    python manage.py sync_vectors
    ```

11. **Run development server**
    ```bash
    python manage.py runserver
    ```

12. **Start Celery worker** (optional, for async processing)
    ```bash
    celery -A csmpilot worker -l info
    ```

The API will be available at `http://127.0.0.1:8000/`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:3000/`

## 🤖 AI-Powered API Endpoints

### Customer Similarity Search
Find customers similar to a specific customer using AI:

```bash
# Get similar customers
GET /api/customers/{id}/similar/

# With filtering
GET /api/customers/{id}/similar/?industry=technology&limit=5&min_arr=50000

# Response
{
  "customer_id": 1,
  "customer_name": "TechCorp Solutions",
  "similar_customers": [
    {
      "customer_id": 3,
      "name": "InnovateTech Ltd",
      "industry": "technology",
      "arr": 280000,
      "similarity_score": 0.89,
      "shared_traits": ["Similar ARR", "Technology sector", "Growth trajectory"]
    }
  ],
  "total_found": 5
}
```

### Vector Database Management
```bash
# Sync specific customer to vector database
POST /api/customers/{id}/sync-vectors/

# Bulk sync all customers
POST /api/customers/bulk-sync-vectors/
{
  "batch_size": 100
}
```

### Traditional Endpoints
```bash
# Get all customers
GET /api/customers/

# Get customer dashboard
GET /api/customers/{id}/dashboard/

# Get at-risk customers
GET /api/customers/at-risk/

# Create customer feedback
POST /api/customers/{id}/feedback/
```

## 📊 Data Models

### Customer (Enhanced with AI Metadata)
```json
{
  "id": 1,
  "name": "Emeritus Institute of Management",
  "industry": "Education",
  "arr": 150000,
  "health_score": "Healthy",
  "renewal_date": "2025-12-15",
  "last_updated": "2025-11-09",
  "metrics": {
    "nps": 75,
    "usage_trend": "up",
    "active_users": 120,
    "renewal_rate": 95.5,
    "seat_utilization": 87.3
  }
}
```

### Similar Customer Response
```json
{
  "customer_id": 2,
  "name": "TechCorp Solutions", 
  "industry": "technology",
  "arr": 250000,
  "health_score": "at_risk",
  "similarity_score": 0.91,
  "shared_traits": ["Similar ARR range", "At-risk health score", "Technology sector"],
  "metadata": {
    "nps": 45,
    "usage_trend": "stable",
    "renewal_rate": 60.0
  }
}
```

### Meetings
```json
{
  "date": "2025-10-28",
  "summary": "Renewal discussion — positive sentiment",
  "sentiment": "positive"
}
```

### Customer Metrics
```json
{
  "nps": 72,
  "usage_trend": "up",
  "active_users": 120,
  "renewal_rate": 95,
  "seat_utilization": 85.5,
  "response_limit": 1000,
  "response_used": 750
}
```

## 🔌 API Endpoints

### Customers
- `GET /api/customers/` - List all customers
- `POST /api/customers/` - Create new customer
- `GET /api/customers/{id}/` - Get customer details
- `PUT /api/customers/{id}/` - Update customer
- `DELETE /api/customers/{id}/` - Delete customer
- `GET /api/customers/{id}/dashboard/` - Get comprehensive customer dashboard

### Feedback
- `GET /api/customers/feedback/` - List all feedback
- `POST /api/customers/feedback/` - Create feedback
- `GET /api/customers/{id}/feedback/` - Get customer-specific feedback
- `GET /api/customers/feedback/{id}/` - Get specific feedback
- `PUT /api/customers/feedback/{id}/` - Update feedback
- `DELETE /api/customers/feedback/{id}/` - Delete feedback

### Meetings
- `GET /api/customers/meetings/` - List all meetings
- `POST /api/customers/meetings/` - Create meeting
- `GET /api/customers/{id}/meetings/` - Get customer-specific meetings
- `GET /api/customers/meetings/{id}/` - Get specific meeting
- `PUT /api/customers/meetings/{id}/` - Update meeting
- `DELETE /api/customers/meetings/{id}/` - Delete meeting

### Analytics
- `GET /api/customers/health-summary/` - Get health score distribution

## 🎨 Features

### ✅ Implemented
- Customer data management
- Health score tracking
- Feedback management
- Meeting tracking
- Customer metrics (NPS, usage trends, etc.)
- REST API with filtering and search
- Admin interface
- Sample data loading

### 🚧 Coming Soon
- Industry benchmarking
- Automated health score calculation
- Integration with external tools (Salesforce, Gainsight)
- Real-time notifications
- Advanced analytics dashboard
- Customer churn prediction

## 🔧 Use Cases

1. **Consolidating Tools**: Single source of truth for customer data
2. **Health Score Monitoring**: Track customer health and identify at-risk accounts
3. **Feedback Management**: Centralized feedback tracking and resolution
4. **Meeting Analytics**: Track customer engagement and sentiment
5. **Renewal Management**: Monitor renewal dates and rates
6. **Industry Benchmarking**: Compare customers against industry standards

## 🧪 Testing the API

### AI-Powered Endpoints

**Find similar customers:**
```bash
curl http://127.0.0.1:8000/api/customers/1/similar/
```

**Find similar customers with filters:**
```bash
curl "http://127.0.0.1:8000/api/customers/1/similar/?industry=technology&limit=3&min_arr=100000"
```

**Sync customer to vector database:**
```bash
curl -X POST http://127.0.0.1:8000/api/customers/1/sync-vectors/
```

**Bulk sync all customers:**
```bash
curl -X POST http://127.0.0.1:8000/api/customers/bulk-sync-vectors/ \
  -H "Content-Type: application/json" \
  -d '{"batch_size": 50}'
```

### Traditional Endpoints

**Get all customers:**
```bash
curl http://127.0.0.1:8000/api/customers/
```

**Get customer dashboard:**
```bash
curl http://127.0.0.1:8000/api/customers/1/dashboard/
```

**Create feedback:**
```bash
curl -X POST http://127.0.0.1:8000/api/customers/1/feedback/ \
  -H "Content-Type: application/json" \
  -d '{"title": "New feature request", "status": "open"}'
```

### Testing AI Integration

**Test local functionality (no Pinecone required):**
```bash
python test_local_functionality.py
```

**Test full Pinecone integration:**
```bash
python test_pinecone_setup.py
```

**Demo working features:**
```bash
python demo_integration.py
```

### Using the Admin Interface

1. Go to `http://127.0.0.1:8000/admin/`
2. Login with your superuser credentials
3. Manage customers, feedback, meetings, and metrics

## 🛠️ Development

### Project Structure
```
backend/
├── customers/
│   ├── models.py          # Enhanced data models with metrics
│   ├── serializers.py     # API serializers
│   ├── views.py           # API views with AI endpoints
│   ├── vector_services.py # AI-powered similarity services
│   ├── tasks.py           # Celery async tasks for vectors
│   ├── signals.py         # Auto-sync when data changes
│   ├── urls.py            # URL routing
│   ├── admin.py           # Admin interface
│   └── management/
│       └── commands/
│           ├── load_sample_data.py
│           └── sync_vectors.py    # Vector management
├── analytics/             # Analytics app
├── csmpilot/
│   ├── settings.py        # Django settings with AI config
│   ├── pinecone_config.py # Pinecone vector database setup
│   ├── celery.py          # Async task configuration
│   └── urls.py            # Main URL routing
├── requirements.txt       # Dependencies including AI libraries
├── test_*.py             # AI integration tests
└── .env.example          # Environment template
```

### Management Commands

**Vector Database Operations:**
```bash
# Sync all customers to vector database
python manage.py sync_vectors

# Sync specific customer
python manage.py sync_vectors --customer-id 123

# Async sync (requires Celery worker)
python manage.py sync_vectors --async

# Custom batch size
python manage.py sync_vectors --batch-size 50
```

**Traditional Commands:**
```bash
# Load sample data
python manage.py load_sample_data

# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate
```

### Adding New Features

1. **Models**: Add new fields to `customers/models.py`
2. **Vector Integration**: Update `vector_services.py` for new fields
3. **API**: Update serializers and views
4. **Migrations**: Run `python manage.py makemigrations`
5. **Tests**: Add tests in `customers/tests.py`
6. **Vector Sync**: Run `python manage.py sync_vectors` to update vectors

## 📈 Features & Roadmap

### ✅ Completed Features
- **AI-Powered Customer Similarity**: Pinecone vector database integration
- **Intelligent Matching**: Multi-dimensional customer analysis
- **Real-time Vector Sync**: Automatic updates when data changes
- **Advanced API Endpoints**: Similarity search with filtering
- **Async Processing**: Celery tasks for background operations
- **Next.js Frontend**: Modern React-based user interface
- **Comprehensive Testing**: Local and integration test suites
- **Production Ready**: Error handling, logging, monitoring

### 🚀 Upcoming Features
- [ ] Enhanced ML models for churn prediction
- [ ] Real-time dashboards with AI insights
- [ ] Email notifications with smart recommendations
- [ ] Slack/Teams integration with AI summaries
- [ ] Advanced reporting with similarity analytics
- [ ] Mobile app with AI-powered insights
- [ ] Customer success playbook recommendations
- [ ] Automated health score predictions

### 🎯 AI Enhancement Roadmap
- [ ] Custom embedding models for industry-specific matching
- [ ] Advanced filtering with behavioral patterns
- [ ] Predictive analytics for customer success outcomes
- [ ] Natural language query interface for similarity search
- [ ] Integration with external data sources (CRM, support tools)
- [ ] Real-time customer journey mapping

## 🚀 Deployment

### Environment Variables
Create a `.env` file in the backend directory:

```bash
# Django Settings
DEBUG=True
SECRET_KEY=your-secret-key

# Pinecone AI Configuration
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=csm-pilot

# Redis for Async Tasks
REDIS_URL=redis://localhost:6379/0

# Optional: OpenAI for advanced features
OPENAI_API_KEY=your-openai-api-key
```

### Production Deployment

#### Docker (Recommended)
```bash
# Build and run with docker-compose
docker-compose up --build
```

#### Manual Deployment
```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export PINECONE_API_KEY=your-key

# Run migrations
python manage.py migrate

# Sync vectors
python manage.py sync_vectors

# Start services
python manage.py runserver &
celery -A csmpilot worker -l info &
```

### Development Notes

**macOS SSL Issues**: The integration works perfectly on Linux/Docker but may have SSL certificate issues on macOS during development. This is a known development environment issue and doesn't affect production deployments.

**For Production**: Deploy to any Linux server, Docker container, or cloud platform for full functionality.

## 🤝 Contributing

This is an advanced AI-powered CSM platform. Feel free to:
1. Fork the repository
2. Create a feature branch
3. Add new AI features or improve existing ones
4. Add comprehensive tests
5. Submit a pull request

### Development Guidelines
- Write tests for new AI features
- Update vector services when adding customer fields
- Follow Django best practices
- Document API endpoints
- Test on Linux for full AI functionality

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎉 Acknowledgments

Built for the hackathon with ❤️ by the CSM Copilot team!
