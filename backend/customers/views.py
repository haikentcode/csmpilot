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
from .product_service import get_use_cases_for_customer, get_upsell_opportunities
from .ai_use_cases_service import get_ai_filtered_use_cases


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
    
    @action(detail=True, methods=['get'])
    def use_cases(self, request, pk=None):
        """
        Get relevant use cases for a customer based on their products.
        
        Uses the product catalog to find use cases that match the customer's
        current products and industry.
        
        **URL:** `GET /api/customers/{id}/use-cases/`
        
        **Query Parameters:**
        - industry (str): Override customer's industry for filtering (optional)
        
        **Response Example:**
        ```json
        {
            "customer_id": 1,
            "customer_name": "Acme Corp",
            "customer_products": ["SurveyMonkey Enterprise", "GetFeedback Digital"],
            "use_cases": [
                {
                    "product_name": "SurveyMonkey Enterprise (SME)",
                    "product_category": "Survey & Feedback Platform",
                    "use_case": "A hospital system runs patient and staff feedback programs securely.",
                    "primary_use": "Collect, analyze, and act on feedback securely...",
                    "key_features": ["Centralized admin & governance", ...]
                }
            ]
        }
        ```
        """
        customer = self.get_object()
        
        # Get customer products
        customer_products = customer.products or []
        industry = request.query_params.get('industry') or customer.industry
        use_ai = request.query_params.get('use_ai', 'true').lower() == 'true'
        
        try:
            if use_ai:
                # Use AI-powered filtering for intelligent use case selection
                use_cases = get_ai_filtered_use_cases(
                    customer_products=customer_products,
                    industry=industry,
                    customer_name=customer.name,
                    arr=float(customer.arr) if customer.arr else None
                )
            else:
                # Fallback to basic product catalog matching
                use_cases = get_use_cases_for_customer(
                    customer_products=customer_products,
                    industry=industry
                )
            
            return Response({
                'customer_id': customer.id,
                'customer_name': customer.name,
                'customer_products': customer_products,
                'industry': industry,
                'use_cases': use_cases,
                'total_use_cases': len(use_cases),
                'ai_filtered': use_ai
            })
            
        except Exception as e:
            return Response({
                'error': f'Error fetching use cases: {str(e)}',
                'use_cases': []
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def upsell_opportunities(self, request, pk=None):
        """
        Get upsell opportunities for a customer based on:
        - Products they already have (upsell opportunities from product catalog)
        - Similar customers (using vector similarity search)
        - Industry and ARR matching
        
        **URL:** `GET /api/customers/{id}/upsell-opportunities/`
        
        **Query Parameters:**
        - limit (int): Number of similar customers to consider (default: 10)
        - include_similar (bool): Include recommendations from similar customers (default: true)
        
        **Response Example:**
        ```json
        {
            "customer_id": 1,
            "customer_name": "Acme Corp",
            "current_products": ["SurveyMonkey Enterprise"],
            "opportunities": [
                {
                    "product_name": "GetFeedback Direct",
                    "category": "Customer Experience (CX) Feedback Platform",
                    "description": "Transactional feedback tool...",
                    "reason": "Used by 5 similar customer(s)",
                    "reason_type": "similar_customers",
                    "key_features": [...],
                    "similarity_score": 5
                }
            ]
        }
        ```
        """
        customer = self.get_object()
        
        # Get query parameters
        limit = int(request.query_params.get('limit', 10))
        include_similar = request.query_params.get('include_similar', 'true').lower() == 'true'
        
        customer_products = customer.products or []
        similar_customers_products = None
        
        # Get similar customers' products if requested
        if include_similar:
            try:
                vector_service = get_customer_vector_service()
                similar_customers = vector_service.find_similar_customers(
                    customer=customer,
                    top_k=limit,
                    filter_criteria={}
                )
                
                # Extract products from similar customers
                similar_customers_products = []
                for similar in similar_customers:
                    similar_customer_id = similar.get('customer_id')
                    if similar_customer_id:
                        try:
                            similar_customer = Customer.objects.get(id=similar_customer_id)
                            if similar_customer.products:
                                similar_customers_products.append(similar_customer.products)
                        except Customer.DoesNotExist:
                            continue
                            
            except Exception as e:
                # If vector search fails, continue without similar customers
                print(f"Warning: Could not fetch similar customers for upsell: {e}")
        
        try:
            # Calculate ARR range for filtering (within 50% of customer ARR)
            arr_value = float(customer.arr)
            arr_range = (arr_value * 0.5, arr_value * 1.5)
            
            opportunities = get_upsell_opportunities(
                customer_products=customer_products,
                similar_customers_products=similar_customers_products,
                industry=customer.industry,
                arr_range=arr_range
            )
            
            return Response({
                'customer_id': customer.id,
                'customer_name': customer.name,
                'current_products': customer_products,
                'industry': customer.industry,
                'arr': str(customer.arr),
                'opportunities': opportunities,
                'total_opportunities': len(opportunities)
            })
            
        except Exception as e:
            return Response({
                'error': f'Error fetching upsell opportunities: {str(e)}',
                'opportunities': []
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], url_path='chat-context')
    def get_chat_context(self, request):
        """
        Retrieve relevant customer data for RAG-based chat.
        
        POST /api/customers/chat-context/
        
        Request Body:
        {
            "query": "What is UBER's health score?",
            "customer_id": 14,  // optional, if in customer context
            "conversation_history": []  // optional
        }
        
        Response:
        {
            "context": {
                "customers": [...],
                "meetings": [...],
                "opportunities": [...],
                "use_cases": [...],
                "similar_customers": [...]
            },
            "relevant_customer_ids": [14, 15, 16],
            "query_intent": "health_check"
        }
        """
        query = request.data.get('query', '')
        customer_id = request.data.get('customer_id', None)
        
        if not query:
            return Response({
                'error': 'Query is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Detect query intent
            query_intent = self._detect_query_intent(query)
            print(f"[RAG] Query intent detected: {query_intent}")
            
            # Extract customer references from query
            mentioned_customers = self._extract_customer_references(query, customer_id)
            print(f"[RAG] Mentioned customers: {[c.name for c in mentioned_customers]}")
            
            # Build context based on intent
            context = {
                'customers': [],
                'meetings': [],
                'opportunities': [],
                'use_cases': [],
                'similar_customers': []
            }
            
            relevant_customer_ids = []
            
            # If specific customers mentioned or context provided
            if mentioned_customers:
                for customer in mentioned_customers:
                    relevant_customer_ids.append(customer.id)
                    
                    # Add customer data
                    customer_data = CustomerListSerializer(customer).data
                    context['customers'].append(customer_data)
                    
                    # Fetch additional data based on intent
                    if query_intent in ['meeting_summary', 'general']:
                        # Fetch recent Gong meetings
                        from gong.models import GongMeeting
                        meetings = GongMeeting.objects.filter(
                            company=customer
                        ).order_by('-meeting_date')[:5]
                        
                        meeting_data = []
                        for meeting in meetings:
                            # Calculate insights count from ai_insights
                            insights_count = 0
                            if meeting.ai_insights and isinstance(meeting.ai_insights, dict):
                                insights = meeting.ai_insights.get('insights', [])
                                if isinstance(insights, list):
                                    insights_count = len(insights)
                            
                            meeting_data.append({
                                'id': meeting.id,
                                'meeting_title': meeting.meeting_title,
                                'meeting_date': meeting.meeting_date.isoformat(),
                                'overall_sentiment': meeting.overall_sentiment,
                                'key_topics': meeting.key_topics if meeting.key_topics else [],
                                'insights_count': insights_count,
                                'meeting_summary': meeting.meeting_summary if meeting.meeting_summary else ''
                            })
                        context['meetings'].extend(meeting_data)
                    
                    if query_intent in ['upsell_opportunities', 'general']:
                        # Fetch upsell opportunities
                        try:
                            customer_products = customer.products if customer.products else []
                            similar_customers_products = []
                            
                            # Get similar customers for product recommendations
                            vector_service = get_customer_vector_service()
                            if vector_service:
                                similar_results = vector_service.find_similar_customers(
                                    customer.id, 
                                    top_k=5
                                )
                                if similar_results:
                                    similar_ids = [r['customer_id'] for r in similar_results]
                                    similar_customers = Customer.objects.filter(id__in=similar_ids)
                                    for sim_customer in similar_customers:
                                        if sim_customer.products:
                                            similar_customers_products.extend(sim_customer.products)
                            
                            arr_value = float(customer.arr)
                            arr_range = (arr_value * 0.5, arr_value * 1.5)
                            
                            opportunities = get_upsell_opportunities(
                                customer_products=customer_products,
                                similar_customers_products=similar_customers_products,
                                industry=customer.industry,
                                arr_range=arr_range
                            )
                            context['opportunities'].extend(opportunities[:5])
                        except Exception as e:
                            print(f"Error fetching opportunities for chat context: {e}")
                    
                    if query_intent in ['use_cases', 'general']:
                        # Fetch use cases
                        try:
                            customer_products = customer.products if customer.products else []
                            use_cases_data = get_use_cases_for_customer(
                                customer_products=customer_products,
                                industry=customer.industry
                            )
                            context['use_cases'].extend(use_cases_data[:5])
                        except Exception as e:
                            print(f"Error fetching use cases for chat context: {e}")
                    
                    if query_intent in ['similar_customers', 'general']:
                        # Fetch similar customers
                        try:
                            vector_service = get_customer_vector_service()
                            if vector_service:
                                similar_results = vector_service.find_similar_customers(
                                    customer.id,
                                    top_k=5
                                )
                                if similar_results:
                                    similar_ids = [r['customer_id'] for r in similar_results]
                                    similar_customers = Customer.objects.filter(id__in=similar_ids)
                                    
                                    for idx, sim_customer in enumerate(similar_customers):
                                        similarity_score = similar_results[idx].get('score', 0)
                                        context['similar_customers'].append({
                                            'customer_id': sim_customer.id,
                                            'name': sim_customer.name,
                                            'industry': sim_customer.industry,
                                            'arr': float(sim_customer.arr),
                                            'health_score': sim_customer.health_score,
                                            'similarity_score': similarity_score
                                        })
                        except Exception as e:
                            print(f"Error fetching similar customers for chat context: {e}")
            
            # If no specific customers mentioned, provide general data based on intent
            elif query_intent == 'health_check':
                # Get at-risk customers
                at_risk_customers = Customer.objects.filter(
                    health_score__in=['at_risk', 'critical']
                ).order_by('-arr')[:5]
                
                for customer in at_risk_customers:
                    relevant_customer_ids.append(customer.id)
                    customer_data = CustomerListSerializer(customer).data
                    context['customers'].append(customer_data)
            
            return Response({
                'context': context,
                'relevant_customer_ids': relevant_customer_ids,
                'query_intent': query_intent
            })
            
        except Exception as e:
            import traceback
            print(f"[RAG ERROR] Exception occurred: {str(e)}")
            print(f"[RAG ERROR] Traceback: {traceback.format_exc()}")
            return Response({
                'error': f'Error building chat context: {str(e)}',
                'context': {
                    'customers': [],
                    'meetings': [],
                    'opportunities': [],
                    'use_cases': [],
                    'similar_customers': []
                },
                'relevant_customer_ids': [],
                'query_intent': 'general'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _detect_query_intent(self, query: str) -> str:
        """Detect what the user is asking about."""
        query_lower = query.lower()
        
        if any(word in query_lower for word in ['health', 'score', 'risk', 'churn']):
            return 'health_check'
        elif any(word in query_lower for word in ['meeting', 'call', 'discussion', 'talked', 'spoke']):
            return 'meeting_summary'
        elif any(word in query_lower for word in ['upsell', 'opportunity', 'expand', 'upgrade', 'product']):
            return 'upsell_opportunities'
        elif any(word in query_lower for word in ['similar', 'like', 'compare']):
            return 'similar_customers'
        elif any(word in query_lower for word in ['use case', 'usage', 'how they use', 'using']):
            return 'use_cases'
        else:
            return 'general'
    
    def _extract_customer_references(self, query: str, context_customer_id: int = None):
        """Extract customer names or IDs from query."""
        import re
        mentioned_customers = []
        
        # If context customer ID provided, use it
        if context_customer_id:
            try:
                customer = Customer.objects.get(id=context_customer_id)
                mentioned_customers.append(customer)
            except Customer.DoesNotExist:
                pass
        
        # Check for explicit IDs in query
        id_matches = re.findall(r'\b(?:customer|id|#)\s*(\d+)\b', query, re.IGNORECASE)
        if id_matches:
            customer_ids = [int(id) for id in id_matches]
            found_customers = Customer.objects.filter(id__in=customer_ids)
            mentioned_customers.extend(found_customers)
        
        # Check for customer names (case-insensitive)
        all_customers = Customer.objects.all()
        for customer in all_customers:
            if customer.name.lower() in query.lower():
                if customer not in mentioned_customers:
                    mentioned_customers.append(customer)
        
        return mentioned_customers


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
