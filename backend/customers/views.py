from rest_framework import generics, filters, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Q
from .models import Customer, Feedback, Meeting, CustomerMetrics
from .serializers import (
    CustomerSerializer, 
    CustomerListSerializer, 
    FeedbackSerializer, 
    MeetingSerializer,
    CustomerMetricsSerializer
)


class CustomerListCreateView(generics.ListCreateAPIView):
    queryset = Customer.objects.all()
    serializer_class = CustomerListSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'industry']
    ordering_fields = ['name', 'arr', 'renewal_date', 'health_score']
    ordering = ['-arr']
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return CustomerListSerializer
        return CustomerSerializer


class CustomerDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer


class FeedbackListCreateView(generics.ListCreateAPIView):
    serializer_class = FeedbackSerializer
    filter_backends = [filters.OrderingFilter]
    ordering = ['-created_at']
    
    def get_queryset(self):
        customer_id = self.kwargs.get('customer_id')
        if customer_id:
            return Feedback.objects.filter(customer_id=customer_id)
        return Feedback.objects.all()
    
    def perform_create(self, serializer):
        customer_id = self.kwargs.get('customer_id')
        if customer_id:
            serializer.save(customer_id=customer_id)
        else:
            serializer.save()


class FeedbackDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer


class MeetingListCreateView(generics.ListCreateAPIView):
    serializer_class = MeetingSerializer
    filter_backends = [filters.OrderingFilter]
    ordering = ['-date']
    
    def get_queryset(self):
        customer_id = self.kwargs.get('customer_id')
        if customer_id:
            return Meeting.objects.filter(customer_id=customer_id)
        return Meeting.objects.all()
    
    def perform_create(self, serializer):
        customer_id = self.kwargs.get('customer_id')
        if customer_id:
            serializer.save(customer_id=customer_id)
        else:
            serializer.save()


class MeetingDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Meeting.objects.all()
    serializer_class = MeetingSerializer


@api_view(['GET'])
def customer_dashboard(request, customer_id):
    """
    Get comprehensive customer dashboard data
    """
    try:
        customer = Customer.objects.get(id=customer_id)
        serializer = CustomerSerializer(customer)
        return Response(serializer.data)
    except Customer.DoesNotExist:
        return Response(
            {'error': 'Customer not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
def health_score_summary(request):
    """
    Get summary of customer health scores
    """
    from django.db.models import Count
    
    health_summary = Customer.objects.values('health_score').annotate(
        count=Count('health_score')
    ).order_by('health_score')
    
    return Response(health_summary)
