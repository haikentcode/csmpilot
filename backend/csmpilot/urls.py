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
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView


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
                'description': 'List and manage customers (ViewSet)',
                'methods': ['GET', 'POST']
            },
            'customer_detail': {
                'url': request.build_absolute_uri('/api/customers/{id}/'),
                'description': 'Customer CRUD operations',
                'methods': ['GET', 'PUT', 'PATCH', 'DELETE']
            },
            'customer_dashboard': {
                'url': request.build_absolute_uri('/api/customers/{id}/dashboard/'),
                'description': 'Comprehensive customer dashboard',
                'methods': ['GET']
            },
            'customer_feedback': {
                'url': request.build_absolute_uri('/api/customers/{id}/feedback/'),
                'description': 'Customer-specific feedback',
                'methods': ['GET', 'POST']
            },
            'customer_meetings': {
                'url': request.build_absolute_uri('/api/customers/{id}/meetings/'),
                'description': 'Customer-specific meetings',
                'methods': ['GET', 'POST']
            },
            'health_summary': {
                'url': request.build_absolute_uri('/api/customers/health-summary/'),
                'description': 'Customer health analytics',
                'methods': ['GET']
            },
            'at_risk_customers': {
                'url': request.build_absolute_uri('/api/customers/at-risk/'),
                'description': 'Customers at risk of churning',
                'methods': ['GET']
            },
            'upcoming_renewals': {
                'url': request.build_absolute_uri('/api/customers/upcoming-renewals/'),
                'description': 'Customers with upcoming renewals',
                'methods': ['GET']
            },
            'feedback': {
                'url': request.build_absolute_uri('/api/customers/feedback/'),
                'description': 'All feedback (with filtering)',
                'methods': ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
            },
            'meetings': {
                'url': request.build_absolute_uri('/api/customers/meetings/'),
                'description': 'All meetings (with filtering)',
                'methods': ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
            },
            'admin': {
                'url': request.build_absolute_uri('/admin/'),
                'description': 'Django admin interface',
                'methods': ['GET']
            }
        },
        'documentation': {
            'swagger_ui': request.build_absolute_uri('/api/docs/'),
            'redoc': request.build_absolute_uri('/api/redoc/'),
            'openapi_schema': request.build_absolute_uri('/api/schema/')
        },
        'sample_usage': {
            'list_customers': 'GET /api/customers/',
            'customer_dashboard': 'GET /api/customers/1/dashboard/',
            'at_risk_customers': 'GET /api/customers/at-risk/',
            'upcoming_renewals': 'GET /api/customers/upcoming-renewals/',
            'customer_feedback': 'GET /api/customers/1/feedback/',
            'create_feedback': 'POST /api/customers/1/feedback/',
            'all_feedback': 'GET /api/customers/feedback/?customer=1',
            'health_analytics': 'GET /api/customers/health-summary/'
        }
    })


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api_root, name='api-root'),
    path('api/customers/', include('customers.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/gong/', include('gong.urls')),
    
    # API Documentation URLs (will work after installing drf-spectacular)
    # path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    # path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    # path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
