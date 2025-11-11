from django.core.management.base import BaseCommand
from customers.models import Customer, Feedback, Meeting, CustomerMetrics
from datetime import date, datetime
from decimal import Decimal


class Command(BaseCommand):
    help = 'Load sample customer data based on the provided JSON structure'

    def handle(self, *args, **options):
        # Clear existing data
        Customer.objects.all().delete()
        
        # Create sample customer data
        customer = Customer.objects.create(
            name="Emeritus Institute of Management",
            industry="education",
            arr=Decimal('150000.00'),
            health_score="healthy",
            renewal_date=date(2025, 12, 15),
        )
        
        # Create feedback
        feedback_data = [
            {
                "title": "Feature request: advanced reporting",
                "status": "open",
                "description": "Customer requested more detailed reporting capabilities for their analytics dashboard."
            },
            {
                "title": "Issue with API export",
                "status": "resolved",
                "description": "Customer reported issues with API data export functionality. Resolved after backend optimization."
            },
            {
                "title": "Request for custom branding options",
                "status": "in_progress",
                "description": "Customer wants to customize the platform with their branding elements."
            }
        ]
        
        for fb_data in feedback_data:
            Feedback.objects.create(
                customer=customer,
                **fb_data
            )
        
        # Create meetings
        meeting_data = [
            {
                "date": date(2025, 10, 28),
                "summary": "Renewal discussion — positive sentiment",
                "sentiment": "positive"
            },
            {
                "date": date(2025, 9, 15),
                "summary": "Integration troubleshooting",
                "sentiment": "neutral"
            },
            {
                "date": date(2025, 8, 20),
                "summary": "Quarterly business review",
                "sentiment": "positive"
            }
        ]
        
        for meeting_data_item in meeting_data:
            Meeting.objects.create(
                customer=customer,
                **meeting_data_item
            )
        
        # Create customer metrics
        CustomerMetrics.objects.create(
            customer=customer,
            nps=72,
            usage_trend="up",
            active_users=120,
            renewal_rate=Decimal('95.00'),
            seat_utilization=Decimal('85.50'),
            response_limit=1000,
            response_used=750
        )
        
        # Create additional sample customers
        additional_customers = [
            {
                "name": "TechCorp Solutions",
                "industry": "technology",
                "arr": Decimal('250000.00'),
                "health_score": "at_risk",
                "renewal_date": date(2025, 11, 30),
            },
            {
                "name": "HealthPlus Medical",
                "industry": "healthcare",
                "arr": Decimal('180000.00'),
                "health_score": "healthy",
                "renewal_date": date(2026, 2, 15),
            },
            {
                "name": "RetailMax Inc",
                "industry": "retail",
                "arr": Decimal('120000.00'),
                "health_score": "critical",
                "renewal_date": date(2025, 12, 1),
            }
        ]
        
        for cust_data in additional_customers:
            cust = Customer.objects.create(**cust_data)
            
            # Add basic metrics for each
            CustomerMetrics.objects.create(
                customer=cust,
                nps=65 if cust.health_score == "healthy" else (45 if cust.health_score == "at_risk" else 25),
                usage_trend="stable",
                active_users=80,
                renewal_rate=Decimal('88.00') if cust.health_score == "healthy" else Decimal('60.00'),
                seat_utilization=Decimal('70.00'),
                response_limit=500,
                response_used=300
            )
        
        self.stdout.write(
            self.style.SUCCESS('Successfully loaded sample customer data')
        )