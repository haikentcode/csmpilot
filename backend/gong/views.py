from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import GongMeeting
from .serializers import GongMeetingSerializer, GongMeetingListSerializer
from .sync_service import GongSyncService
from .ai_service import GongAIService
from .tasks import sync_all_gong_meetings, process_meeting_with_ai


class GongMeetingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Gong meetings.
    """
    queryset = GongMeeting.objects.all()
    serializer_class = GongMeetingSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['company', 'direction', 'overall_sentiment', 'ai_processed']
    ordering_fields = ['meeting_date', 'duration_minutes', 'created_at']
    ordering = ['-meeting_date']
    search_fields = ['meeting_title', 'meeting_summary', 'company__name']
    
    def get_serializer_class(self):
        """Use lightweight serializer for list view"""
        if self.action == 'list':
            return GongMeetingListSerializer
        return GongMeetingSerializer
    
    def get_queryset(self):
        """Filter by customer if provided in query params"""
        queryset = GongMeeting.objects.select_related('company').all()
        customer_id = self.request.query_params.get('customer', None)
        if customer_id is not None:
            queryset = queryset.filter(company_id=customer_id)
        return queryset
    
    @action(detail=False, methods=['post'])
    def sync(self, request):
        """
        Manually trigger sync of Gong meetings.
        POST /api/gong/meetings/sync/
        """
        account_id = request.data.get('account_id')
        
        # Run sync task asynchronously
        task = sync_all_gong_meetings.delay(account_id=account_id)
        
        return Response({
            'status': 'queued',
            'task_id': task.id,
            'message': 'Gong sync task has been queued',
            'account_id': account_id
        }, status=status.HTTP_202_ACCEPTED)
    
    @action(detail=True, methods=['post'])
    def process_ai(self, request, pk=None):
        """
        Manually trigger AI processing for a specific meeting.
        POST /api/gong/meetings/{id}/process_ai/
        """
        meeting = self.get_object()
        
        # Run AI processing task asynchronously
        task = process_meeting_with_ai.delay(meeting.id)
        
        return Response({
            'status': 'queued',
            'task_id': task.id,
            'message': f'AI processing task has been queued for meeting {meeting.id}',
            'meeting_id': meeting.id
        }, status=status.HTTP_202_ACCEPTED)
    
    @action(detail=False, methods=['get'])
    def by_customer(self, request):
        """
        Get all meetings for a specific customer.
        GET /api/gong/meetings/by_customer/?customer_id=123
        """
        customer_id = request.query_params.get('customer_id')
        if not customer_id:
            return Response(
                {'error': 'customer_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        meetings = GongMeeting.objects.filter(company_id=customer_id)
        serializer = self.get_serializer(meetings, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def insights_summary(self, request):
        """
        Get summary of insights across all meetings.
        GET /api/gong/meetings/insights_summary/
        """
        from django.db.models import Count, Q
        
        total_meetings = GongMeeting.objects.count()
        processed_meetings = GongMeeting.objects.filter(ai_processed=True).count()
        
        # Count insights by category
        category_counts = {}
        for category in GongAIService.CATEGORIES:
            count = GongMeeting.objects.filter(
                ai_insights__insights__category=category
            ).count()
            category_counts[category] = count
        
        return Response({
            'total_meetings': total_meetings,
            'processed_meetings': processed_meetings,
            'unprocessed_meetings': total_meetings - processed_meetings,
            'insights_by_category': category_counts,
        })
