from django.contrib import admin
from .models import GongMeeting


@admin.register(GongMeeting)
class GongMeetingAdmin(admin.ModelAdmin):
    list_display = [
        'meeting_title',
        'company',
        'meeting_date',
        'duration_minutes',
        'direction',
        'overall_sentiment',
        'ai_processed',
        'participant_count',
    ]
    list_filter = [
        'direction',
        'overall_sentiment',
        'ai_processed',
        'meeting_date',
        'company',
    ]
    search_fields = [
        'meeting_title',
        'company__name',
        'gong_meeting_id',
        'meeting_summary',
    ]
    readonly_fields = [
        'gong_meeting_id',
        'gong_call_id',
        'last_synced_at',
        'created_at',
        'updated_at',
        'ai_processed_at',
        'raw_meeting_data',
        'ai_insights',
    ]
    fieldsets = (
        ('Meeting Information', {
            'fields': (
                'company', 'gong_meeting_id', 'gong_call_id',
                'meeting_title', 'meeting_date', 'duration_seconds', 'duration_minutes',
                'direction', 'participants', 'participant_count'
            )
        }),
        ('Meeting Content', {
            'fields': ('meeting_summary', 'meeting_transcript')
        }),
        ('Deal Information', {
            'fields': ('deal_name', 'deal_value', 'deal_stage')
        }),
        ('AI Processing', {
            'fields': (
                'ai_processed', 'ai_processed_at', 'overall_sentiment',
                'key_topics', 'ai_insights'
            )
        }),
        ('Raw Data', {
            'fields': ('raw_meeting_data',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('last_synced_at', 'created_at', 'updated_at')
        }),
    )
    ordering = ['-meeting_date']
    date_hierarchy = 'meeting_date'
    
    def get_queryset(self, request):
        return super().get_queryset().select_related('company')
