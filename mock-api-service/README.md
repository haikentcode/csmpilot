# External Mock API Service

This is an **EXTERNAL** mock API service that Django/Celery polls, just like it would poll real Salesforce.

## 🎯 Purpose

- **External Service**: Separate from Django (like real Salesforce would be)
- **Controllable**: Edit JSON files to change mock data
- **Realistic**: Mimics real Salesforce API structure
- **Scalable**: Easy to add Gainsight, HubSpot, etc.

## 🚀 Quick Start

```bash
cd mock-api-service
npm install
npm start
```

Service runs on: `http://localhost:3001`

## 📝 Controlling Mock Data

Edit `data/salesforce-opportunities.json` to change the mock responses.

**No code changes needed!** Just edit JSON and restart the service.

## 🔌 Endpoints

- `GET /health` - Health check
- `GET /info` - API information
- `GET /mock-apis/salesforce/services/data/v58.0/sobjects/Opportunity` - List all opportunities
- `GET /mock-apis/salesforce/services/data/v58.0/sobjects/Opportunity/:id` - Get single opportunity
- `GET /mock-apis/salesforce/services/data/v58.0/query?q=SELECT...` - SOQL query

## 🔄 How Django Uses It

Django/Celery polls this service periodically:
```
Celery Beat → Celery Worker → Sync Service → HTTP GET → This Mock API Service
```

Just like it would poll real Salesforce!

