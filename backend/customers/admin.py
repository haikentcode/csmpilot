from django.contrib import admin
from .models import Customer, Feedback, Meeting, CustomerMetrics


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'industry', 'arr', 'health_score', 'renewal_date', 'last_updated']
    list_filter = ['health_score', 'industry', 'renewal_date']
    search_fields = ['name', 'industry']
    readonly_fields = ['last_updated', 'created_at']
    ordering = ['-arr']


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ['customer', 'title', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['customer__name', 'title']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    list_display = ['customer', 'date', 'summary', 'sentiment']
    list_filter = ['date', 'sentiment']
    search_fields = ['customer__name', 'summary']
    readonly_fields = ['created_at']


@admin.register(CustomerMetrics)
class CustomerMetricsAdmin(admin.ModelAdmin):
    list_display = ['customer', 'nps', 'usage_trend', 'active_users', 'renewal_rate']
    list_filter = ['usage_trend', 'updated_at']
    search_fields = ['customer__name']
    readonly_fields = ['updated_at', 'response_usage_percentage']
