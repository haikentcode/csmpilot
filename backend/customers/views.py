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
from .vector_services import get_customer_vector_service
from .tasks import add_customer_to_vectors, update_customer_vectors, bulk_populate_vectors


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
    
    @action(detail=True, methods=['get'])
    def similar(self, request, pk=None):
        """
        Find customers similar to the current customer using vector similarity
        GET /api/customers/{id}/similar/
        
        Query Parameters:
        - limit (int): Number of similar customers to return (default: 10, max: 50)
        - industry (str): Filter by specific industry
        - health_score (str): Filter by health score (healthy, at_risk, critical)
        - min_arr (float): Minimum ARR filter
        - max_arr (float): Maximum ARR filter
        
        Response: Array of similar customers with similarity scores
        """
        customer = self.get_object()
        
        # Get query parameters
        limit = min(int(request.query_params.get('limit', 10)), 50)
        industry_filter = request.query_params.get('industry')
        health_filter = request.query_params.get('health_score')
        min_arr = request.query_params.get('min_arr')
        max_arr = request.query_params.get('max_arr')
        
        # Build filter criteria
        filter_criteria = {}
        if industry_filter:
            filter_criteria['industry'] = industry_filter
        if health_filter:
            filter_criteria['health_score'] = health_filter
        if min_arr:
            filter_criteria['arr'] = {'$gte': float(min_arr)}
        if max_arr:
            if 'arr' in filter_criteria:
                filter_criteria['arr']['$lte'] = float(max_arr)
            else:
                filter_criteria['arr'] = {'$lte': float(max_arr)}
        
        try:
            vector_service = get_customer_vector_service()
            similar_customers = vector_service.find_similar_customers(
                customer=customer,
                top_k=limit,
                filter_criteria=filter_criteria
            )
            
            return Response({
                'customer_id': customer.id,
                'customer_name': customer.name,
                'similar_customers': similar_customers,
                'total_found': len(similar_customers)
            })
            
        except Exception as e:
            return Response({
                'error': f'Error finding similar customers: {str(e)}',
                'similar_customers': []
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def sync_vectors(self, request, pk=None):
        """
        Sync customer data to vector database (async operation)
        POST /api/customers/{id}/sync-vectors/
        
        Response: Task ID for monitoring the sync operation
        """
        customer = self.get_object()
        
        try:
            # Queue async task
            task = add_customer_to_vectors.delay(customer.id)
            
            return Response({
                'message': f'Customer {customer.name} queued for vector sync',
                'task_id': task.id,
                'customer_id': customer.id
            }, status=status.HTTP_202_ACCEPTED)
            
        except Exception as e:
            return Response({
                'error': f'Error queuing vector sync: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def bulk_sync_vectors(self, request):
        """
        Sync all customers to vector database (async operation)
        POST /api/customers/bulk-sync-vectors/
        
        Request Body (optional):
        {
            "batch_size": 100
        }
        
        Response: Task ID for monitoring the bulk sync operation
        """
        batch_size = request.data.get('batch_size', 100)
        
        try:
            # Queue async task
            task = bulk_populate_vectors.delay(batch_size=batch_size)
            
            return Response({
                'message': 'Bulk vector sync initiated',
                'task_id': task.id,
                'batch_size': batch_size
            }, status=status.HTTP_202_ACCEPTED)
            
        except Exception as e:
            return Response({
                'error': f'Error initiating bulk vector sync: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
