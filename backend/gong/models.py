"""
Gong Meeting Models
Stores meeting data from Gong API with AI-processed insights.
"""

from django.db import models
from django.core.validators import MinValueValidator
from customers.models import Customer


class GongMeeting(models.Model):
    """
    Gong meeting record linked to Customer.
    Stores raw Gong data and AI-processed insights.
    """
    
    DIRECTION_CHOICES = [
        ('inbound', 'Inbound'),
        ('outbound', 'Outbound'),
    ]
    
    SENTIMENT_CHOICES = [
        ('positive', 'Positive'),
        ('neutral', 'Neutral'),
        ('negative', 'Negative'),
    ]
    
    # Relationship to Customer
    company = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name='gong_meetings',
        help_text="Customer/Company this meeting belongs to"
    )
    
    # Gong Identifiers
    gong_meeting_id = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        help_text="Unique Gong meeting/call ID"
    )
    
    gong_call_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        db_index=True,
        help_text="Alternative Gong call ID"
    )
    
    # Meeting Metadata
    meeting_title = models.CharField(
        max_length=500,
        help_text="Meeting title from Gong"
    )
    
    meeting_date = models.DateTimeField(
        help_text="Meeting start date/time"
    )
    
    duration_seconds = models.IntegerField(
        validators=[MinValueValidator(0)],
        help_text="Meeting duration in seconds"
    )
    
    duration_minutes = models.IntegerField(
        null=True,
        blank=True,
        help_text="Meeting duration in minutes (calculated)"
    )
    
    direction = models.CharField(
        max_length=20,
        choices=DIRECTION_CHOICES,
        default='outbound',
        help_text="Meeting direction"
    )
    
    # Participants
    participants = models.JSONField(
        default=list,
        blank=True,
        help_text="Array of participant objects from Gong"
    )
    
    participant_count = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Number of participants"
    )
    
    # Meeting Content
    meeting_summary = models.TextField(
        blank=True,
        help_text="Meeting summary from Gong"
    )
    
    meeting_transcript = models.TextField(
        blank=True,
        help_text="Full meeting transcript if available"
    )
    
    # Raw Data Storage
    raw_meeting_data = models.JSONField(
        default=dict,
        blank=True,
        help_text="Complete raw Gong API response"
    )
    
    # AI Processed Insights
    ai_insights = models.JSONField(
        default=dict,
        blank=True,
        help_text="AI-processed insights with categories"
    )
    
    ai_processed = models.BooleanField(
        default=False,
        help_text="Whether AI processing has been completed"
    )
    
    ai_processed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when AI processing was completed"
    )
    
    # Additional Metadata
    overall_sentiment = models.CharField(
        max_length=20,
        choices=SENTIMENT_CHOICES,
        blank=True,
        null=True,
        help_text="Overall sentiment from AI analysis"
    )
    
    key_topics = models.JSONField(
        default=list,
        blank=True,
        help_text="Key topics extracted from meeting"
    )
    
    # Deal/Opportunity Link (if available from Gong)
    deal_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Associated deal name from Gong"
    )
    
    deal_value = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Deal value if available"
    )
    
    deal_stage = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Deal stage if available"
    )
    
    # Sync tracking
    last_synced_at = models.DateTimeField(
        auto_now=True,
        help_text="Last sync timestamp from Gong"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    
    updated_at = models.DateTimeField(
        auto_now=True
    )
    
    class Meta:
        verbose_name = "Gong Meeting"
        verbose_name_plural = "Gong Meetings"
        ordering = ['-meeting_date']
        indexes = [
            models.Index(fields=['company', '-meeting_date']),
            models.Index(fields=['gong_meeting_id']),
            models.Index(fields=['ai_processed', '-meeting_date']),
        ]
    
    def __str__(self):
        return f"{self.company.name} - {self.meeting_title} ({self.meeting_date.date()})"
    
    def save(self, *args, **kwargs):
        # Calculate duration in minutes
        if self.duration_seconds:
            self.duration_minutes = round(self.duration_seconds / 60, 1)
        
        # Calculate participant count
        if self.participants:
            self.participant_count = len(self.participants)
        
        super().save(*args, **kwargs)
    
    @property
    def has_insights(self):
        """Check if meeting has AI insights"""
        return bool(self.ai_insights.get('insights', []))
    
    def get_insights_by_category(self, category):
        """Get insights filtered by category"""
        if not self.ai_insights:
            return []
        return [
            insight for insight in self.ai_insights.get('insights', [])
            if insight.get('category') == category
        ]
    
    def get_all_categories(self):
        """Get all unique categories from insights"""
        if not self.ai_insights:
            return []
        categories = set()
        for insight in self.ai_insights.get('insights', []):
            categories.add(insight.get('category'))
        return list(categories)
