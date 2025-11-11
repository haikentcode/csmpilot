from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count
from .models import Customer, Feedback, Meeting, CustomerMetrics
from .serializers import (
    CustomerSerializer, 
    CustomerListSerializer, 
    FeedbackSerializer, 
    MeetingSerializer,
    CustomerMetricsSerializer
)


class CustomerViewSet(viewsets.ModelViewSet):
    """
    A ViewSet for managing customers in the CSM Copilot platform.
    
    This ViewSet provides complete CRUD operations for customers along with
    specialized actions for customer success management.
    
    ## Standard Operations:
    - `GET /customers/` - List all customers with filtering and search
    - `POST /customers/` - Create a new customer  
    - `GET /customers/{id}/` - Retrieve customer details with full data
    - `PUT /customers/{id}/` - Update customer completely
    - `PATCH /customers/{id}/` - Partial customer update
    - `DELETE /customers/{id}/` - Delete customer
    
    ## Custom Actions:
    - `GET /customers/{id}/dashboard/` - Get comprehensive customer dashboard
    - `GET /customers/{id}/feedback/` - Get customer's feedback
    - `POST /customers/{id}/feedback/` - Create feedback for customer  
    - `GET /customers/{id}/meetings/` - Get customer's meetings
    - `POST /customers/{id}/meetings/` - Create meeting for customer
    - `GET /customers/health-summary/` - Get health score analytics
    - `GET /customers/at-risk/` - Get customers at risk of churning
    - `GET /customers/upcoming-renewals/` - Get customers with upcoming renewals
    
    ## Filtering & Search:
    - Search: `?search=company_name` - Search by name or industry
    - Ordering: `?ordering=-arr` - Order by ARR, renewal_date, etc.
    """
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'industry']
    ordering_fields = ['name', 'arr', 'renewal_date', 'health_score']
    ordering = ['-arr']
    
    def get_serializer_class(self):
        """Use different serializers for list vs detail views"""
        if self.action == 'list':
            return CustomerListSerializer
        return CustomerSerializer
    
    @action(detail=True, methods=['get'])
    def dashboard(self, request, pk=None):
        """
        Get comprehensive customer dashboard with all related data.
        
        Returns complete customer information including:
        - Customer basic info (name, industry, ARR, health score)
        - All customer feedback with status
        - Recent meetings with sentiment analysis
        - Key metrics (NPS, usage trends, renewal rates)
        
        **URL:** `GET /api/customers/{id}/dashboard/`
        
        **Response Example:**
        ```json
        {
            "id": 1,
            "name": "Emeritus Institute of Management",
            "industry": "education",
            "arr": "150000.00",
            "health_score": "healthy",
            "feedback": [...],
            "meetings": [...],
            "metrics": {...}
        }
        ```
        """
        customer = self.get_object()
        serializer = CustomerSerializer(customer)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get', 'post'])
    def feedback(self, request, pk=None):
        """
        Manage feedback for a specific customer.
        
        **GET** - Retrieve all feedback for the customer
        **POST** - Create new feedback for the customer
        
        **URLs:**
        - `GET /api/customers/{id}/feedback/` - List customer feedback
        - `POST /api/customers/{id}/feedback/` - Create customer feedback
        
        **POST Body Example:**
        ```json
        {
            "title": "Feature request: advanced reporting",
            "status": "open",
            "description": "Customer needs more detailed analytics"
        }
        ```
        
        **Response:** Array of feedback objects with id, title, status, description
        """
        customer = self.get_object()
        
        if request.method == 'GET':
            feedback = customer.feedback.all()
            serializer = FeedbackSerializer(feedback, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            serializer = FeedbackSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(customer=customer)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get', 'post'])
    def meetings(self, request, pk=None):
        """
        Get or create meetings for a specific customer
        GET /api/customers/{id}/meetings/
        POST /api/customers/{id}/meetings/
        """
        customer = self.get_object()
        
        if request.method == 'GET':
            meetings = customer.meetings.all()
            serializer = MeetingSerializer(meetings, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            serializer = MeetingSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(customer=customer)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def health_summary(self, request):
        """
        Get summary of customer health scores
        GET /api/customers/health-summary/
        """
        health_summary = Customer.objects.values('health_score').annotate(
            count=Count('health_score')
        ).order_by('health_score')
        
        return Response(health_summary)
    
    @action(detail=False, methods=['get'])
    def at_risk(self, request):
        """
        Get customers at risk of churning.
        
        Returns customers with health_score of 'at_risk' or 'critical',
        ordered by renewal date (soonest first) to prioritize action.
        
        **URL:** `GET /api/customers/at-risk/`
        
        **Use Case:** Daily standup review, account manager alerts
        
        **Response:** Array of customers with basic info (excludes full details for performance)
        """
        at_risk_customers = Customer.objects.filter(
            health_score__in=['at_risk', 'critical']
        ).order_by('renewal_date')
        
        serializer = CustomerListSerializer(at_risk_customers, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def upcoming_renewals(self, request):
        """
        Get customers with upcoming renewals (next 30 days)
        GET /api/customers/upcoming-renewals/
        """
        from datetime import date, timedelta
        
        thirty_days_from_now = date.today() + timedelta(days=30)
        upcoming_renewals = Customer.objects.filter(
            renewal_date__lte=thirty_days_from_now,
            renewal_date__gte=date.today()
        ).order_by('renewal_date')
        
        serializer = CustomerListSerializer(upcoming_renewals, many=True)
        return Response(serializer.data)


class FeedbackViewSet(viewsets.ModelViewSet):
    """
    A ViewSet for managing customer feedback across all customers.
    
    Provides full CRUD operations for feedback with filtering capabilities.
    
    ## Operations:
    - `GET /feedback/` - List all feedback (with optional customer filter)
    - `POST /feedback/` - Create new feedback
    - `GET /feedback/{id}/` - Get specific feedback details
    - `PUT /feedback/{id}/` - Update feedback completely  
    - `PATCH /feedback/{id}/` - Partial feedback update
    - `DELETE /feedback/{id}/` - Delete feedback
    
    ## Filtering:
    - `?customer=1` - Filter feedback by customer ID
    - `?ordering=-created_at` - Order by creation date (newest first)
    
    ## Use Cases:
    - Support team reviewing all open issues
    - Product team analyzing feature requests
    - Account managers tracking customer feedback trends
    """
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    filter_backends = [filters.OrderingFilter]
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter by customer if provided in query params"""
        queryset = Feedback.objects.all()
        customer_id = self.request.query_params.get('customer', None)
        if customer_id is not None:
            queryset = queryset.filter(customer_id=customer_id)
        return queryset


class MeetingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing customer meetings
    """
    queryset = Meeting.objects.all()
    serializer_class = MeetingSerializer
    filter_backends = [filters.OrderingFilter]
    ordering = ['-date']
    
    def get_queryset(self):
        """Filter by customer if provided in query params"""
        queryset = Meeting.objects.all()
        customer_id = self.request.query_params.get('customer', None)
        if customer_id is not None:
            queryset = queryset.filter(customer_id=customer_id)
        return queryset
