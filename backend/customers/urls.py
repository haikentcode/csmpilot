from django.urls import path
from . import views

urlpatterns = [
    # Customer endpoints
    path('', views.CustomerListCreateView.as_view(), name='customer-list-create'),
    path('<int:pk>/', views.CustomerDetailView.as_view(), name='customer-detail'),
    path('<int:customer_id>/dashboard/', views.customer_dashboard, name='customer-dashboard'),
    
    # Feedback endpoints
    path('feedback/', views.FeedbackListCreateView.as_view(), name='feedback-list-create'),
    path('feedback/<int:pk>/', views.FeedbackDetailView.as_view(), name='feedback-detail'),
    path('<int:customer_id>/feedback/', views.FeedbackListCreateView.as_view(), name='customer-feedback'),
    
    # Meeting endpoints
    path('meetings/', views.MeetingListCreateView.as_view(), name='meeting-list-create'),
    path('meetings/<int:pk>/', views.MeetingDetailView.as_view(), name='meeting-detail'),
    path('<int:customer_id>/meetings/', views.MeetingListCreateView.as_view(), name='customer-meetings'),
    
    # Analytics endpoints
    path('health-summary/', views.health_score_summary, name='health-summary'),
]