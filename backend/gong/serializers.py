from rest_framework import serializers
from .models import GongMeeting
from customers.serializers import CustomerSerializer


class GongMeetingSerializer(serializers.ModelSerializer):
    """Serializer for GongMeeting model"""
    
    company_name = serializers.CharField(source='company.name', read_only=True)
    company_id = serializers.IntegerField(source='company.id', read_only=True)
    has_insights = serializers.BooleanField(read_only=True)
    insights_categories = serializers.SerializerMethodField()
    
    class Meta:
        model = GongMeeting
        fields = [
            'id',
            'company',
            'company_id',
            'company_name',
            'gong_meeting_id',
            'gong_call_id',
            'meeting_title',
            'meeting_date',
            'duration_seconds',
            'duration_minutes',
            'direction',
            'participants',
            'participant_count',
            'meeting_summary',
            'meeting_transcript',
            'raw_meeting_data',
            'ai_insights',
            'ai_processed',
            'ai_processed_at',
            'overall_sentiment',
            'key_topics',
            'deal_name',
            'deal_value',
            'deal_stage',
            'has_insights',
            'insights_categories',
            'last_synced_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'gong_meeting_id',
            'gong_call_id',
            'last_synced_at',
            'created_at',
            'updated_at',
            'ai_processed_at',
        ]
    
    def get_insights_categories(self, obj):
        """Get list of unique categories from AI insights"""
        return obj.get_all_categories()


class GongMeetingListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing meetings"""
    
    company_name = serializers.CharField(source='company.name', read_only=True)
    has_insights = serializers.BooleanField(read_only=True)
    insights_categories = serializers.SerializerMethodField()
    insights_count = serializers.SerializerMethodField()
    
    class Meta:
        model = GongMeeting
        fields = [
            'id',
            'company',
            'company_id',
            'company_name',
            'gong_meeting_id',
            'gong_call_id',
            'meeting_title',
            'meeting_date',
            'duration_seconds',
            'duration_minutes',
            'direction',
            'participants',
            'participant_count',
            'meeting_summary',
            'meeting_transcript',
            'overall_sentiment',
            'key_topics',
            'ai_insights',
            'ai_processed',
            'ai_processed_at',
            'has_insights',
            'insights_categories',
            'insights_count',
            'deal_name',
            'deal_value',
            'deal_stage',
            'raw_meeting_data',
            'last_synced_at',
            'created_at',
            'updated_at',
        ]
    
    def get_insights_categories(self, obj):
        """Get list of unique categories from AI insights"""
        return obj.get_all_categories()
    
    def get_insights_count(self, obj):
        """Get count of insights"""
        if obj.ai_insights and isinstance(obj.ai_insights, dict):
            insights = obj.ai_insights.get('insights', [])
            return len(insights) if isinstance(insights, list) else 0
        return 0

