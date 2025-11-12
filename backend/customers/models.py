from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Customer(models.Model):
    HEALTH_CHOICES = [
        ('healthy', 'Healthy'),
        ('at_risk', 'At Risk'),
        ('critical', 'Critical'),
    ]
    
    INDUSTRY_CHOICES = [
        ('education', 'Education'),
        ('technology', 'Technology'),
        ('healthcare', 'Healthcare'),
        ('finance', 'Finance'),
        ('retail', 'Retail'),
        ('manufacturing', 'Manufacturing'),
        ('other', 'Other'),
    ]
    
    name = models.CharField(max_length=255)
    industry = models.CharField(max_length=50, choices=INDUSTRY_CHOICES)
    arr = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    health_score = models.CharField(max_length=20, choices=HEALTH_CHOICES)
    renewal_date = models.DateField()
    
    # Salesforce Integration Fields (core customer data from Salesforce)
    salesforce_account_id = models.CharField(
        max_length=18,
        blank=True,
        db_index=True,
        help_text="Salesforce Account ID for syncing"
    )
    
    salesforce_synced = models.BooleanField(
        default=False,
        help_text="Whether customer data is synced from Salesforce"
    )
    
    last_salesforce_sync = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Last successful Salesforce sync timestamp"
    )
    
    # Gainsight Integration Fields (core customer data from Gainsight)
    gainsight_company_id = models.CharField(
        max_length=50,
        blank=True,
        db_index=True,
        help_text="Gainsight Company GSID for syncing"
    )
    
    gainsight_synced = models.BooleanField(
        default=False,
        help_text="Whether customer data is synced from Gainsight"
    )
    
    last_gainsight_sync = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Last successful Gainsight sync timestamp"
    )
    
    # Products - Array of SurveyMonkey products the customer uses
    products = models.JSONField(
        default=list,
        blank=True,
        help_text="List of SurveyMonkey products the customer is using (SME, Audience, MRX, GetFeedback, etc.)"
    )
    
    last_updated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-arr', 'name']
    
    def __str__(self):
        return self.name


class Feedback(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='feedback')
    title = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.customer.name} - {self.title}"


class Meeting(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='meetings')
    date = models.DateField()
    summary = models.TextField()
    participants = models.TextField(blank=True, help_text="Comma-separated list of participants")
    sentiment = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.customer.name} - {self.date}"


class CustomerMetrics(models.Model):
    USAGE_TREND_CHOICES = [
        ('up', 'Up'),
        ('down', 'Down'),
        ('stable', 'Stable'),
    ]
    
    customer = models.OneToOneField(Customer, on_delete=models.CASCADE, related_name='metrics')
    nps = models.IntegerField(
        validators=[MinValueValidator(-100), MaxValueValidator(100)],
        help_text="Net Promoter Score (-100 to 100)"
    )
    usage_trend = models.CharField(max_length=10, choices=USAGE_TREND_CHOICES)
    active_users = models.PositiveIntegerField()
    renewal_rate = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Renewal rate as a percentage"
    )
    seat_utilization = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        default=0,
        help_text="Seat utilization as a percentage"
    )
    response_limit = models.PositiveIntegerField(default=0)
    response_used = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.customer.name} Metrics"
    
    @property
    def response_usage_percentage(self):
        if self.response_limit == 0:
            return 0
        return (self.response_used / self.response_limit) * 100
