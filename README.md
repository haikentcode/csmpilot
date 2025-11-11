# CSM Copilot 🚀

A Customer Success Management (CSM) platform that consolidates customer data, tracks health scores, and provides actionable insights for customer success teams.

## 🎯 Project Overview

CSM Copilot is designed to solve the challenge of scattered customer success tools by providing a unified platform that:

- **Consolidates customer data** from multiple sources
- **Tracks customer health scores** with dynamic insights
- **Manages feedback and meetings** in one place
- **Provides industry benchmarking** and analytics
- **Identifies up-sell and cross-sell opportunities**

## 🏗️ Architecture

```
csmpilot/
├── backend/          # Django REST API
│   ├── customers/    # Customer management app
│   ├── analytics/    # Analytics and reporting app
│   └── csmpilot/     # Main Django project
├── frontend/         # React frontend (coming soon)
└── docs/            # Documentation
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- pyenv (recommended)
- Node.js 16+ (for frontend)

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

7. **Run development server**
   ```bash
   python manage.py runserver
   ```

The API will be available at `http://127.0.0.1:8000/`

## 📊 Data Models

### Customer
```json
{
  "id": 1,
  "name": "Emeritus Institute of Management",
  "industry": "Education",
  "arr": 150000,
  "health_score": "Healthy",
  "renewal_date": "2025-12-15",
  "last_updated": "2025-11-09"
}
```

### Feedback
```json
{
  "id": 1,
  "title": "Feature request: advanced reporting",
  "status": "Open",
  "description": "Customer requested more detailed reporting capabilities"
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

### Using curl

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

### Using the Admin Interface

1. Go to `http://127.0.0.1:8000/admin/`
2. Login with your superuser credentials
3. Manage customers, feedback, meetings, and metrics

## 🛠️ Development

### Project Structure
```
backend/
├── customers/
│   ├── models.py          # Data models
│   ├── serializers.py     # API serializers
│   ├── views.py           # API views
│   ├── urls.py            # URL routing
│   ├── admin.py           # Admin interface
│   └── management/
│       └── commands/
│           └── load_sample_data.py
├── analytics/             # Analytics app
├── csmpilot/
│   ├── settings.py        # Django settings
│   └── urls.py            # Main URL routing
└── requirements.txt       # Python dependencies
```

### Adding New Features

1. **Models**: Add new fields to `customers/models.py`
2. **API**: Update serializers and views
3. **Migrations**: Run `python manage.py makemigrations`
4. **Tests**: Add tests in `customers/tests.py`

## 📈 Roadmap

- [ ] Frontend React application
- [ ] Real-time dashboards
- [ ] Email notifications
- [ ] Slack/Teams integration
- [ ] Advanced reporting
- [ ] Mobile app
- [ ] ML-powered insights

## 🤝 Contributing

This is a hackathon project. Feel free to:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎉 Acknowledgments

Built for the hackathon with ❤️ by the CSM Copilot team!
