from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'', views.CustomerViewSet, basename='customer')
router.register(r'feedback', views.FeedbackViewSet, basename='feedback')  
router.register(r'meetings', views.MeetingViewSet, basename='meeting')

# The API URLs are now determined automatically by the router
urlpatterns = [
    path('', include(router.urls)),
]