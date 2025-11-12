from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GongMeetingViewSet

router = DefaultRouter()
router.register(r'meetings', GongMeetingViewSet, basename='gong-meeting')

urlpatterns = [
    path('', include(router.urls)),
]

