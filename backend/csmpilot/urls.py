"""
URL configuration for csmpilot project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.reverse import reverse


@api_view(['GET'])
def api_root(request, format=None):
    """
    CSM Copilot API Root
    
    Welcome to the CSM Copilot API! This API provides comprehensive customer success management functionality.
    
    Available endpoints:
    """
    return Response({
        'message': 'Welcome to CSM Copilot API 🚀',
        'version': '1.0.0',
        'description': 'Customer Success Management Platform',
        'endpoints': {
            'customers': {
                'url': request.build_absolute_uri('/api/customers/'),
                'description': 'List and manage customers',
                'methods': ['GET', 'POST']
            },
            'customer_detail': {
                'url': request.build_absolute_uri('/api/customers/{id}/'),
                'description': 'Get, update, or delete specific customer',
                'methods': ['GET', 'PUT', 'PATCH', 'DELETE']
            },
            'customer_dashboard': {
                'url': request.build_absolute_uri('/api/customers/{id}/dashboard/'),
                'description': 'Get comprehensive customer dashboard with metrics',
                'methods': ['GET']
            },
            'feedback': {
                'url': request.build_absolute_uri('/api/customers/feedback/'),
                'description': 'Customer feedback management',
                'methods': ['GET', 'POST']
            },
            'customer_feedback': {
                'url': request.build_absolute_uri('/api/customers/{id}/feedback/'),
                'description': 'Get feedback for specific customer',
                'methods': ['GET', 'POST']
            },
            'meetings': {
                'url': request.build_absolute_uri('/api/customers/meetings/'),
                'description': 'Customer meetings management',
                'methods': ['GET', 'POST']
            },
            'customer_meetings': {
                'url': request.build_absolute_uri('/api/customers/{id}/meetings/'),
                'description': 'Get meetings for specific customer',
                'methods': ['GET', 'POST']
            },
            'health_summary': {
                'url': request.build_absolute_uri('/api/customers/health-summary/'),
                'description': 'Customer health score analytics',
                'methods': ['GET']
            },
            'admin': {
                'url': request.build_absolute_uri('/admin/'),
                'description': 'Django admin interface',
                'methods': ['GET']
            }
        },
        'sample_usage': {
            'get_all_customers': 'GET /api/customers/',
            'get_customer_dashboard': 'GET /api/customers/1/dashboard/',
            'create_feedback': 'POST /api/customers/1/feedback/',
            'health_analytics': 'GET /api/customers/health-summary/'
        }
    })


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api_root, name='api-root'),
    path('api/customers/', include('customers.urls')),
    path('api/analytics/', include('analytics.urls')),
]
