# CSM Pilot - Codebase Analysis & Architecture Overview

## 📋 Executive Summary

This document provides a comprehensive analysis of the CSM Pilot codebase, covering both backend (Django REST Framework) and frontend (Next.js/React) implementations. The project is a Customer Success Management platform with AI-powered features.

---

## Backend Architecture (Django)

### **Technology Stack**
- **Framework**: Django 5.2.8
- **API**: Django REST Framework 3.16.1
- **Database**: SQLite (development)
- **API Documentation**: drf-spectacular 0.29.0
- **CORS**: django-cors-headers 4.9.0
- **Python**: 3.13.3 (virtualenv)

### **Project Structure**

```
backend/
├── customers/          # Main customer management app
│   ├── models.py       # Customer, Feedback, Meeting, CustomerMetrics
│   ├── views.py        # ViewSets (CustomerViewSet, FeedbackViewSet, MeetingViewSet)
│   ├── serializers.py  # API serializers
│   ├── urls.py         # URL routing with DefaultRouter
│   ├── admin.py        # Django admin configuration
│   └── management/
│       └── commands/
│           └── load_sample_data.py
├── analytics/          # Analytics app (currently empty/placeholder)
│   ├── models.py       # Empty
│   ├── views.py        # Empty
│   └── urls.py         # Placeholder
└── csmpilot/           # Main Django project
    ├── settings.py     # Configuration
    └── urls.py         # Root URL routing
```

### **Data Models**

#### 1. **Customer Model**
- Fields: `name`, `industry`, `arr` (DecimalField), `health_score`, `renewal_date`, `last_updated`, `created_at`
- Health Score Choices: `healthy`, `at_risk`, `critical`
- Industry Choices: `education`, `technology`, `healthcare`, `finance`, `retail`, `manufacturing`, `other`
- Ordering: `-arr`, `name`

#### 2. **Feedback Model**
- Fields: `customer` (FK), `title`, `status`, `description`, `created_at`, `updated_at`
- Status Choices: `open`, `in_progress`, `resolved`, `closed`
- Related Name: `feedback`

#### 3. **Meeting Model**
- Fields: `customer` (FK), `date`, `summary`, `participants`, `sentiment`, `created_at`
- Related Name: `meetings`
- Ordering: `-date`

#### 4. **CustomerMetrics Model**
- Fields: `customer` (OneToOne), `nps`, `usage_trend`, `active_users`, `renewal_rate`, `seat_utilization`, `response_limit`, `response_used`, `updated_at`
- Usage Trend Choices: `up`, `down`, `stable`
- Property: `response_usage_percentage` (calculated)

### **API Endpoints**

#### **Customer Endpoints** (`/api/customers/`)
- `GET /api/customers/` - List customers (paginated, searchable, filterable)
- `POST /api/customers/` - Create customer
- `GET /api/customers/{id}/` - Get customer detail (full serializer)
- `PUT /api/customers/{id}/` - Update customer
- `PATCH /api/customers/{id}/` - Partial update
- `DELETE /api/customers/{id}/` - Delete customer
- `GET /api/customers/{id}/dashboard/` - Comprehensive dashboard
- `GET /api/customers/{id}/feedback/` - Get customer feedback
- `POST /api/customers/{id}/feedback/` - Create feedback
- `GET /api/customers/{id}/meetings/` - Get customer meetings
- `POST /api/customers/{id}/meetings/` - Create meeting
- `GET /api/customers/health-summary/` - Health score analytics
- `GET /api/customers/at-risk/` - At-risk customers
- `GET /api/customers/upcoming-renewals/` - Upcoming renewals (30 days)

#### **Feedback Endpoints** (`/api/customers/feedback/`)
- `GET /api/customers/feedback/` - List all feedback (filterable by customer)
- `POST /api/customers/feedback/` - Create feedback
- `GET /api/customers/feedback/{id}/` - Get feedback detail
- `PUT /api/customers/feedback/{id}/` - Update feedback
- `PATCH /api/customers/feedback/{id}/` - Partial update
- `DELETE /api/customers/feedback/{id}/` - Delete feedback

#### **Meeting Endpoints** (`/api/customers/meetings/`)
- `GET /api/customers/meetings/` - List all meetings (filterable by customer)
- `POST /api/customers/meetings/` - Create meeting
- `GET /api/customers/meetings/{id}/` - Get meeting detail
- `PUT /api/customers/meetings/{id}/` - Update meeting
- `PATCH /api/customers/meetings/{id}/` - Partial update
- `DELETE /api/customers/meetings/{id}/` - Delete meeting

#### **Analytics Endpoints** (`/api/analytics/`)
- Currently empty/placeholder

### **Serializers**

1. **CustomerSerializer** - Full customer with nested feedback, meetings, metrics
2. **CustomerListSerializer** - Lightweight for list views (no nested data)
3. **FeedbackSerializer** - Standard feedback fields
4. **MeetingSerializer** - Standard meeting fields
5. **CustomerMetricsSerializer** - Includes calculated `response_usage_percentage`

### **Features Implemented**
✅ Full CRUD operations for all models
✅ Pagination (20 items per page)
✅ Search filtering (name, industry)
✅ Ordering (ARR, renewal_date, health_score)
✅ Custom actions (dashboard, at-risk, upcoming renewals)
✅ Django admin interface
✅ Sample data loading command
✅ CORS configured for frontend
✅ API documentation setup (drf-spectacular)

### **Missing/Incomplete Features**
❌ Analytics app is empty (no models, views, or endpoints)
❌ Similar customers endpoint (referenced in frontend but not implemented)
❌ Profile summary endpoint (AI-generated, referenced in frontend)
❌ Authentication/Authorization (currently open)
❌ Automated health score calculation
❌ Industry benchmarking
❌ Real-time notifications
❌ Integration with external tools

---

## 🎨 Frontend Architecture (Next.js)

### **Technology Stack**
- **Framework**: Next.js 16.0.0
- **React**: 19.2.0
- **TypeScript**: 5.x
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives
- **Animations**: Framer Motion 12.23.24
- **Icons**: Lucide React

### **Project Structure**

```
frontend/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── page.tsx            # Homepage
│   │   ├── dashboard/          # Dashboard page
│   │   ├── account/[id]/      # Account detail page
│   │   │   └── similar/       # Similar customers page
│   │   └── login/              # Login page
│   ├── components/
│   │   ├── CustomerList.tsx
│   │   ├── CustomerDetailModal.tsx
│   │   ├── CustomerProfile.tsx
│   │   ├── SimilarCustomers.tsx
│   │   ├── PreMeetingBriefModal.tsx
│   │   └── ui/                 # Reusable UI components
│   ├── hooks/
│   │   └── useApi.ts           # Custom React hooks for API calls
│   ├── services/
│   │   └── apiService.ts       # API service with caching, retry logic
│   └── types/
│       └── globals.d.ts        # TypeScript type definitions
└── public/
    └── mockdata/               # Mock JSON data
```

### **Key Components**

#### 1. **API Service** (`apiService.ts`)
- **Features**:
  - Request caching (5-minute TTL)
  - Retry logic (5 attempts with exponential backoff)
  - Rate limiting queue
  - Request cancellation (AbortController)
  - Fallback data for offline scenarios
  - Error handling and transformation
  - Data transformation (backend → frontend format)

- **Methods**:
  - `getHealth()` - Health check
  - `getCustomers(page, perPage)` - Paginated customer list
  - `getCustomerDetail(id)` - Full customer details
  - `getSimilarCustomers(id)` - Similar customers (not implemented in backend)
  - `getProfileSummary(id)` - AI profile summary (not implemented in backend)

#### 2. **React Hooks** (`useApi.ts`)
- `useApi<T>()` - Generic API hook with loading/error states
- `useCustomers()` - Customer list hook
- `useCustomerDetail()` - Customer detail hook
- `useSimilarCustomers()` - Similar customers hook
- `useProfileSummary()` - Profile summary hook
- `useHealthCheck()` - Health check hook
- `usePaginatedData()` - Pagination support
- `useMultipleApi()` - Multiple API calls
- `useDebouncedApi()` - Debounced search

#### 3. **Pages**

**Homepage** (`page.tsx`)
- Landing page with feature highlights
- Navigation to login/dashboard

**Dashboard** (`dashboard/page.tsx`)
- Customer list with search
- Health score badges
- Sentiment indicators
- Card-based layout
- Pagination support

**Account Detail** (`account/[id]/page.tsx`)
- Full customer information
- Metrics display
- Activity timeline
- Feedback table
- AI action buttons (Generate Story, Prepare Meeting, Find Similar)
- Mock AI story generation

**Similar Customers** (`account/[id]/similar/page.tsx`)
- Not fully implemented (needs backend endpoint)

#### 4. **Components**

**CustomerList**
- Paginated customer list
- Search functionality
- Loading/error states
- Customer selection

**CustomerDetailModal**
- Tabbed interface (Overview, Profile, Insights, Activity)
- Profile summary integration
- Metrics display
- Activity timeline

**SimilarCustomers**
- Similar customer recommendations
- Score-based matching

### **Frontend Features**
✅ Responsive design (mobile-friendly)
✅ Loading states and error handling
✅ API integration with backend
✅ Data transformation (backend → frontend)
✅ Caching and performance optimization
✅ Retry logic for failed requests
✅ Fallback data for offline scenarios
✅ TypeScript type safety

### **Frontend Missing Features**
❌ Similar customers endpoint integration (backend missing)
❌ Profile summary endpoint integration (backend missing)
❌ Real AI story generation (currently mocked)
❌ Authentication flow
❌ Real-time updates
❌ Advanced filtering/sorting UI
❌ Export functionality

---

## 🔗 Integration Points

### **Working Integrations**
✅ Customer list (`GET /api/customers/`)
✅ Customer detail (`GET /api/customers/{id}/`)
✅ Customer dashboard (`GET /api/customers/{id}/dashboard/`)
✅ Feedback display (nested in customer detail)
✅ Meetings display (nested in customer detail)
✅ Metrics display (nested in customer detail)

### **Missing Backend Endpoints** (Referenced in Frontend)
❌ `GET /similar_customers/{id}` - Similar customers
❌ `GET /profile_summary/{id}` - AI-generated profile summary

### **API Configuration**
- Base URL: `http://localhost:8000` (configurable via `NEXT_PUBLIC_API_BASE_URL`)
- CORS: Configured for `localhost:3000` and `localhost:8080`
- Timeout: 30 seconds
- Retry attempts: 5
- Cache TTL: 5 minutes

---

## 📊 Data Flow

### **Customer List Flow**
1. Frontend calls `useCustomers(page, perPage)`
2. Hook calls `apiService.getCustomers(page, perPage)`
3. Service makes `GET /api/customers/?page={page}&page_size={perPage}`
4. Backend returns paginated `CustomerListSerializer` data
5. Service transforms backend format → frontend format
6. Data cached and returned to component
7. Component renders customer cards

### **Customer Detail Flow**
1. Frontend calls `useCustomerDetail(id)`
2. Hook calls `apiService.getCustomerDetail(id)`
3. Service makes `GET /api/customers/{id}/`
4. Backend returns `CustomerSerializer` with nested data
5. Service transforms to `CustomerDetail` format
6. Data cached and returned
7. Component renders full customer view

---

## 🚀 Ready for Development

### **Backend Ready For**
- Adding new Django apps/modules
- Implementing analytics endpoints
- Adding similar customers algorithm
- Implementing AI profile summary endpoint
- Adding authentication/authorization
- Database migrations
- New models and relationships
- Custom business logic

### **Frontend Ready For**
- New API integrations
- Additional pages/components
- Enhanced UI features
- Real-time updates
- Advanced filtering
- Export/import functionality

---

## 🎯 Recommended Next Steps

### **High Priority**
1. **Implement Similar Customers Endpoint**
   - Backend: Algorithm to find similar customers based on industry, ARR, health score
   - Frontend: Already has component, needs endpoint integration

2. **Implement Profile Summary Endpoint**
   - Backend: AI service integration (OpenAI/Anthropic) to generate summaries
   - Frontend: Already has component, needs endpoint integration

3. **Complete Analytics App**
   - Add models for analytics data
   - Implement analytics endpoints
   - Add dashboard metrics

### **Medium Priority**
4. **Authentication System**
   - JWT or session-based auth
   - User management
   - Role-based access control

5. **Automated Health Score Calculation**
   - Algorithm based on metrics, feedback, meetings
   - Scheduled tasks for recalculation

6. **Industry Benchmarking**
   - Industry-specific metrics
   - Comparison endpoints

### **Low Priority**
7. **Real-time Notifications**
   - WebSocket support
   - Push notifications

8. **External Integrations**
   - Salesforce integration
   - Gainsight integration
   - Email/Slack notifications

---

## 📝 Notes

- Backend uses SQLite for development (easy to migrate to PostgreSQL)
- Frontend uses mock data fallbacks for resilience
- API documentation available at `/api/docs/` (when enabled)
- Sample data can be loaded via `python manage.py load_sample_data`
- CORS configured for local development
- No authentication currently (development mode)

---

## 🔧 Development Commands

### Backend
```bash
cd backend
source venv/bin/activate
python manage.py runserver
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py load_sample_data
```

### Frontend
```bash
cd frontend
npm install
npm run dev
npm run build
npm start
```

---

**Last Updated**: 2025-01-XX
**Status**: Ready for feature development
**Architecture**: Well-structured, scalable, ready for expansion

