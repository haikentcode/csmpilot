from rest_framework import serializers
from .models import Customer, Feedback, Meeting, CustomerMetrics


class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['id', 'title', 'status', 'description', 'created_at', 'updated_at']


class MeetingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Meeting
        fields = ['id', 'date', 'summary', 'participants', 'sentiment', 'created_at']


class CustomerMetricsSerializer(serializers.ModelSerializer):
    response_usage_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = CustomerMetrics
        fields = [
            'nps', 'usage_trend', 'active_users', 'renewal_rate',
            'seat_utilization', 'response_limit', 'response_used',
            'response_usage_percentage', 'updated_at'
        ]


class CustomerSerializer(serializers.ModelSerializer):
    feedback = FeedbackSerializer(many=True, read_only=True)
    meetings = MeetingSerializer(many=True, read_only=True)
    metrics = CustomerMetricsSerializer(read_only=True)
    
    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'industry', 'arr', 'health_score', 
            'renewal_date', 'last_updated', 'created_at',
            'products', 'feedback', 'meetings', 'metrics'
        ]


class CustomerListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for customer lists"""
    
    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'industry', 'arr', 'health_score', 
            'renewal_date', 'last_updated', 'products'
        ]